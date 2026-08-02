import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth.routes';
import templateRoutes from './routes/template.routes';
import employeeRoutes from './routes/employee.routes';
import senderRoutes from './routes/sender.routes';
import documentRoutes from './routes/document.routes';
import folderRoutes from './routes/folder.routes';
import companyRoutes from './routes/company.routes';
import appVersionRoutes from './routes/appVersion.routes';

// Importar seed
import { seedDatabase } from './services/seed.service';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares Globales ────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos de uploads
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/app-versions', appVersionRoutes);

// ─── Manejo de errores global ────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
  await seedDatabase();
});

export default app;
