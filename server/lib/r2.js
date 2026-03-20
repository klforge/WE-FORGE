/**
 * r2.js — Cloudflare R2 upload helper
 *
 * Uploads a file buffer to R2 and returns the public URL.
 * Falls back to null if R2 env vars are missing (dev mode).
 *
 * Required .env vars:
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   R2_ENDPOINT          (e.g. https://<account_id>.r2.cloudflarestorage.com)
 *   R2_PUBLIC_URL or VITE_R2_PUBLIC_URL (e.g. https://pub-<hash>.r2.dev)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;

const R2_CONFIGURED =
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_ENDPOINT &&
    PUBLIC_URL;

let s3 = null;

if (R2_CONFIGURED) {
    s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });
    console.log('✓ R2 storage configured');
} else {
    console.warn('⚠  R2 env vars missing — falling back to local disk storage');
}

/**
 * Upload a buffer to R2.
 * @param {Buffer} buffer
 * @param {string} key       e.g. "events/my-event-123.jpg"
 * @param {string} mimeType  e.g. "image/jpeg"
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadToR2(buffer, key, mimeType) {
    if (!s3) throw new Error('R2 is not configured');
    await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Remove CacheControl or set as needed
        CacheControl: 'public, max-age=31536000',
    }));
    return `${PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

/**
 * Delete a file from R2 by its key.
 * @param {string} key  e.g. "events/my-event-123.jpg"
 */
async function deleteFromR2(key) {
    if (!s3) return;
    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
        }));
    } catch (err) {
        console.warn('R2 delete failed (ignored):', err.message);
    }
}

/**
 * Extract R2 key from a stored URL.
 * Returns null if the URL is not from R2 (e.g. a local URL).
 * @param {string} url
 */
function r2KeyFromUrl(url) {
    if (!url || !R2_CONFIGURED) return null;
    const base = PUBLIC_URL.replace(/\/$/, '');
    if (!url.startsWith(base)) return null;
    return url.slice(base.length + 1); // strip leading slash
}

module.exports = { uploadToR2, deleteFromR2, r2KeyFromUrl, isR2Configured: () => !!s3 };
