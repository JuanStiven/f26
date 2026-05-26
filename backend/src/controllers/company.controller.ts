import { Request, Response } from 'express';
import * as companyService from '../services/company.service';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await companyService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await companyService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
