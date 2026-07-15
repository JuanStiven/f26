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
exports.getAll = getAll;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const employeeService = __importStar(require("../services/employee.service"));
const helpers_1 = require("../middlewares/helpers");
async function getAll(req, res) {
    try {
        const role = req.query.role;
        const employees = await employeeService.getAllEmployees(role);
        res.json({ success: true, data: employees });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function getById(req, res) {
    try {
        const employee = await employeeService.getEmployeeById((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, data: employee });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function create(req, res) {
    try {
        const { name, document, pin, position, role, email } = req.body;
        if (!name || !document || !pin) {
            res.status(400).json({ success: false, message: 'Nombre, cédula y PIN son requeridos.' });
            return;
        }
        if (role === 'ADMIN' && !email) {
            res.status(400).json({ success: false, message: 'El correo electrónico es requerido para administradores.' });
            return;
        }
        const employee = await employeeService.createEmployee({ name, document, pin, position, role, email });
        res.status(201).json({ success: true, data: employee });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function update(req, res) {
    try {
        const employee = await employeeService.updateEmployee((0, helpers_1.getParam)(req, 'id'), req.body);
        res.json({ success: true, data: employee });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    try {
        await employeeService.deleteEmployee((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, message: 'Empleado eliminado correctamente.' });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=employee.controller.js.map