import { Request, Response, NextFunction } from 'express';


const sanitizeString = (str: any): any => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') 
    .trim();
};


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
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  
  if (req.query) {
    const sanitizedQuery = sanitizeObject(req.query);
    
    Object.keys(sanitizedQuery).forEach((key) => {
      (req.query as any)[key] = sanitizedQuery[key];
    });
  }
  
  
  if (req.params) {
    const sanitizedParams = sanitizeObject(req.params);
    
    Object.keys(sanitizedParams).forEach((key) => {
      (req.params as any)[key] = sanitizedParams[key];
    });
  }
  
  next();
};