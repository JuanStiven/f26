"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
exports.loginEmployee = loginEmployee;
exports.getProfile = getProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../models/prisma"));
/**
 * Login para Administradores (email + password)
 */
async function loginAdmin(email, password) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.password || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        throw { status: 401, message: 'Credenciales inválidas.' };
    }
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isValid) {
        throw { status: 401, message: 'Contraseña incorrecta.' };
    }
    const payload = {
        userId: user.id,
        role: user.role,
        email: user.email || undefined,
        document: user.document,
    };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const expiresInSeconds = 60 * 60 * 24; // 24 horas
    const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresInSeconds });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            document: user.document,
        },
    };
}
/**
 * Login para la App Móvil (cédula + PIN)
 * Aplica a cualquier usuario activo: EMPLOYEE, ADMIN o SUPER_ADMIN.
 */
async function loginEmployee(document, pin) {
    const user = await prisma_1.default.user.findUnique({ where: { document } });
    if (!user) {
        throw { status: 401, message: 'Cédula no registrada en el sistema.' };
    }
    if (user.status !== 'Activo') {
        throw { status: 403, message: 'Tu cuenta está inactiva. Contacta al administrador.' };
    }
    // El PIN vive en `pin` (nuevo) con fallback al hash legacy en `password`
    const pinHash = user.pin || user.password;
    if (!pinHash) {
        throw { status: 401, message: 'PIN no configurado para este usuario.' };
    }
    const isValid = await bcryptjs_1.default.compare(pin, pinHash);
    if (!isValid) {
        throw { status: 401, message: 'PIN incorrecto.' };
    }
    const payload = {
        userId: user.id,
        role: user.role,
        document: user.document,
    };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const expiresInSeconds = 60 * 60 * 24; // 24 horas
    const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresInSeconds });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            document: user.document,
            position: user.position,
        },
    };
}
/**
 * Obtener perfil del usuario autenticado
 */
async function getProfile(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            document: true,
            role: true,
            status: true,
            position: true,
            createdAt: true,
        },
    });
    if (!user) {
        throw { status: 404, message: 'Usuario no encontrado.' };
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map