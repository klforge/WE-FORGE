const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadToR2, deleteFromR2, r2KeyFromUrl, isR2Configured } = require('./r2');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    },
});

/** Save an uploaded file, returning its public URL. Prefers R2, falls back to local. */
async function saveFile(buffer, mimetype, r2PathBase, localUploadDir, filename) {
    if (isR2Configured()) {
        try {
            return await uploadToR2(buffer, `${r2PathBase}/${filename}`, mimetype);
        } catch (err) {
            console.error('R2 upload failed (AccessDenied or other error). Falling back to local storage:', err.message);
        }
    }
    // Local fallback
    if (!fs.existsSync(localUploadDir)) fs.mkdirSync(localUploadDir, { recursive: true });
    fs.writeFileSync(path.join(localUploadDir, filename), buffer);
    return `/api/uploads/${r2PathBase}/${filename}`;
}

/** Delete a previously uploaded file (from R2 or local disk). */
async function deleteFile(url, localUploadDir) {
    if (!url) return;
    const key = r2KeyFromUrl(url);
    if (key) {
        await deleteFromR2(key);
    } else {
        const file = path.join(localUploadDir, path.basename(url));
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (err) {
                console.warn(`Failed to delete ${file}:`, err.message);
            }
        }
    }
}

module.exports = {
    upload,
    saveFile,
    deleteFile
};
