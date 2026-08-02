"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Cargar variables de entorno
dotenv_1.default.config();
// Importar rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const template_routes_1 = __importDefault(require("./routes/template.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const sender_routes_1 = __importDefault(require("./routes/sender.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const folder_routes_1 = __importDefault(require("./routes/folder.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const appVersion_routes_1 = __importDefault(require("./routes/appVersion.routes"));
// Importar seed
const seed_service_1 = require("./services/seed.service");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ─── Middlewares Globales ────────────────────────────
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Servir archivos estáticos de uploads
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
// ─── Health Check ────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'ESE Norte 3 - Backend Operativo',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// ─── Rutas de la API ─────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/templates', template_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/senders', sender_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/folders', folder_routes_1.default);
app.use('/api/company', company_routes_1.default);
app.use('/api/app-versions', appVersion_routes_1.default);
// ─── Manejo de errores global ────────────────────────
app.use((err, _req, res, _next) => {
    console.error('❌ Error no controlado:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
    });
});
// ─── Iniciar Servidor ────────────────────────────────
app.listen(PORT, async () => {
    console.log(`\n🏥 ESE Norte 3 - Backend`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📁 Uploads: ${uploadsDir}\n`);
    // Ejecutar seed si la base de datos está vacía
    await (0, seed_service_1.seedDatabase)();
});
exports.default = app;
//# sourceMappingURL=index.js.map