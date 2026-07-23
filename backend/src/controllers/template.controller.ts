import { Request, Response } from 'express';
import path from 'path';
import * as templateService from '../services/template.service';
import { parseDocxTemplate } from '../services/docx.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    if (req.user) {
      const templates = await templateService.getTemplatesForUser(req.user.userId, req.user.role);
      res.json({ success: true, data: templates });
      return;
    }
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
    const { name, fields } = req.body;

    if (!name || !fields || !Array.isArray(fields)) {
      res.status(400).json({ success: false, message: 'Nombre y campos son requeridos.' });
      return;
    }

    const template = await templateService.createTemplate(req.body);
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

export async function getVersions(req: Request, res: Response): Promise<void> {
  try {
    const versions = await templateService.getTemplateVersions(getParam(req, 'id'));
    res.json({ success: true, data: versions });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function exportRecords(req: Request, res: Response): Promise<void> {
  try {
    const templateId = getParam(req, 'id');
    const version = String(req.query.version || 'Sin versión');
    
    const csvContent = await templateService.exportTemplateRecords(templateId, version);
    
    // Set headers to trigger file download in Excel-friendly CSV with UTF-8 BOM
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="registros_plantilla_${version}.csv"`);
    res.write('\uFEFF'); // Write Byte Order Mark (BOM) for Excel
    res.end(csvContent);
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function uploadDocxTemplate(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se recibió ningún archivo .docx.' });
      return;
    }

    const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
    const relativePath = path.relative(uploadsDir, req.file.path);

    const parseResult = await parseDocxTemplate(req.file.path);

    res.json({
      success: true,
      data: {
        docxFilePath: relativePath,
        docxOriginalName: req.file.originalname,
        htmlPreview: parseResult.html,
        rawText: parseResult.rawText,
        detectedTags: parseResult.detectedTags,
      },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error al procesar la plantilla .docx' });
  }
}
