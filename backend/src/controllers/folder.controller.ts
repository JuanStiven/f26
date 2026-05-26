import { Request, Response } from 'express';
import * as folderService from '../services/folder.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const folders = await folderService.getAllFolders();
    res.json({ success: true, data: folders });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, parentPath } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Nombre de la carpeta es requerido.' });
      return;
    }

    const folder = await folderService.createFolder({ name, parentPath });
    res.status(201).json({ success: true, data: folder });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function rename(req: Request, res: Response): Promise<void> {
  try {
    const { newName } = req.body;

    if (!newName) {
      res.status(400).json({ success: false, message: 'Nuevo nombre es requerido.' });
      return;
    }

    const result = await folderService.renameFolder(getParam(req, 'id'), newName);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function move(req: Request, res: Response): Promise<void> {
  try {
    const { newParentPath } = req.body;
    const result = await folderService.moveFolder(getParam(req, 'id'), newParentPath || null);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const result = await folderService.deleteFolder(getParam(req, 'id'));
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function listFiles(req: Request, res: Response): Promise<void> {
  try {
    const folderPath = (req.query.path as string) || '';
    const files = await folderService.listFilesInPath(folderPath);
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
