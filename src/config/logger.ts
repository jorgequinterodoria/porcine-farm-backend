import pino, { DestinationStream, LoggerOptions } from 'pino';


export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  error?: Error;
  operation?: string;
  module?: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: LogContext;
  timestamp: string;
  pid: number;
  hostname: string;
}

export interface PerformanceMetrics {
  name: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}


const pinoConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  
  transport: process.env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : 
      
      {
        target: 'pino/file',
        options: {
          destination: './logs/app.log',
          mkdir: true,
          sync: false,
        },
      },
  
  
  base: {
    pid: process.pid,
    hostname: require('os').hostname(),
    level: process.env.LOG_LEVEL || 'info',
  },
  
  
  serializers: {
    
    error: (err: Error) => ({
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: (err as any).code,
    }),
    
    
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
      headers: req.headers,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }),
    
    
    res: (res: any) => ({
      statusCode: res.statusCode,
      responseTime: res.responseTime,
    }),
  },
  
  
  redact: process.env.NODE_ENV === 'production' 
    ? [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.password',
        'req.body.password',
        'req.body.token',
        'context.jwt',
        'context.apiKey',
      ]
    : [],
};


export const logger = pino(pinoConfig);


export class StructuredLogger {
  private context: LogContext = {};
  private operationTimers: Map<string, number> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor(context: Partial<LogContext> = {}) {
    this.context = { ...context };
  }

  
  withContext(context: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...context });
  }

  
  startTimer(operation: string): StructuredLogger {
    this.operationTimers.set(operation, Date.now());
    return this.withContext({ operation });
  }

  
  endTimer(success: boolean = true, metadata: Record<string, any> = {}): void {
    const lastOperation = this.context.operation;
    if (lastOperation && this.operationTimers.has(lastOperation)) {
      const startTime = this.operationTimers.get(lastOperation)!;
      const duration = Date.now() - startTime;
      
      
      this.performanceMetrics.push({
        name: lastOperation,
        duration,
        success,
        metadata,
      });
      
      
      this.info(`Operation ${lastOperation} completed`, {
        ...this.context,
        operation: lastOperation,
        duration,
        success,
        metadata,
      });
      
      this.operationTimers.delete(lastOperation);
    }
  }

  
  debug(message: string, extra: Partial<LogContext> = {}): void {
    this.logger.debug(message, {
      ...this.context,
      ...extra,
      level: 'debug',
    });
  }

  info(message: string, extra: Partial<LogContext> = {}): void {
    this.logger.info(message, {
      ...this.context,
      ...extra,
      level: 'info',
    });
  }

  warn(message: string, extra: Partial<LogContext> = {}): void {
    this.logger.warn(message, {
      ...this.context,
      ...extra,
      level: 'warn',
    });
  }

  error(message: string, error?: Error, extra: Partial<LogContext> = {}): void {
    this.logger.error(message, {
      ...this.context,
      ...extra,
      level: 'error',
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }

  fatal(message: string, error?: Error, extra: Partial<LogContext> = {}): void {
    this.logger.fatal(message, {
      ...this.context,
      ...extra,
      level: 'fatal',
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }

  
  logSecurity(event: string, details: Record<string, any> = {}): void {
    this.warn(`Security Event: ${event}`, {
      ...this.context,
      securityEvent: event,
      ...details,
    });
  }

  
  logPerformance(operation: string, duration: number, success: boolean, metadata: Record<string, any> = {}): void {
    this.performanceMetrics.push({
      name: operation,
      duration,
      success,
      metadata,
    });
    
    this.info(`Performance: ${operation}`, {
      ...this.context,
      operation,
      duration,
      success,
      metadata,
    });
  }

  
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  
  clearMetrics(): void {
    this.performanceMetrics = [];
  }
}


export const loggers = {
  
  app: new StructuredLogger({
    module: 'application',
  }),

  
  database: new StructuredLogger({
    module: 'database',
  }),

  
  security: new StructuredLogger({
    module: 'security',
  }),

  
  performance: new StructuredLogger({
    module: 'performance',
  }),

  
  request: new StructuredLogger({
    module: 'http-request',
  }),

  
  auth: new StructuredLogger({
    module: 'authentication',
  }),
};


export const LogUtils = {
  
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  
  extractUserInfo(req: any): Partial<LogContext> => {
    return {
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      role: req.user?.role,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };
  },

  
  calculateResponseTime(startTime: number): number {
    return Date.now() - startTime;
  },

  
  formatError(error: Error): any {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  },

  
  logRateLimit(req: any, limit: number, window: number): void {
    loggers.security.logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      limit,
      window,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });
  },

  
  logAuthEvent(event: string, userId?: string, tenantId?: string, ip?: string, success: boolean = true): void {
    const logger = loggers.auth.withContext({
      userId,
      tenantId,
      ip,
      success,
    });

    if (success) {
      logger.info(`Auth success: ${event}`);
    } else {
      logger.warn(`Auth failure: ${event}`);
    }
  },

  
  logDbOperation(operation: string, table: string, duration: number, success: boolean, error?: Error): void {
    const logger = loggers.database.withContext({
      operation,
      table,
      duration,
      success,
    });

    if (success) {
      logger.info(`DB operation: ${operation} on ${table}`, {
        operation,
        table,
        duration,
      });
    } else {
      logger.error(`DB operation failed: ${operation} on ${table}`, error);
    }
  },
};


export const HealthLogger = {
  check: (): { healthy: boolean; lastLog: string | null; loggerStatus: string } => {
    try {
      const testMessage = 'Health check at ' + new Date().toISOString();
      loggers.app.info(testMessage);
      return {
        healthy: true,
        lastLog: testMessage,
        loggerStatus: 'healthy',
      };
    } catch (error) {
      return {
        healthy: false,
        lastLog: null,
        loggerStatus: 'error: ' + (error as Error).message,
      };
    }
  },
};


export const PerformanceMonitor = {
  
  slowQueryThreshold: 1000, 

  logSlowQuery(query: string, duration: number, params: any = {}): void {
    if (duration > PerformanceMonitor.slowQueryThreshold) {
      loggers.performance.logPerformance('SLOW_QUERY', duration, true, {
        query,
        params,
        threshold: PerformanceMonitor.slowQueryThreshold,
      });
    }
  },

  
  slowApiThreshold: 5000, 

  logSlowApi(route: string, method: string, statusCode: number, responseTime: number): void {
    if (responseTime > PerformanceMonitor.slowApiThreshold) {
      loggers.performance.logPerformance('SLOW_API', responseTime, true, {
        route,
        method,
        statusCode,
        responseTime,
        threshold: PerformanceMonitor.slowApiThreshold,
      });
    }
  },

  
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
    fastestOperation: PerformanceMetrics | null;
  } {
    const metrics = loggers.performance.getPerformanceMetrics();
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
      };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const sortedByDuration = [...metrics].sort((a, b) => b.duration - a.duration);

    return {
      totalOperations: metrics.length,
      averageDuration: totalDuration / metrics.length,
      slowestOperation: sortedByDuration[0],
      fastestOperation: sortedByDuration[sortedByDuration.length - 1],
    };
  },
};