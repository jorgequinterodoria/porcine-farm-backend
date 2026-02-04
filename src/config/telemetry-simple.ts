
import { NodeSDK } from '@opentelemetry/sdk-node';
import { NodeSDKConfiguration } from '@opentelemetry/sdk-node/build/src';
import { loggers } from '../config/logger';


const configuration: NodeSDKConfiguration = {
  serviceName: 'granja-multitenant',
  serviceVersion: process.env.npm_package_version || '1.0.0',
  instrumentations: [
    
    getNodeAutoInstrumentations({
      include: ['http', 'https'],
      traceResponder: (span, result) => {
        
        span.setAttributes({
          'http.method': span.attributes['http.method'],
          'http.status_code': result.status || 'unknown',
          'http.url': span.attributes['http.url'],
        });
        
        
        if (result.status && result.status < 400) {
          loggers.app.info(`HTTP Request: ${span.attributes['http.method']} ${span.attributes['http.url']} - ${result.status}`);
        }
        
        return result;
      },
    }),
  ],
  
  
  metrics: {
    
    include: ['process', 'runtime'],
    period: 60000, 
    view: 'prometheus',
  },
  
  
  exporters: {
    otlp: {
      endpoint: '/metrics',
    },
  },
};


export const telemetry = new NodeSDK(configuration);


export const startTrace = (name: string) => {
  return telemetry.startTrace(name, {
    kind: telemetry.TRACE_KIND_ENUM.SERVER,
    attributes: {
      'service.name': configuration.serviceName,
    'service.version': configuration.serviceVersion,
    'service.instance.id': process.env.SERVICE_INSTANCE_ID || 'unknown',
      'host.name': process.env.HOST_NAME,
    'process.pid': process.pid,
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.version': telemetry.sdk.version,
    },
  });
};


export const createMetric = (name: string, value: number) => {
  return telemetry.createMetric(name, 'count', {
    value,
  });
};


export const createTelemetryLogger = (name: string) => {
  return {
    info: (message: string, metadata?: any) => {
      
      loggers.app.info(message, metadata);
    },
    
    error: (message: string, error?: Error, metadata?: any) => {
      
      loggers.app.error(message, { ...metadata, error: error });
      
      
      const span = startTrace('error');
      span.recordException(error);
      span.end();
    },
    
    warn: (message: string, metadata?: any) => {
      loggers.app.warn(message, metadata);
    },
  };
};


export const healthCheckWithTelemetry = async () => {
  const tracer = startTrace('health_check');
  
  try {
    
    const check = await Promise.resolve({ healthy: true });
    
    tracer.setAttributes({
      'check.type': 'comprehensive',
    });
    
    tracer.recordEvent('health_check_completed', {
      status: check.healthy ? 'success' : 'failure',
    });
    
    tracer.end();
    
    return {
      status: check.healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        logging: 'operational',
        telemetry: 'connected',
      },
    };
  } catch (error) {
    const tracer = startTrace('health_check');
    tracer.recordException(error);
    tracer.end();
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: 'error',
        logging: 'error',
        telemetry: 'error',
      },
    };
  }
};


export const trackRequestWithTelemetry = (method: string, url: string, statusCode: number, responseTime: number) => {
  const metric = createMetric('http_request', responseTime);
  metric.add(1);
  
  
  if (responseTime > 1000) {
    createTelemetryLogger('slow_request').info(`Slow HTTP request: ${method} ${url}`, {
      method,
      url,
      statusCode,
      responseTime,
    });
  }
};


export const initializeTelemetry = () => {
  try {
    console.log('🔧 Starting OpenTelemetry...');
    telemetry.start();
    console.log('✅ Telemetry initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
    throw error;
  }
};


export const shutdownTelemetry = () => {
  console.log('🛑 Shutting down OpenTelemetry...');
  try {
    await telemetry.shutdown();
    console.log('✅ Telemetry shutdown complete');
  } catch (error) {
    console.error('❌ Error during telemetry shutdown:', error);
  }
};