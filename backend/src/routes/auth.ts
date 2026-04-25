import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db/db.js';

const router: Router = express.Router();

// ========== メール送信設定 ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ========== 認証ミドルウェア ==========
function authMiddleware(req: any, res: Response, next: Function) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '認証が必要です' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number };
    next();
  } catch {
    return res.status(401).json({ error: 'トークンが無効です' });
  }
}

// ========== planカラム自動追加（初回起動時マイグレーション） ==========
export async function initPlanColumn() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'standard'
    `);
    console.log('✅ users.plan カラムを確認しました');
  } catch (e) {
    console.error('planカラム追加エラー:', e);
  }
}

// ========== ユーザー登録 ==========
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, age, email, password, project_type } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, age, email, password_hash, project_type, trial_expires_at, plan)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days', 'standard')
       RETURNING id, name, age, email, project_type, trial_expires_at, plan`,
      [name, age, email, hashedPassword, project_type || 'jibunshi']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ id: user.id, name: user.name, age: user.age, email: user.email, project_type: user.project_type, plan: user.plan, token });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ログイン ==========
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }
    if (user.trial_expires_at) {
      const now = new Date();
      const expires = new Date(user.trial_expires_at);
      if (now > expires) {
        return res.status(403).json({
          error: 'トライアル期間が終了しました。ご利用を継続するには管理者までご連絡ください。\n\nmitsunorif@robostudy.jp'
        });
      }
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ id: user.id, name: user.name, age: user.age, email: user.email, project_type: user.project_type, plan: user.plan || 'standard', token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== パスワードリセット申請 ==========
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // ユーザーが存在しない場合も同じメッセージ（セキュリティ対策）
    if (result.rows.length === 0) {
      return res.json({ message: 'メールを送信しました。受信箱をご確認ください。' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間有効

    // トークンをDBに保存
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [user.id, token, expires]
    );

    // リセットメール送信
    const resetUrl = `https://memo.robostudy.jp/reset-password?token=${token}`;
    await transporter.sendMail({
      from: 'mfukuchi6@gmail.com',
      to: email,
      subject: '【ライフメモナビ】パスワードリセットのご案内',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">パスワードリセットのご案内</h2>
          <p>ライフメモナビをご利用いただきありがとうございます。</p>
          <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #2E75B6; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              パスワードをリセットする
            </a>
          </p>
          <p style="color: #999; font-size: 13px;">
            ※このリンクは1時間有効です。<br>
            ※心当たりがない場合は、このメールを無視してください。
          </p>
          <hr>
          <p style="color: #999; font-size: 12px;">ライフメモナビ運営事務局</p>
        </div>
      `,
    });

    res.json({ message: 'メールを送信しました。受信箱をご確認ください。' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'メール送信に失敗しました' });
  }
});

// ========== パスワードリセット実行 ==========
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'リセットリンクが無効または期限切れです' });
    }

    const userId = result.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(password, 10);

    // パスワード更新
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    // 使用済みトークン削除
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    res.json({ message: 'パスワードを変更しました。新しいパスワードでログインしてください。' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'パスワードリセットに失敗しました' });
  }
});

// ========== アカウント削除 ==========
router.delete('/delete-account', authMiddleware, async (req: any, res: Response) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM interviews WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM timelines WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM photos WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    res.json({ message: 'アカウントおよびすべてのデータを完全に削除しました' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'データ削除中にエラーが発生しました' });
  } finally {
    client.release();
  }
});

// ========== ログインユーザー情報取得 ==========
router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, age, email, project_type, trial_expires_at, plan FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;