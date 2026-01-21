import { Request, Response, NextFunction } from 'express';

// Función para sanitizar strings (prevenir XSS básico)
const sanitizeString = (str: any): any => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
};

// Función recursiva para sanitizar objetos
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return sanitizeString(obj);
};

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query params
  if (req.query) {
    const sanitizedQuery = sanitizeObject(req.query);
    // Mutar el objeto existente en lugar de reasignarlo (req.query puede ser read-only)
    Object.keys(sanitizedQuery).forEach((key) => {
      (req.query as any)[key] = sanitizedQuery[key];
    });
  }
  
  // Sanitizar params
  if (req.params) {
    const sanitizedParams = sanitizeObject(req.params);
    // Mutar el objeto existente en lugar de reasignarlo
    Object.keys(sanitizedParams).forEach((key) => {
      (req.params as any)[key] = sanitizedParams[key];
    });
  }
  
  next();
};