"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireEmployee = requireEmployee;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware que verifica que el request tiene un JWT válido.
 * Agrega `req.user` con el payload decodificado.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token de autenticación requerido.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
        return;
    }
}
/**
 * Middleware que verifica que el usuario tiene el rol de ADMIN.
 * Debe usarse DESPUÉS de `authenticate`.
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
        return;
    }
    next();
}
/**
 * Middleware que permite acceso a ADMIN o EMPLOYEE.
 * Debe usarse DESPUÉS de `authenticate`.
 */
function requireEmployee(req, res, next) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'EMPLOYEE')) {
        res.status(403).json({ success: false, message: 'Acceso denegado.' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map