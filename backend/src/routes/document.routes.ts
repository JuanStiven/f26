import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticate, requireAdmin, requireEmployee, requireSuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Listar documentos (admin ve todos)
router.get('/', authenticate, requireAdmin, documentController.getAll);

// Obtener historial del empleado logueado
router.get('/history', authenticate, requireEmployee, documentController.getHistory);

// Obtener documento por ID
router.get('/:id', authenticate, requireEmployee, documentController.getById);

// Crear documento firmado (empleado desde la app móvil)
router.post('/', authenticate, requireEmployee, documentController.create);

// Actualizar estado de sincronización
router.patch('/:id/sync', authenticate, requireEmployee, documentController.updateSync);

// Eliminar documento (solo super admin)
router.delete('/:id', authenticate, requireSuperAdmin, documentController.remove);

export default router;
