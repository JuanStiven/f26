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
const templateController = __importStar(require("../controllers/template.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Subir plantilla .docx (solo admin)
router.post('/upload-docx', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, upload_middleware_1.uploadDocx.single('docxFile'), templateController.uploadDocxTemplate);
// Listar todas las plantillas (empleados y admins)
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireEmployee, templateController.getAll);
// Obtener plantilla por ID
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireEmployee, templateController.getById);
// Obtener versiones de la plantilla
router.get('/:id/versions', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, templateController.getVersions);
// Exportar registros de plantilla en formato Excel/CSV
router.get('/:id/export', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, templateController.exportRecords);
// Crear plantilla (solo admin)
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, templateController.create);
// Actualizar plantilla (solo admin)
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, templateController.update);
// Eliminar plantilla (solo super admin)
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireSuperAdmin, templateController.remove);
exports.default = router;
//# sourceMappingURL=template.routes.js.map