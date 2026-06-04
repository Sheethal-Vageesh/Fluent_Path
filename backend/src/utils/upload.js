const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  isCloudStorageEnabled,
  uploadBufferToCloud,
  cloudKeyForFile,
} = require('./cloudStorage');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const allowed = [
    '.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.flv', '.3gp',
    '.mp3', '.ogg', '.wav', '.aac', '.m4a', '.flac', '.wma', '.m4b',
  ];
  if (allowed.includes(ext)) return ext;
  if (ext && /^\.[\w-]{1,5}$/.test(ext)) return ext;
  return '.bin';
}

function createUploader({ subdir }) {
  const useCloud = isCloudStorageEnabled();

  let storage;
  if (useCloud) {
    storage = multer.memoryStorage();
  } else {
    ensureUploadsDir();
    const dir = path.join(UPLOADS_DIR, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, dir),
      filename: (_req, file, cb) => {
        const ext = safeExt(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
        cb(null, name);
      },
    });
  }

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (
        file.mimetype &&
        (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/'))
      ) {
        return cb(null, true);
      }
      return cb(new Error('Only video and audio files are allowed'));
    },
  });
}

function toPublicUploadUrl(_req, absFilePath) {
  const rel = path.relative(UPLOADS_DIR, absFilePath).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

/**
 * Persist an uploaded file: S3 (full https URL in DB) or local disk (/uploads/...).
 */
async function persistUploadedFile(file, subdir) {
  if (!file) return '';

  if (isCloudStorageEnabled()) {
    const key = cloudKeyForFile(subdir, file.originalname);
    return uploadBufferToCloud(file.buffer, key, file.mimetype);
  }

  return toPublicUploadUrl(null, file.path);
}

module.exports = {
  UPLOADS_DIR,
  createUploader,
  toPublicUploadUrl,
  persistUploadedFile,
  isCloudStorageEnabled,
};
