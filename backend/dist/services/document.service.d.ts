export declare function getAllDocuments(): Promise<{
    template: string | number | true | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray | {
        fields: import("@prisma/client/runtime/client").JsonValue;
        name: string;
        description: string;
        storagePath: string;
    };
    templateSnapshot: undefined;
    filledBy: {
        name: string;
        document: string;
    };
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
}[]>;
export declare function getDocumentsByUserId(userId: string): Promise<{
    template: string | number | true | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray | {
        fields: import("@prisma/client/runtime/client").JsonValue;
        name: string;
        description: string;
    };
    templateSnapshot: undefined;
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
}[]>;
export declare function getDocumentById(id: string): Promise<{
    template: string | number | true | import("@prisma/client/runtime/client").JsonObject | import("@prisma/client/runtime/client").JsonArray | {
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
    };
    templateSnapshot: undefined;
    filledBy: {
        name: string;
        document: string;
        position: string | null;
    };
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
}>;
export declare function createDocument(data: {
    templateId: string;
    filledById: string;
    formData: any;
    photoUrl?: string;
    signatureUrl?: string;
}): Promise<{
    template: {
        name: string;
    };
    filledBy: {
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
}>;
export declare function updateSyncStatus(id: string, syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE'): Promise<{
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
}>;
export declare function deleteDocument(id: string): Promise<{
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
}>;
