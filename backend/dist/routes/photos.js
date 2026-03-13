import express from 'express';
import multer from 'multer';
import pool from '../db/db.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
const router = express.Router();
// Cloudinary設定
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// メモリに一時保存（ローカルに保存しない）
const upload = multer({ storage: multer.memoryStorage() });
// Cloudinaryにアップロードするヘルパー関数
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error)
                reject(error);
            else
                resolve(result.secure_url);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
};
// 写真アップロード（Cloudinary対応）
router.post('/upload', upload.single('photo'), async (req, res) => {
    try {
        const { user_id, caption, field_type = 'jibunshi' } = req.body;
        if (!user_id || !req.file) {
            return res.status(400).json({ error: 'Missing user_id or photo file' });
        }
        // Cloudinaryにアップロード
        const photo_url = await uploadToCloudinary(req.file.buffer, `life-memo-navi/${user_id}`);
        const result = await pool.query('INSERT INTO photos (user_id, photo_url, caption, field_type) VALUES ($1, $2, $3, $4) RETURNING *', [user_id, photo_url, caption || null, field_type]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: error.message });
    }
});
// 写真一覧取得（field_type対応）
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const field_type = req.query.field_type || 'jibunshi';
        const result = await pool.query('SELECT * FROM photos WHERE user_id = $1 AND field_type = $2 ORDER BY uploaded_at DESC', [user_id, field_type]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 写真削除（Cloudinaryからも削除）
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // DBからphoto_urlを取得
        const photoResult = await pool.query('SELECT photo_url FROM photos WHERE id = $1', [id]);
        if (photoResult.rows.length === 0)
            return res.status(404).json({ error: 'Photo not found' });
        const photo_url = photoResult.rows[0].photo_url;
        // CloudinaryのPublic IDを抽出して削除
        // URL例: https://res.cloudinary.com/dmq4ex6cd/image/upload/v123/life-memo-navi/1/abc.jpg
        const matches = photo_url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
        if (matches) {
            const publicId = matches[1];
            await cloudinary.uploader.destroy(publicId);
        }
        // DBから削除
        await pool.query('DELETE FROM photos WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=photos.js.map