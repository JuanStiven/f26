import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
const apkDir = path.join(uploadsDir, 'apk');

if (!fs.existsSync(apkDir)) {
  fs.mkdirSync(apkDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, apkDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.apk';
    cb(null, `app_${uniqueSuffix}${ext}`);
  },
});

export const uploadApk = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const originalLower = (file.originalname || '').toLowerCase();
    const mimeLower = (file.mimetype || '').toLowerCase();
    if (
      originalLower.endsWith('.apk') ||
      mimeLower.includes('android') ||
      mimeLower.includes('vnd.android') ||
      mimeLower.includes('octet-stream') ||
      mimeLower.includes('zip') ||
      !file.mimetype
    ) {
      cb(null, true);
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});
