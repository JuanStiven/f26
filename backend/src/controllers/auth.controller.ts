import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * POST /api/auth/login/admin
 * Login del administrador con email + password
 */
export async function loginAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email y contraseña son requeridos.' });
      return;
    }

    const result = await authService.loginAdmin(email, password);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/login/employee
 * Login del empleado con cédula + PIN
 */
export async function loginEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { document, pin } = req.body;

    if (!document || !pin) {
      res.status(400).json({ success: false, message: 'Cédula y PIN son requeridos.' });
      return;
    }

    const result = await authService.loginEmployee(document, pin);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    const profile = await authService.getProfile(req.user.userId);
    res.json({ success: true, user: profile });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
