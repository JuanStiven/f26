import { Request, Response } from 'express';
export declare function getAll(req: Request, res: Response): Promise<void>;
export declare function create(req: Request, res: Response): Promise<void>;
export declare function rename(req: Request, res: Response): Promise<void>;
export declare function move(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
export declare function listFiles(req: Request, res: Response): Promise<void>;
