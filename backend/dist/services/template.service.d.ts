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
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
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
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
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
        templateSnapshot: import("@prisma/client/runtime/client").JsonValue | null;
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
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
}>;
export declare function createTemplate(data: {
    name: string;
    description?: string;
    storagePath?: string;
    fields: any[];
    assignedUsers?: string[];
    isQualityDocument?: boolean;
    qualityCode?: string;
    qualityVersion?: string;
    qualityDate?: string;
    isCreativeMode?: boolean;
    creativeElements?: any;
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
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
}>;
export declare function updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    storagePath?: string;
    fields?: any[];
    assignedUsers?: string[];
    isQualityDocument?: boolean;
    qualityCode?: string;
    qualityVersion?: string;
    qualityDate?: string;
    isCreativeMode?: boolean;
    creativeElements?: any;
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
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
}>;
export declare function deleteTemplate(id: string): Promise<{
    fields: import("@prisma/client/runtime/client").JsonValue;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    storagePath: string;
    isQualityDocument: boolean;
    qualityCode: string | null;
    qualityVersion: string | null;
    qualityDate: string | null;
    isCreativeMode: boolean;
    creativeElements: import("@prisma/client/runtime/client").JsonValue | null;
}>;
