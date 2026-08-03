import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  email?: string;
  document: string;
}

// Extender Request para incluir el usuario autenticado
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
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token de autenticación requerido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    return;
  }
}

/**
 * Middleware que verifica que el usuario tiene el rol de ADMIN o SUPER_ADMIN.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
    return;
  }
  next();
}

/**
 * Middleware que verifica que el usuario tiene el rol de SUPER_ADMIN.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Super Administrador.' });
    return;
  }
  next();
}

/**
 * Middleware que permite acceso a SUPER_ADMIN, ADMIN o EMPLOYEE.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export function requireEmployee(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'EMPLOYEE')) {
    res.status(403).json({ success: false, message: 'Acceso denegado.' });
    return;
  }
  next();
}
