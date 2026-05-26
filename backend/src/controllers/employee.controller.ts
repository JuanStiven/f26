import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const employees = await employeeService.getAllEmployees();
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
    const { name, document, pin, position } = req.body;

    if (!name || !document || !pin) {
      res.status(400).json({ success: false, message: 'Nombre, cédula y PIN son requeridos.' });
      return;
    }

    const employee = await employeeService.createEmployee({ name, document, pin, position });
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(getParam(req, 'id'), req.body);
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await employeeService.deleteEmployee(getParam(req, 'id'));
    res.json({ success: true, message: 'Empleado eliminado correctamente.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
