import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router: Router = express.Router();

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 写真アップロード
router.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { user_id, caption } = req.body;

    if (!user_id || !req.file) {
      return res.status(400).json({ error: 'Missing user_id or photo file' });
    }

    const photo_url = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      'INSERT INTO photos (user_id, photo_url, caption) VALUES ($1, $2, $3) RETURNING *',
      [user_id, photo_url, caption || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ユーザーの写真一覧取得
router.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM photos WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [user_id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 写真削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM photos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;