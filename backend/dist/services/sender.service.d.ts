export declare function getAllSenders(): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    phone: string;
}[]>;
export declare function createSender(data: {
    name: string;
    nit: string;
    phone: string;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    phone: string;
}>;
export declare function updateSender(id: string, data: {
    name?: string;
    nit?: string;
    phone?: string;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    phone: string;
}>;
export declare function deleteSender(id: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    phone: string;
}>;
