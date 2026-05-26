import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Login Administrador (web-admin)
router.post('/login/admin', authController.loginAdmin);

// Login Empleado (mobile-app)
router.post('/login/employee', authController.loginEmployee);

// Perfil del usuario autenticado
router.get('/profile', authenticate, authController.getProfile);

export default router;
