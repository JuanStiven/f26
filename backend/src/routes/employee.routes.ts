import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Listar todos los empleados (solo admin)
router.get('/', authenticate, requireAdmin, employeeController.getAll);

// Obtener empleado por ID (solo admin)
router.get('/:id', authenticate, requireAdmin, employeeController.getById);

// Crear empleado (solo admin)
router.post('/', authenticate, requireAdmin, employeeController.create);

// Actualizar empleado (solo admin)
router.put('/:id', authenticate, requireAdmin, employeeController.update);

// Eliminar empleado (solo admin)
router.delete('/:id', authenticate, requireAdmin, employeeController.remove);

export default router;
