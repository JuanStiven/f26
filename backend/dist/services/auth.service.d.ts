/**
 * Login para Administradores (email + password)
 */
export declare function loginAdmin(email: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        name: string;
        email: string | null;
        role: "ADMIN";
        document: string;
    };
}>;
/**
 * Login para Empleados (cédula + PIN)
 */
export declare function loginEmployee(document: string, pin: string): Promise<{
    token: string;
    user: {
        id: string;
        name: string;
        role: "EMPLOYEE";
        document: string;
        position: string | null;
    };
}>;
/**
 * Obtener perfil del usuario autenticado
 */
export declare function getProfile(userId: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    document: string;
    role: import(".prisma/client").$Enums.Role;
    status: string;
    position: string | null;
    createdAt: Date;
}>;
