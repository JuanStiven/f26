import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const role = req.query.role as string;
    const employees = await employeeService.getAllEmployees(role);
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeById(getParam(req, 'id'));
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, document, pin, password, position, role, email } = req.body;

    if (!name || !document) {
      res.status(400).json({ success: false, message: 'Nombre y cédula son requeridos.' });
      return;
    }

    const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (isAdminRole && !email) {
      res.status(400).json({ success: false, message: 'El correo electrónico es requerido para administradores.' });
      return;
    }

    if (isAdminRole && !password) {
      res.status(400).json({ success: false, message: 'La contraseña es requerida para administradores.' });
      return;
    }

    if (!isAdminRole && !pin) {
      res.status(400).json({ success: false, message: 'El PIN es requerido para empleados.' });
      return;
    }

    if (isAdminRole && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Sólo el Super Administrador puede crear usuarios administradores.' });
      return;
    }

    const employee = await employeeService.createEmployee({ name, document, pin, password, position, role, email });
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(getParam(req, 'id'), req.body, req.user);
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await employeeService.deleteEmployee(getParam(req, 'id'), req.user);
    res.json({ success: true, message: 'Empleado eliminado correctamente.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
