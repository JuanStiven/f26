import { Request, Response } from 'express';
/**
 * POST /api/auth/login/admin
 * Login del administrador con email + password
 */
export declare function loginAdmin(req: Request, res: Response): Promise<void>;
/**
 * POST /api/auth/login/employee
 * Login del empleado con cédula + PIN
 */
export declare function loginEmployee(req: Request, res: Response): Promise<void>;
/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
export declare function getProfile(req: Request, res: Response): Promise<void>;
