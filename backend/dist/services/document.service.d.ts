export declare function getAllDocuments(): Promise<({
    template: {
        name: string;
        storagePath: string;
    };
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
})[]>;
export declare function getDocumentsByUserId(userId: string): Promise<({
    template: {
        name: string;
        description: string;
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
})[]>;
export declare function getDocumentById(id: string): Promise<{
    template: {
        fields: import("@prisma/client/runtime/client").JsonValue;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        storagePath: string;
    };
    filledBy: {
        name: string;
        document: string;
        position: string | null;
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
    templateId: string;
    filledById: string;
}>;
