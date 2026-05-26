import { Request, Response } from 'express';
import * as documentService from '../services/document.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const documents = await documentService.getAllDocuments();
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const document = await documentService.getDocumentById(getParam(req, 'id'));
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { templateId, formData, photoUrl, signatureUrl } = req.body;

    if (!templateId || !formData) {
      res.status(400).json({ success: false, message: 'templateId y formData son requeridos.' });
      return;
    }

    // El filledById viene del token JWT del empleado autenticado
    const filledById = req.user?.userId;
    if (!filledById) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
    }

    const document = await documentService.createDocument({
      templateId,
      filledById,
      formData,
      photoUrl,
      signatureUrl,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function updateSync(req: Request, res: Response): Promise<void> {
  try {
    const { syncStatus } = req.body;
    const document = await documentService.updateSyncStatus(getParam(req, 'id'), syncStatus);
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await documentService.deleteDocument(getParam(req, 'id'));
    res.json({ success: true, message: 'Documento eliminado correctamente.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
