import { Request, Response } from 'express';
export declare function getAll(req: Request, res: Response): Promise<void>;
export declare function getHistory(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function create(req: Request, res: Response): Promise<void>;
export declare function updateSync(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
