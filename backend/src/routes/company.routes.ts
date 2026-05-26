import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Obtener configuración de empresa
router.get('/', authenticate, requireAdmin, companyController.getSettings);

// Actualizar configuración de empresa
router.put('/', authenticate, requireAdmin, companyController.updateSettings);

export default router;
