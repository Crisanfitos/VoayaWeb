/**
 * Authentication Middleware
 * Verifies JWT tokens from Supabase Auth
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase/admin';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: string;
            };
        }
    }
}

/**
 * Authentication middleware - REQUIRED
 * Returns 401 if no valid token is provided
 */
export async function authRequired(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header required' });
        }

        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * Authentication middleware - OPTIONAL
 * Attaches user to request if valid token is provided, but doesn't require it
 */
export async function authOptional(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user
            return next();
        }

        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && user) {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };
        }

        next();
    } catch (error) {
        // Don't fail on auth errors for optional auth
        console.warn('Optional auth failed:', error);
        next();
    }
}
