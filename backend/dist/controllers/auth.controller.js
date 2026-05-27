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
exports.loginAdmin = loginAdmin;
exports.loginEmployee = loginEmployee;
exports.getProfile = getProfile;
const authService = __importStar(require("../services/auth.service"));
/**
 * POST /api/auth/login/admin
 * Login del administrador con email + password
 */
async function loginAdmin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email y contraseña son requeridos.' });
            return;
        }
        const result = await authService.loginAdmin(email, password);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
/**
 * POST /api/auth/login/employee
 * Login del empleado con cédula + PIN
 */
async function loginEmployee(req, res) {
    try {
        const { document, pin } = req.body;
        if (!document || !pin) {
            res.status(400).json({ success: false, message: 'Cédula y PIN son requeridos.' });
            return;
        }
        const result = await authService.loginEmployee(document, pin);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
async function getProfile(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'No autenticado.' });
            return;
        }
        const profile = await authService.getProfile(req.user.userId);
        res.json({ success: true, user: profile });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=auth.controller.js.map