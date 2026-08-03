"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appVersionController = __importStar(require("../controllers/appVersion.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const apk_middleware_1 = require("../middlewares/apk.middleware");
const router = (0, express_1.Router)();
// Público (app móvil): última versión disponible
router.get('/latest', appVersionController.getLatest);
// Super Admin: listar todas las versiones
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireSuperAdmin, appVersionController.getAll);
// Super Admin: subir nueva versión (APK)
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireSuperAdmin, apk_middleware_1.uploadApk.single('apkFile'), appVersionController.create);
// Super Admin: activar/desactivar versión
router.patch('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireSuperAdmin, appVersionController.setActive);
// Super Admin: eliminar versión
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireSuperAdmin, appVersionController.remove);
exports.default = router;
//# sourceMappingURL=appVersion.routes.js.map