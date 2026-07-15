export declare function getAllEmployees(role?: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    role: import(".prisma/client").$Enums.Role;
    status: string;
    position: string | null;
    createdAt: Date;
    _count: {
        signedDocuments: number;
    };
}[]>;
export declare function getEmployeeById(id: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    status: string;
    position: string | null;
    createdAt: Date;
    signedDocuments: ({
        template: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        photoUrl: string | null;
        signatureUrl: string | null;
        syncStatus: import(".prisma/client").$Enums.SyncStatus;
        filePath: string | null;
        templateSnapshot: import("@prisma/client/runtime/client").JsonValue | null;
        templateId: string;
        filledById: string;
    })[];
}>;
export declare function createEmployee(data: {
    name: string;
    document: string;
    pin: string;
    position?: string;
    role?: string;
    email?: string;
}): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    role: import(".prisma/client").$Enums.Role;
    status: string;
    position: string | null;
    createdAt: Date;
}>;
export declare function updateEmployee(id: string, data: {
    name?: string;
    position?: string;
    status?: string;
    pin?: string;
    role?: string;
    email?: string;
}): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    role: import(".prisma/client").$Enums.Role;
    status: string;
    position: string | null;
}>;
export declare function deleteEmployee(id: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    password: string;
    role: import(".prisma/client").$Enums.Role;
    status: string;
    position: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
