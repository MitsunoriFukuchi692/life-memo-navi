import express, { Router, Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router: Router = express.Router();

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 写真アップロード（field_type対応）
router.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { user_id, caption, field_type = 'jibunshi' } = req.body;
    if (!user_id || !req.file) {
      return res.status(400).json({ error: 'Missing user_id or photo file' });
    }
    const photo_url = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'INSERT INTO photos (user_id, photo_url, caption, field_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, photo_url, caption || null, field_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 写真一覧取得（field_type対応）
router.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const field_type = (req.query.field_type as string) || 'jibunshi';
    const result = await pool.query(
      'SELECT * FROM photos WHERE user_id = $1 AND field_type = $2 ORDER BY uploaded_at DESC',
      [user_id, field_type]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 写真削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Photo not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
