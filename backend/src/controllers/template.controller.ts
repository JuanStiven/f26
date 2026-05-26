import { Request, Response } from 'express';
import * as templateService from '../services/template.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const template = await templateService.getTemplateById(getParam(req, 'id'));
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, storagePath, fields } = req.body;

    if (!name || !fields || !Array.isArray(fields)) {
      res.status(400).json({ success: false, message: 'Nombre y campos son requeridos.' });
      return;
    }

    const template = await templateService.createTemplate({ name, description, storagePath, fields });
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const template = await templateService.updateTemplate(getParam(req, 'id'), req.body);
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await templateService.deleteTemplate(getParam(req, 'id'));
    res.json({ success: true, message: 'Plantilla eliminada correctamente.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
