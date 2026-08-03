import { Router } from 'express';
import * as appVersionController from '../controllers/appVersion.controller';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware';
import { uploadApk } from '../middlewares/apk.middleware';

const router = Router();

// Público (app móvil): última versión disponible
router.get('/latest', appVersionController.getLatest);

// Super Admin: listar todas las versiones
router.get('/', authenticate, requireSuperAdmin, appVersionController.getAll);

// Super Admin: subir nueva versión (APK)
router.post('/', authenticate, requireSuperAdmin, uploadApk.single('apkFile'), appVersionController.create);

// Super Admin: activar/desactivar versión
router.patch('/:id', authenticate, requireSuperAdmin, appVersionController.setActive);

// Super Admin: eliminar versión
router.delete('/:id', authenticate, requireSuperAdmin, appVersionController.remove);

export default router;
