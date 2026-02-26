import express, { Request, Response } from 'express';
import pool from '../db/db.js';

const router = express.Router();

// シークレットキー認証ミドルウェア
const adminAuth = (req: Request, res: Response, next: Function) => {
  const key = req.query.key as string;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({ error: 'ADMIN_SECRET_KEY が環境変数に設定されていません' });
  }
  if (key !== secretKey) {
    return res.status(401).json({ error: '認証エラー：キーが正しくありません' });
  }
  next();
};

// ✅ 登録者数・一覧
// GET /api/admin/users?key=YOUR_SECRET_KEY
router.get('/users', adminAuth, async (req: Request, res: Response) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const usersResult = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      total: parseInt(countResult.rows[0].total),
      users: usersResult.rows
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({ error: 'データ取得に失敗しました' });
  }
});

export default router;
