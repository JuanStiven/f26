"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../models/prisma"));
/**
 * Seed de desarrollo: Crea datos iniciales si la BD está vacía.
 * Se ejecuta automáticamente al arrancar el servidor en modo development.
 */
async function seedDatabase() {
    try {
        // Verificar si ya hay datos
        const userCount = await prisma_1.default.user.count();
        if (userCount > 0) {
            console.log('📋 Base de datos ya contiene datos. Seed omitido.');
            return;
        }
        console.log('🌱 Ejecutando seed de desarrollo...');
        // ─── 1. Crear Admin ──────────────────────────────
        const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
        const admin = await prisma_1.default.user.create({
            data: {
                name: 'Administrador ESE Norte 3',
                email: 'admin@esenorte3.gov.co',
                document: '1000000001',
                password: adminPassword,
                role: 'ADMIN',
                status: 'Activo',
                position: 'Administrador del Sistema',
            },
        });
        console.log('  ✅ Admin creado:', admin.email);
        // ─── 2. Crear Empleados ──────────────────────────
        const pin1 = await bcryptjs_1.default.hash('1234', 10);
        const pin2 = await bcryptjs_1.default.hash('5678', 10);
        const pin3 = await bcryptjs_1.default.hash('9999', 10);
        const emp1 = await prisma_1.default.user.create({
            data: {
                name: 'Carlos Mario Torres',
                document: '1098765432',
                password: pin1,
                role: 'EMPLOYEE',
                status: 'Activo',
                position: 'Operario de Campo',
            },
        });
        const emp2 = await prisma_1.default.user.create({
            data: {
                name: 'Laura Camila Ortiz',
                document: '1087654321',
                password: pin2,
                role: 'EMPLOYEE',
                status: 'Activo',
                position: 'Enfermera Jefa',
            },
        });
        await prisma_1.default.user.create({
            data: {
                name: 'Andrés Felipe Restrepo',
                document: '1076543210',
                password: pin3,
                role: 'EMPLOYEE',
                status: 'Inactivo',
                position: 'Técnico Domiciliario',
            },
        });
        console.log('  ✅ 3 empleados creados');
        // ─── 3. Configuración de Empresa ─────────────────
        await prisma_1.default.companySettings.create({
            data: {
                name: 'ESE Norte 3',
                nit: '800.123.456-7',
                address: 'Calle 10 # 5-20, Sede Principal',
                phone: '320 123 4567',
                manager: 'Dra. María Helena Castro',
                email: 'contacto@esenorte3.gov.co',
            },
        });
        console.log('  ✅ Configuración de empresa creada');
        // ─── 4. Remitentes ───────────────────────────────
        await prisma_1.default.sender.createMany({
            data: [
                { name: 'EPS Sanitas', nit: '800.000.111-2', phone: '018000919100' },
                { name: 'Nueva EPS', nit: '900.156.244-1', phone: '018000954400' },
            ],
        });
        console.log('  ✅ 2 remitentes creados');
        // ─── 5. Plantillas Documentales ──────────────────
        const template1 = await prisma_1.default.template.create({
            data: {
                name: 'Acta de Entrega de Insumos Médicos',
                description: 'Constancia de insumos entregados en puestos de salud rurales.',
                storagePath: 'CALIDAD/AUDITORIAS',
                fields: [
                    { id: 'f1', type: 'text', label: 'Puesto de Salud Destino', required: true },
                    { id: 'f2', type: 'date', label: 'Fecha de Entrega', required: true },
                    { id: 'f3', type: 'table', label: 'Detalle de Insumos', required: true, columns: ['Elemento', 'Cantidad', 'Lote'] },
                    { id: 'f4', type: 'photo', label: 'Foto del Recibido (Rostro Opcional)', required: false },
                    { id: 'f5', type: 'signature', label: 'Firma Responsable', required: true },
                ],
            },
        });
        const template2 = await prisma_1.default.template.create({
            data: {
                name: 'Registro de Mantenimiento de Equipos',
                description: 'Reporte técnico del estado de equipos médicos en campo.',
                storagePath: 'SOPORTE/mantenimiento',
                fields: [
                    { id: 'm1', type: 'text', label: 'Identificador del Equipo', required: true },
                    { id: 'm2', type: 'text', label: 'Observaciones Técnicas', required: false },
                    { id: 'm3', type: 'signature', label: 'Firma Técnico', required: true },
                ],
            },
        });
        console.log('  ✅ 2 plantillas creadas');
        // ─── 6. Carpetas del Explorador ──────────────────
        await prisma_1.default.folder.createMany({
            data: [
                { name: 'RRHH', path: 'RRHH', parentPath: null },
                { name: 'empleados', path: 'RRHH/empleados', parentPath: 'RRHH' },
                { name: 'CALIDAD', path: 'CALIDAD', parentPath: null },
                { name: 'AUDITORIAS', path: 'CALIDAD/AUDITORIAS', parentPath: 'CALIDAD' },
                { name: 'SOPORTE', path: 'SOPORTE', parentPath: null },
                { name: 'mantenimiento', path: 'SOPORTE/mantenimiento', parentPath: 'SOPORTE' },
            ],
        });
        console.log('  ✅ 6 carpetas creadas');
        // ─── 7. Documentos Firmados de Ejemplo ───────────
        await prisma_1.default.signedDocument.createMany({
            data: [
                {
                    templateId: template1.id,
                    filledById: emp1.id,
                    data: {
                        'Puesto de Salud Destino': 'Puesto La Sierra',
                        'Fecha de Entrega': '2026-05-26',
                        'Detalle de Insumos': [
                            { Elemento: 'Gasa estéril', Cantidad: '50', Lote: 'A-2026-001' },
                            { Elemento: 'Alcohol 70%', Cantidad: '10', Lote: 'B-2026-015' },
                        ],
                    },
                    syncStatus: 'SYNCED',
                    filePath: 'CALIDAD/AUDITORIAS/Acta_Entrega_Carlos_1.json',
                },
                {
                    templateId: template1.id,
                    filledById: emp2.id,
                    data: {
                        'Puesto de Salud Destino': 'Centro de Salud Urbano',
                        'Fecha de Entrega': '2026-05-26',
                        'Detalle de Insumos': [
                            { Elemento: 'Jeringa 10ml', Cantidad: '100', Lote: 'C-2026-003' },
                        ],
                    },
                    syncStatus: 'SYNCED',
                    filePath: 'CALIDAD/AUDITORIAS/Acta_Entrega_Laura_1.json',
                },
                {
                    templateId: template2.id,
                    filledById: emp1.id,
                    data: {
                        'Identificador del Equipo': 'EQ-MED-042',
                        'Observaciones Técnicas': 'Calibración exitosa. Sin desviaciones detectadas.',
                    },
                    syncStatus: 'PENDING',
                    filePath: 'SOPORTE/mantenimiento/Registro_Mant_Carlos_1.json',
                },
            ],
        });
        console.log('  ✅ 3 documentos firmados de ejemplo creados');
        console.log('🌱 Seed completado exitosamente.\n');
    }
    catch (error) {
        console.error('❌ Error en seed:', error);
    }
}
//# sourceMappingURL=seed.service.js.map