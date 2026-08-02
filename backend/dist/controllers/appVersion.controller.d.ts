import { Request, Response } from 'express';
export declare function getLatest(_req: Request, res: Response): Promise<void>;
export declare function getAll(_req: Request, res: Response): Promise<void>;
export declare function create(req: Request, res: Response): Promise<void>;
export declare function setActive(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
