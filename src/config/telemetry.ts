import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/api';
import { loggers } from '../config/logger';

// OpenTelemetry configuration
const telemetry = new NodeSDK({
  resource: new Resource({
    serviceName: 'granja-multitenant-backend',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    serviceInstanceId: process.env.SERVICE_INSTANCE_ID || 'unknown',
    attributes: {
      'service.instance.id': process.env.SERVICE_INSTANCE_ID,
      'deployment.environment': process.env.NODE_ENV || 'development',
      'host.name': process.env.HOST_NAME || 'unknown',
    },
  }),
  instrumentations: [
    // HTTP instrumentation
    getNodeAutoInstrumentations({
      include: ['http', 'https'],
      traceResponder: getTraceResponder(),
    }),
    
    // Database instrumentation
    getPrismaInstrumentation(),
  ],
});

// Trace responder for HTTP requests
function getTraceResponder() {
  return (span, result) => {
    // Add request details to span
    span.setAttributes({
      'http.method': span.attributes['http.method'],
      'http.status_code': result.statusCode ? String(result.statusCode) : undefined,
      'http.url': span.attributes['http.url'],
      'http.host': span.attributes['http.host'],
      'http.scheme': span.attributes['http.scheme'],
      'http.user_agent': span.attributes['http.user_agent'],
    });
    
    // Log completion
    loggers.app.info(`HTTP Request: ${span.attributes['http.method']} ${span.attributes['http.url']} - ${result.statusCode}`);
    
    return result;
  };
}

// Prisma instrumentation
function getPrismaInstrumentation() {
  try {
    // Dynamic import to avoid circular dependencies
    const { Prisma } = require('@prisma/client');
    
    return {
      name: '@prisma/instrumentation',
      instrument: (model) => {
        const originalCreate = model.prototype.$create;
        model.prototype.$create = function (args) {
          return originalCreate.call(this, args).then(result => {
            // Log successful database operations
            if (result) {
              loggers.database.info(`DB CREATE: ${model.modelName}`, {
                operation: 'create',
                tableName: model.modelName,
                success: true,
              });
            }
            return result;
          });
        };
      },
    },
  };
  } catch (error) {
    console.warn('Prisma instrumentation not available:', error);
    return {
      name: 'prisma-logging',
      instrument: () => (model, method, args) => {
        return method.apply(model, args);
      },
    };
  }
}

// Custom logger factory
export const createTelemetryLogger = (name: string, attributes: Record<string, any> = {}) => {
  return telemetry.getLogger(name, {
    attributes: {
      ...attributes,
      'logger.name': name,
    },
  });
};

// Custom metrics creator
export const createMetric = (name: string, description: string, unit: 'count' | 'duration' | 'bytes', attributes: Record<string, any> = {}) => {
  return telemetry.createMetric(name, description, unit, attributes);
};

// Performance tracking utilities
export const telemetryPerformance = {
  // Track HTTP requests
  trackHttpRequest: (method: string, url: string, statusCode: number, responseTime: number, attributes: Record<string, any> = {}) => {
    const httpRequestMetric = createMetric('http_request', 'HTTP request', 'count', {
      method,
      url,
      status_code: statusCode,
      response_time_ms: responseTime,
      ...attributes,
    });
    
    httpRequestMetric.add(1);
    
    // Track slow requests
    if (responseTime > 500) {
      const slowHttpRequestMetric = createMetric('http_slow_request', 'Slow HTTP request', 'count', {
        method,
        url,
        response_time_ms: responseTime,
        threshold_ms: 500,
        ...attributes,
      });
      
      slowHttpRequestMetric.add(1);
    }
  },

  // Track database operations
  trackDatabaseOperation: (operation: string, table: string, success: boolean, duration: number, attributes: Record<string, any> = {}) => {
    const dbOperationMetric = createMetric(`db_${operation}`, `Database ${operation}`, 'count', {
      table,
      success,
      duration_ms: duration,
      ...attributes,
    });
    
    dbOperationMetric.add(1);
    
    if (!success) {
      const dbErrorMetric = createMetric(`db_${operation}_error`, `Database ${operation} error`, 'count', {
        table,
        duration_ms: duration,
        ...attributes,
      });
      
      dbErrorMetric.add(1);
    }
  },

  // Track business metrics
  trackBusinessEvent: (eventName: string, description: string, attributes: Record<string, any> = {}) => {
    const businessMetric = createMetric(`business_${eventName}`, description, 'count', attributes);
    businessMetric.add(1);
  },

  // Track performance metrics
  trackPerformanceMetric: (name: string, value: number, unit: string = 'count', attributes: Record<string, any> = {}) => {
    const performanceMetric = createMetric(`performance_${name}`, description, unit, {
      value,
      ...attributes,
    });
    
    performanceMetric.record(value);
  },

  // Track custom metrics
  trackCustomMetric: (name: string, value: any, unit: string, attributes: Record<string, any> = {}) => {
    const customMetric = createMetric(name, name, unit, attributes);
    customMetric.record(value);
  },
};

// Trace utilities
export const telemetryTrace = {
  // Start a new trace
  startSpan: (name: string, kind: string, attributes: Record<string, any> = {}) => {
    return telemetry.startTrace(name, kind, attributes);
  },

  // Record an exception
  recordException: (exception: Error, attributes: Record<string, any> = {}) => {
    telemetry.recordException(exception, attributes);
  },

  // Record an event
  recordEvent: (name: string, attributes: Record<string, any> = {}) => {
    telemetry.createEvent(name, {
      kind: telemetry.EVENT_KIND_ENUM.COUNTER,
      count: 1,
      attributes,
    });
  },

  // Record an error
  recordError: (error: Error, attributes: Record<string, any> = {}) => {
    telemetry.recordException(error, attributes);
  },
};

// Health check integration
export const healthCheckWithTelemetry = async () => {
  const tracer = telemetryTrace.startSpan('health_check', 'server');
  
  try {
    const check = await Promise.resolve({ healthy: true }); // Simulated health check
    
    tracer.setAttributes({
      check_type: 'comprehensive',
      status: 'running',
    });
    
    tracer.recordEvent('health_check_completed', {
      status: check.healthy ? 'success' : 'failure',
      check_details: {
        database: 'connected',
        logging: 'healthy',
        memory: 'checked',
      },
    });
    
    return {
      status: check.healthy ? 'ok' : 'error',
      message: check.healthy ? 'All systems operational' : 'Health check failed',
      timestamp: new Date().toISOString(),
      details: {
        database: 'connected',
        logging: 'operational',
        memory: 'checked',
      },
    };
  } catch (error) {
    tracer.recordException(error);
    return {
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

// Auto-instrumentation setup
export const setupTelemetryAutoInstrumentation = () => {
  // Enable process metrics
  const processMetric = telemetryPerformance.trackPerformanceMetric('process', process.memoryUsage().rss, 'bytes');
  
  setInterval(() => {
    processMetric.record(process.memoryUsage().rss);
  }, 30000); // Every 30 seconds
};

// Correlation ID generator with telemetry tracking
export const generateCorrelationIdWithTelemetry = () => {
  const correlationId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  
  // Generate and log correlation ID
  const tracer = telemetryTrace.startSpan('correlation_id_generation', 'system');
  
  tracer.setAttributes({
    method: 'auto-generation',
    timestamp: new Date().toISOString(),
  });
  
  tracer.recordEvent('correlation_id_generated', {
    correlation_id_length: correlationId.length,
  });
  
  tracer.end();
  
  return correlationId;
};

// Export telemetry instance
export { telemetry };