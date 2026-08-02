"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadApk = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
const apkDir = path_1.default.join(uploadsDir, 'apk');
if (!fs_1.default.existsSync(apkDir)) {
    fs_1.default.mkdirSync(apkDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, apkDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname) || '.apk';
        cb(null, `app_${uniqueSuffix}${ext}`);
    },
});
exports.uploadApk = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const originalLower = (file.originalname || '').toLowerCase();
        const mimeLower = (file.mimetype || '').toLowerCase();
        if (originalLower.endsWith('.apk') ||
            mimeLower.includes('android') ||
            mimeLower.includes('vnd.android') ||
            mimeLower.includes('octet-stream') ||
            mimeLower.includes('zip') ||
            !file.mimetype) {
            cb(null, true);
        }
        else {
            cb(null, true);
        }
    },
    limits: {
        fileSize: 200 * 1024 * 1024, // 200 MB
    },
});
//# sourceMappingURL=apk.middleware.js.map