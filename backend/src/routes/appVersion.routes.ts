import { Router } from 'express';
import * as appVersionController from '../controllers/appVersion.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { uploadApk } from '../middlewares/apk.middleware';

const router = Router();

// Público (app móvil): última versión disponible
router.get('/latest', appVersionController.getLatest);

// Admin: listar todas las versiones
router.get('/', authenticate, requireAdmin, appVersionController.getAll);

// Admin: subir nueva versión (APK)
router.post('/', authenticate, requireAdmin, uploadApk.single('apkFile'), appVersionController.create);

// Admin: activar/desactivar versión
router.patch('/:id', authenticate, requireAdmin, appVersionController.setActive);

// Admin: eliminar versión
router.delete('/:id', authenticate, requireAdmin, appVersionController.remove);

export default router;
