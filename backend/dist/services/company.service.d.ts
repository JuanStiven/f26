export declare function getSettings(): Promise<{
    name: string;
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    address: string;
    phone: string;
    manager: string;
    logoUrl: string | null;
}>;
export declare function updateSettings(data: {
    name?: string;
    nit?: string;
    address?: string;
    phone?: string;
    manager?: string;
    email?: string;
    logoUrl?: string;
}): Promise<{
    name: string;
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    nit: string;
    address: string;
    phone: string;
    manager: string;
    logoUrl: string | null;
}>;
