"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocx = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
const docxTemplatesDir = path_1.default.join(uploadsDir, 'templates', 'docx');
if (!fs_1.default.existsSync(docxTemplatesDir)) {
    fs_1.default.mkdirSync(docxTemplatesDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, docxTemplatesDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname) || '.docx';
        const baseName = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
        cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    },
});
exports.uploadDocx = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const originalLower = (file.originalname || '').toLowerCase();
        const mimeLower = (file.mimetype || '').toLowerCase();
        if (originalLower.endsWith('.docx') ||
            originalLower.endsWith('.doc') ||
            mimeLower.includes('wordprocessingml') ||
            mimeLower.includes('officedocument') ||
            mimeLower.includes('msword') ||
            mimeLower.includes('zip') ||
            mimeLower.includes('octet-stream') ||
            !file.mimetype) {
            cb(null, true);
        }
        else {
            cb(null, true);
        }
    },
    limits: {
        fileSize: 30 * 1024 * 1024,
    },
});
//# sourceMappingURL=upload.middleware.js.map