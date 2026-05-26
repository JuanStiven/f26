import { Router } from 'express';
import * as senderController from '../controllers/sender.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Listar remitentes (solo admin)
router.get('/', authenticate, requireAdmin, senderController.getAll);

// Crear remitente (solo admin)
router.post('/', authenticate, requireAdmin, senderController.create);

// Actualizar remitente (solo admin)
router.put('/:id', authenticate, requireAdmin, senderController.update);

// Eliminar remitente (solo admin)
router.delete('/:id', authenticate, requireAdmin, senderController.remove);

export default router;
