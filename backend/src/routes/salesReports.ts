import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router: Router = express.Router();

// テーブル初期化（サーバー起動時に呼ぶ）
export async function initSalesReportTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_reports (
        id            SERIAL PRIMARY KEY,
        user_id       INT NOT NULL,
        report_date   DATE NOT NULL,
        visit_company TEXT DEFAULT '',
        contact_person TEXT DEFAULT '',
        purpose       TEXT DEFAULT '',
        content       TEXT DEFAULT '',
        next_action   TEXT DEFAULT '',
        impression    TEXT DEFAULT '',
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ sales_reports テーブルを確認しました');
  } catch (e) {
    console.error('sales_reports テーブル作成エラー:', e);
  }
}

// 暗号化して保存するフィールド
const ENCRYPTED_FIELDS = ['content', 'next_action', 'impression'] as const;

const encryptReport = (data: Record<string, any>) => ({
  ...data,
  content:     data.content     ? encrypt(data.content)     : data.content,
  next_action: data.next_action ? encrypt(data.next_action) : data.next_action,
  impression:  data.impression  ? encrypt(data.impression)  : data.impression,
});

const decryptReport = (row: Record<string, any>) => {
  const decrypted = { ...row };
  for (const field of ENCRYPTED_FIELDS) {
    try {
      decrypted[field] = row[field] ? decrypt(row[field]) : row[field];
    } catch {
      // 復号失敗時は元のデータを維持
    }
  }
  return decrypted;
};

// GET: ユーザーの全日報を取得（日付降順）
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM sales_reports WHERE user_id = $1 ORDER BY report_date DESC, created_at DESC`,
      [user_id]
    );
    res.json(result.rows.map(decryptReport));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: 単一日報を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sales_reports WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(decryptReport(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: 新規日報を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id, report_date, visit_company, contact_person,
      purpose, content, next_action, impression,
    } = req.body;

    if (!user_id || !report_date) {
      return res.status(400).json({ error: 'user_id と report_date は必須です' });
    }

    const enc = encryptReport({ content, next_action, impression });

    const result = await pool.query(
      `INSERT INTO sales_reports
        (user_id, report_date, visit_company, contact_person, purpose, content, next_action, impression)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, report_date, visit_company || '', contact_person || '',
       purpose || '', enc.content || '', enc.next_action || '', enc.impression || '']
    );
    res.status(201).json(decryptReport(result.rows[0]));
  } catch (error: any) {
    console.error('営業日報作成エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: 日報を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      report_date, visit_company, contact_person,
      purpose, content, next_action, impression,
    } = req.body;

    const enc = encryptReport({ content, next_action, impression });

    const result = await pool.query(
      `UPDATE sales_reports
       SET report_date = $1, visit_company = $2, contact_person = $3,
           purpose = $4, content = $5, next_action = $6, impression = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [report_date, visit_company || '', contact_person || '',
       purpose || '', enc.content || '', enc.next_action || '', enc.impression || '',
       id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(decryptReport(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: 日報を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sales_reports WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, deleted_id: result.rows[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
