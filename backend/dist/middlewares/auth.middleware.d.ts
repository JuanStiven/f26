import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
    email?: string;
    document: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
/**
 * Middleware que verifica que el request tiene un JWT válido.
 * Agrega `req.user` con el payload decodificado.
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware que verifica que el usuario tiene el rol de ADMIN o SUPER_ADMIN.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware que verifica que el usuario tiene el rol de SUPER_ADMIN.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export declare function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware que permite acceso a SUPER_ADMIN, ADMIN o EMPLOYEE.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export declare function requireEmployee(req: Request, res: Response, next: NextFunction): void;
