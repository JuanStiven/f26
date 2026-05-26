import { Request, Response } from 'express';
import * as senderService from '../services/sender.service';
import { getParam } from '../middlewares/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const senders = await senderService.getAllSenders();
    res.json({ success: true, data: senders });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, nit, phone } = req.body;

    if (!name || !nit || !phone) {
      res.status(400).json({ success: false, message: 'Nombre, NIT y teléfono son requeridos.' });
      return;
    }

    const sender = await senderService.createSender({ name, nit, phone });
    res.status(201).json({ success: true, data: sender });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const sender = await senderService.updateSender(getParam(req, 'id'), req.body);
    res.json({ success: true, data: sender });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await senderService.deleteSender(getParam(req, 'id'));
    res.json({ success: true, message: 'Remitente eliminado correctamente.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
