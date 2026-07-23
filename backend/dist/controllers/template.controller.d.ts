import { Request, Response } from 'express';
export declare function getAll(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function create(req: Request, res: Response): Promise<void>;
export declare function update(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
export declare function getVersions(req: Request, res: Response): Promise<void>;
export declare function exportRecords(req: Request, res: Response): Promise<void>;
export declare function uploadDocxTemplate(req: Request, res: Response): Promise<void>;
