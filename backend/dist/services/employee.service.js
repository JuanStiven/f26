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
async function getAllEmployees() {
    return prisma_1.default.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: {
            id: true,
            name: true,
            document: true,
            position: true,
            status: true,
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
            document: true,
            position: true,
            status: true,
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
    const hashedPin = await bcryptjs_1.default.hash(data.pin, 10);
    return prisma_1.default.user.create({
        data: {
            name: data.name,
            document: data.document,
            password: hashedPin,
            role: 'EMPLOYEE',
            position: data.position || 'Operario de Campo',
            status: 'Activo',
        },
        select: {
            id: true,
            name: true,
            document: true,
            position: true,
            status: true,
            createdAt: true,
        },
    });
}
async function updateEmployee(id, data) {
    const exists = await prisma_1.default.user.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    const updateData = {};
    if (data.name)
        updateData.name = data.name;
    if (data.position)
        updateData.position = data.position;
    if (data.status)
        updateData.status = data.status;
    if (data.pin)
        updateData.password = await bcryptjs_1.default.hash(data.pin, 10);
    return prisma_1.default.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            document: true,
            position: true,
            status: true,
        },
    });
}
async function deleteEmployee(id) {
    const exists = await prisma_1.default.user.findUnique({
        where: { id },
        include: { _count: { select: { signedDocuments: true } } }
    });
    if (!exists) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    if (exists._count.signedDocuments > 0) {
        throw { status: 400, message: 'No se puede eliminar el empleado porque tiene documentos firmados asociados.' };
    }
    return prisma_1.default.user.delete({ where: { id } });
}
//# sourceMappingURL=employee.service.js.map