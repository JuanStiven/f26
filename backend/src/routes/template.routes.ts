import { Router } from 'express';
import * as templateController from '../controllers/template.controller';
import { authenticate, requireAdmin, requireEmployee } from '../middlewares/auth.middleware';

const router = Router();

// Listar todas las plantillas (empleados y admins)
router.get('/', authenticate, requireEmployee, templateController.getAll);

// Obtener plantilla por ID
router.get('/:id', authenticate, requireEmployee, templateController.getById);

// Obtener versiones de la plantilla
router.get('/:id/versions', authenticate, requireAdmin, templateController.getVersions);

// Exportar registros de plantilla en formato Excel/CSV
router.get('/:id/export', authenticate, requireAdmin, templateController.exportRecords);

// Crear plantilla (solo admin)
router.post('/', authenticate, requireAdmin, templateController.create);

// Actualizar plantilla (solo admin)
router.put('/:id', authenticate, requireAdmin, templateController.update);

// Eliminar plantilla (solo admin)
router.delete('/:id', authenticate, requireAdmin, templateController.remove);

export default router;
