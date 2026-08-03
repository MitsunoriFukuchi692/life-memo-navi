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
    // 各ユーザーの記録数・最終利用日を interviews から集計して結合する
    // （記録0＝登録だけで未利用、の判別用）
    const usersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.age,
              TO_CHAR(u.birthdate, 'YYYY-MM-DD') AS birthdate,
              u.created_at,
              COALESCE(r.cnt, 0)::int AS record_count,
              r.last_active
       FROM users u
       LEFT JOIN (
         SELECT user_id, COUNT(*) AS cnt, MAX(updated_at) AS last_active
         FROM interviews GROUP BY user_id
       ) r ON r.user_id = u.id
       ORDER BY u.created_at DESC`
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

// ✅ ユーザー削除
// DELETE /api/admin/users/:id?key=YOUR_SECRET_KEY
router.delete('/users/:id', adminAuth, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: '無効なユーザーIDです' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM interviews WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM timelines WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM photos WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    res.json({ message: `ユーザーID ${userId} を削除しました` });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'ユーザー削除に失敗しました' });
  } finally {
    client.release();
  }
});

export default router;
