import { Router } from 'express';
import * as folderController from '../controllers/folder.controller';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Listar todas las carpetas (admin)
router.get('/', authenticate, requireAdmin, folderController.getAll);

// Listar archivos físicos en una ruta específica
router.get('/files', authenticate, requireAdmin, folderController.listFiles);

// Crear carpeta
router.post('/', authenticate, requireAdmin, folderController.create);

// Renombrar carpeta
router.patch('/:id/rename', authenticate, requireAdmin, folderController.rename);

// Mover carpeta
router.patch('/:id/move', authenticate, requireAdmin, folderController.move);

// Eliminar carpeta (solo super admin)
router.delete('/:id', authenticate, requireSuperAdmin, folderController.remove);

export default router;
