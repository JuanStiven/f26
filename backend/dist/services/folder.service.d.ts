/**
 * Listar todas las carpetas del sistema
 */
export declare function getAllFolders(): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    path: string;
    parentPath: string | null;
}[]>;
/**
 * Obtener carpeta por path
 */
export declare function getFolderByPath(folderPath: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    path: string;
    parentPath: string | null;
} | null>;
/**
 * Crear carpeta en BD y en disco
 */
export declare function createFolder(data: {
    name: string;
    parentPath?: string;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    path: string;
    parentPath: string | null;
}>;
/**
 * Renombrar carpeta (actualizar nombre y ruta de ella y sus descendientes)
 */
export declare function renameFolder(id: string, newName: string): Promise<{
    id: string;
    name: string;
    path: string;
}>;
/**
 * Mover carpeta a una nueva ubicación
 */
export declare function moveFolder(id: string, newParentPath: string | null): Promise<{
    id: string;
    name: string;
    path: string;
}>;
/**
 * Eliminar carpeta y todos sus descendientes
 */
export declare function deleteFolder(id: string): Promise<{
    message: string;
}>;
/**
 * Listar archivos físicos en una ruta (complemento al árbol de BD)
 */
export declare function listFilesInPath(folderPath: string): Promise<{
    name: string;
    type: string;
    path: string;
    size: string | undefined;
}[]>;
