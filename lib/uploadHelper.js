import fs from 'fs';
import path from 'path';
import { uploadToR2, deleteFromR2, r2KeyFromUrl, isR2Configured } from './r2.js';

/** Save an uploaded file from a raw binary buffer, returning its public URL. Prefers R2, falls back to local. */
export async function saveFile(buffer, mimetype, r2PathBase, localUploadDir, filename) {
    if (isR2Configured()) {
        return uploadToR2(buffer, `${r2PathBase}/${filename}`, mimetype);
    }
    // Local fallback
    if (!fs.existsSync(localUploadDir)) fs.mkdirSync(localUploadDir, { recursive: true });
    fs.writeFileSync(path.join(localUploadDir, filename), Buffer.from(buffer));
    return `/api/uploads/${r2PathBase}/${filename}`;
}

/** Delete a previously uploaded file (from R2 or local disk). */
export async function deleteFile(url, localUploadDir) {
    if (!url) return;
    const key = r2KeyFromUrl(url);
    if (key) {
        await deleteFromR2(key);
    } else {
        const file = path.join(localUploadDir, path.basename(url));
        if (fs.existsSync(file)) fs.unlinkSync(file);
    }
}
