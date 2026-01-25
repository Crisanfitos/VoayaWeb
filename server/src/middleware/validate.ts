/**
 * Validation Middleware
 * Generic middleware for validating requests with Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationType = 'body' | 'query' | 'params';

/**
 * Creates a validation middleware for the specified schema and request part
 */
export function validate(schema: ZodSchema, type: ValidationType = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToValidate = type === 'body' ? req.body
                : type === 'query' ? req.query
                    : req.params;

            const result = schema.safeParse(dataToValidate);

            if (!result.success) {
                const errors = formatZodErrors(result.error);
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors
                });
            }

            // Replace the validated data (with defaults applied)
            // Note: Only body can be safely replaced, query/params are read-only in Express
            if (type === 'body') {
                req.body = result.data;
            }
            // For query and params, the validation ensures correctness but we don't replace

            next();
        } catch (error) {
            console.error('Validation error:', error);
            res.status(400).json({ error: 'Invalid request data' });
        }
    };
}

/**
 * Formats Zod errors into a user-friendly format
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(issue.message);
    }

    return errors;
}

/**
 * Shorthand validators for common use cases
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
