"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEmployees = getAllEmployees;
exports.getEmployeeById = getEmployeeById;
exports.createEmployee = createEmployee;
exports.updateEmployee = updateEmployee;
exports.deleteEmployee = deleteEmployee;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../models/prisma"));
async function getAllEmployees(role) {
    let whereClause = undefined;
    if (role === 'ADMIN') {
        whereClause = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } };
    }
    else if (role === 'EMPLOYEE') {
        whereClause = { role: 'EMPLOYEE' };
    }
    else if (role) {
        whereClause = { role: role };
    }
    return prisma_1.default.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            document: true,
            position: true,
            status: true,
            role: true,
            createdAt: true,
            _count: { select: { signedDocuments: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function getEmployeeById(id) {
    const employee = await prisma_1.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            document: true,
            position: true,
            status: true,
            role: true,
            createdAt: true,
            signedDocuments: {
                include: { template: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 20,
            },
        },
    });
    if (!employee) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    return employee;
}
async function createEmployee(data) {
    // Verificar duplicado de cédula
    const exists = await prisma_1.default.user.findUnique({ where: { document: data.document } });
    if (exists) {
        throw { status: 409, message: 'Ya existe un usuario con esa cédula.' };
    }
    if (data.email) {
        const emailExists = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (emailExists) {
            throw { status: 409, message: 'Ya existe un usuario con este correo electrónico.' };
        }
    }
    const hashedPin = await bcryptjs_1.default.hash(data.pin, 10);
    const userRole = data.role || 'EMPLOYEE';
    return prisma_1.default.user.create({
        data: {
            name: data.name,
            document: data.document,
            password: hashedPin,
            role: userRole,
            position: data.position || (userRole === 'SUPER_ADMIN' ? 'Super Administrador' : userRole === 'ADMIN' ? 'Administrador' : 'Operario de Campo'),
            status: 'Activo',
            email: data.email || null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            document: true,
            position: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });
}
async function updateEmployee(id, data, requester) {
    const exists = await prisma_1.default.user.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    if (requester) {
        const isTargetAdmin = exists.role === 'ADMIN' || exists.role === 'SUPER_ADMIN';
        const isSelf = requester.userId === id;
        const isSuper = requester.role === 'SUPER_ADMIN';
        if (isTargetAdmin && !isSelf && !isSuper) {
            throw { status: 403, message: 'Un Administrador no puede actualizar la información o contraseña de otro Administrador.' };
        }
        if (data.role && (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') && !isSuper) {
            throw { status: 403, message: 'Sólo el Super Administrador puede asignar roles administrativos.' };
        }
    }
    if (data.email && data.email !== exists.email) {
        const emailExists = await prisma_1.default.user.findUnique({ where: { email: data.email } });
        if (emailExists) {
            throw { status: 409, message: 'Ya existe un usuario con este correo electrónico.' };
        }
    }
    const updateData = {};
    if (data.name)
        updateData.name = data.name;
    if (data.position)
        updateData.position = data.position;
    if (data.status)
        updateData.status = data.status;
    if (data.role)
        updateData.role = data.role;
    if (data.email !== undefined)
        updateData.email = data.email || null;
    if (data.pin)
        updateData.password = await bcryptjs_1.default.hash(data.pin, 10);
    return prisma_1.default.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            document: true,
            position: true,
            role: true,
            status: true,
        },
    });
}
async function deleteEmployee(id, requester) {
    const exists = await prisma_1.default.user.findUnique({
        where: { id },
        include: { _count: { select: { signedDocuments: true } } }
    });
    if (!exists) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    if (requester) {
        if (requester.userId === id) {
            throw { status: 400, message: 'No puedes eliminar tu propio usuario en sesión.' };
        }
        const isTargetAdmin = exists.role === 'ADMIN' || exists.role === 'SUPER_ADMIN';
        const isSuper = requester.role === 'SUPER_ADMIN';
        if (isTargetAdmin && !isSuper) {
            throw { status: 403, message: 'Un Administrador no puede borrar a otro Administrador.' };
        }
    }
    if (exists._count.signedDocuments > 0) {
        throw { status: 400, message: 'No se puede eliminar el empleado porque tiene documentos firmados asociados.' };
    }
    return prisma_1.default.user.delete({ where: { id } });
}
//# sourceMappingURL=employee.service.js.map