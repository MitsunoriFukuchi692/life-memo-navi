import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';

const router: Router = express.Router();

// ユーザーの年表一覧取得
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM timelines WHERE user_id = $1 ORDER BY year DESC, month DESC',
      [user_id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get timelines error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ取得（ID指定）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM timelines WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ追加
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, year, month, event_title, event_description, photo_id } = req.body;

    if (!user_id || !year || !event_title) {
      return res.status(400).json({ error: 'Missing required fields: user_id, year, event_title' });
    }

    const result = await pool.query(
      'INSERT INTO timelines (user_id, year, month, event_title, event_description, photo_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, year, month || null, event_title, event_description || null, photo_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { event_title, event_description, month, photo_id } = req.body;

    const result = await pool.query(
      'UPDATE timelines SET event_title = COALESCE($1, event_title), event_description = COALESCE($2, event_description), month = COALESCE($3, month), photo_id = COALESCE($4, photo_id), updated_at = NOW() WHERE id = $5 RETURNING *',
      [event_title || null, event_description || null, month || null, photo_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 年表エントリ削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM timelines WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;