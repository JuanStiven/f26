export declare function getAllTemplates(): Promise<({
    assignedUsers: {
        name: string;
        id: string;
        document: string;
    }[];
    _count: {
        signedDocuments: number;
    };
} & {
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
})[]>;
export declare function getTemplatesForUser(userId: string, role: string): Promise<({
    _count: {
        signedDocuments: number;
    };
} & {
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
})[]>;
export declare function getTemplateById(id: string): Promise<{
    signedDocuments: ({
        filledBy: {
            name: string;
            document: string;
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
        templateId: string;
        filledById: string;
    })[];
} & {
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
}>;
export declare function createTemplate(data: {
    name: string;
    description?: string;
    storagePath?: string;
    fields: any[];
    assignedUsers?: string[];
}): Promise<{
    assignedUsers: {
        name: string;
        id: string;
        document: string;
    }[];
    _count: {
        signedDocuments: number;
    };
} & {
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
}>;
export declare function updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    storagePath?: string;
    fields?: any[];
    assignedUsers?: string[];
}): Promise<{
    assignedUsers: {
        name: string;
        id: string;
        document: string;
    }[];
    _count: {
        signedDocuments: number;
    };
} & {
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
}>;
export declare function deleteTemplate(id: string): Promise<{
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
}>;
