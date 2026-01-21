import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler.middleware';

export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });

            if (parsed.body) req.body = parsed.body;
            if (parsed.query) req.query = parsed.query as any;
            if (parsed.params) req.params = parsed.params as any;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: formattedErrors
                });
            }
            next(error);
        }
    };
};