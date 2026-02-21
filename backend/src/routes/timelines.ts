import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router: Router = express.Router();

// 復号ヘルパー関数
const decryptRow = (row: any) => ({
  ...row,
  event_title: row.event_title ? decrypt(row.event_title) : row.event_title,
  event_description: row.event_description ? decrypt(row.event_description) : row.event_description,
});

// ユーザーの年表一覧取得（field_type対応）
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const field_type = (req.query.field_type as string) || 'jibunshi';
    const result = await pool.query(
      'SELECT * FROM timelines WHERE user_id = $1 AND field_type = $2 ORDER BY year ASC, month ASC',
      [user_id, field_type]
    );
    // 復号して返す
    res.json(result.rows.map(decryptRow));
  } catch (error: any) {
    console.error('Get timelines error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ取得（ID指定）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM timelines WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timeline not found' });
    res.json(decryptRow(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ追加（field_type対応）
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, year, month, event_title, event_description, photo_id, field_type = 'jibunshi' } = req.body;
    if (!user_id || !year || !event_title) {
      return res.status(400).json({ error: 'Missing required fields: user_id, year, event_title' });
    }
    // 暗号化して保存
    const encryptedTitle = encrypt(event_title);
    const encryptedDescription = event_description ? encrypt(event_description) : null;

    const result = await pool.query(
      'INSERT INTO timelines (user_id, year, month, event_title, event_description, photo_id, field_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, year, month || null, encryptedTitle, encryptedDescription, photo_id || null, field_type]
    );
    // 復号して返す
    res.status(201).json(decryptRow(result.rows[0]));
  } catch (error: any) {
    console.error('Create timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { event_title, event_description, month, year, photo_id } = req.body;

    // 暗号化して保存
    const encryptedTitle = event_title ? encrypt(event_title) : null;
    const encryptedDescription = event_description ? encrypt(event_description) : null;

    const result = await pool.query(
      'UPDATE timelines SET event_title = COALESCE($1, event_title), event_description = COALESCE($2, event_description), month = COALESCE($3, month), year = COALESCE($4, year), photo_id = COALESCE($5, photo_id), updated_at = NOW() WHERE id = $6 RETURNING *',
      [encryptedTitle, encryptedDescription, month || null, year || null, photo_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timeline not found' });
    // 復号して返す
    res.json(decryptRow(result.rows[0]));
  } catch (error: any) {
    console.error('Update timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM timelines WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timeline not found' });
    res.status(204).send();
  } catch (error: any) {
    console.error('Delete timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
