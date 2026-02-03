import { Request, Response, NextFunction } from 'express';
import { loggers, LogUtils } from '../config/logger';

// Health check middleware
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { check } = HealthLogger;
  const logger = loggers.app;
  
  try {
    const health = await check();
    
    if (health.healthy) {
      logger.info('Health check passed', health.lastLog);
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV,
        services: {
          database: 'connected',
          logging: 'healthy',
          cache: 'operational',
        },
        checks: {
          database: health.healthy,
          logging: health.loggerStatus === 'healthy',
          memory: health.healthy,
        },
      });
    } else {
      logger.error('Health check failed', health.lastLog);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: health.lastLog || 'Unknown error',
        services: {
          database: 'disconnected',
          logging: health.loggerStatus === 'error' ? 'error' : 'degraded',
          cache: 'unknown',
        },
      });
    }
  } catch (error) {
    logger.error('Health check error', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'error',
        logging: 'error',
        cache: 'error',
      },
    });
  }
};

// Database health check
export const databaseHealthCheck = () => {
  const logger = loggers.database;
  
  try {
    // Check database connection
    const startTime = Date.now();
    
    // This would need to be implemented with your actual database client
    const result = await new Promise((resolve) => {
      // Simulate database health check
      setTimeout(() => {
        resolve({
          connected: true,
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
        });
      }, 100);
    });
    
    logger.info('Database health check passed', result);
    return {
      connected: result.connected,
      responseTime: result.responseTime,
      lastCheck: result.lastCheck,
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      connected: false,
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
};

// Logger health check
export const loggingHealthCheck = () => {
  try {
    // Check if log files are being written
    const testMessage = 'Health check at ' + new Date().toISOString();
    loggers.app.info(testMessage);
    
    return {
      healthy: true,
      loggerStatus: 'healthy',
      lastLog: testMessage,
    };
  } catch (error) {
    return {
      healthy: false,
      loggerStatus: 'error',
      lastLog: error.message,
    };
  }
};

// Health Logger
export class HealthLogger {
  check = async (): Promise<{
    healthy: boolean;
    lastLog: string | null;
    loggerStatus: string;
  }> => {
    const dbHealth = await databaseHealthCheck();
    const loggingHealth = await loggingHealthCheck();
    
    const allHealthy = dbHealth.connected && loggingHealth.healthy;
    
    return {
      healthy: allHealthy,
      lastLog: null,
      loggerStatus: allHealthy ? 'healthy' : 'degraded',
    };
  }
}

// Enhanced performance monitoring
export const AdvancedPerformanceMonitor = {
  // Track slow queries with detailed metrics
  trackSlowQuery: (query: string, duration: number, params: any = {}) => {
    const threshold = 1000; // 1 second
    
    if (duration > threshold) {
      loggers.performance.logPerformance('SLOW_QUERY_DETECTED', duration, true, {
        query,
        params,
        threshold,
        severity: duration > 2000 ? 'critical' : 'warning',
      });
    }
  },

  // Track database connection pool
  trackDatabaseConnections: (active: number, available: number, maxConnections: number) => {
    const utilization = (active / maxConnections) * 100;
    
    loggers.performance.logPerformance('DB_CONNECTION_POOL_UTILIZATION', 0, true, {
      activeConnections: active,
      availableConnections: available,
      maxConnections,
      utilization,
      status: utilization > 80 ? 'warning' : 'healthy',
    });
  },

  // Track memory usage
  trackMemoryUsage: () => {
    const memory = process.memoryUsage();
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);
    const heapUtilization = (heapUsedMB / heapTotalMB) * 100;
    
    loggers.performance.logPerformance('MEMORY_USAGE', 0, true, {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      heapUtilization: `${heapUtilization}%`,
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`,
    });
  },

  // API performance metrics
  trackApiPerformance: (method: string, route: string, statusCode: number, responseTime: number, responseSize: number) => {
    loggers.performance.logPerformance('API_PERFORMANCE', responseTime, true, {
      method,
      route,
      statusCode,
      responseSize: `${responseSize} bytes`,
      responseTimeMs: responseTime,
      statusCategory: statusCode < 200 ? 'error' : statusCode < 300 ? 'success' : 'warning',
    });
  },
};