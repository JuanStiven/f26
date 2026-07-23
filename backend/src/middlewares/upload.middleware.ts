import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
const docxTemplatesDir = path.join(uploadsDir, 'templates', 'docx');

if (!fs.existsSync(docxTemplatesDir)) {
  fs.mkdirSync(docxTemplatesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, docxTemplatesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.docx';
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadDocx = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const originalLower = (file.originalname || '').toLowerCase();
    const mimeLower = (file.mimetype || '').toLowerCase();

    if (
      originalLower.endsWith('.docx') ||
      originalLower.endsWith('.doc') ||
      mimeLower.includes('wordprocessingml') ||
      mimeLower.includes('officedocument') ||
      mimeLower.includes('msword') ||
      mimeLower.includes('zip') ||
      mimeLower.includes('octet-stream') ||
      !file.mimetype
    ) {
      cb(null, true);
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});
