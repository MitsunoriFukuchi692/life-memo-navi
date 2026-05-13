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

// ========== planカラム・各種テーブル 自動作成 ==========
export async function initPlanColumn() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'standard'
    `);
    console.log('✅ users.plan カラムを確認しました');
  } catch (e) {
    console.error('planカラム追加エラー:', e);
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ password_reset_tokens テーブルを確認しました');
  } catch (e) {
    console.error('password_reset_tokensテーブル作成エラー:', e);
  }
  try {
    // email_verified: NULL=既存ユーザー（確認済み扱い）、false=未確認、true=確認済み
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT NULL
    `);
    console.log('✅ users.email_verified カラムを確認しました');
  } catch (e) {
    console.error('email_verifiedカラム追加エラー:', e);
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ email_verification_tokens テーブルを確認しました');
  } catch (e) {
    console.error('email_verification_tokensテーブル作成エラー:', e);
  }
}

// ========== ユーザー登録 ==========
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, age, email, password, project_type, plan } = req.body;
    const safePlan = plan === 'publisher' ? 'publisher' : 'standard';
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, age, email, password_hash, project_type, plan, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, name, age, email, project_type, plan`,
      [name, age, email, hashedPassword, project_type || 'jibunshi', safePlan]
    );
    const user = result.rows[0];

    // メール確認トークン生成・保存
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間有効
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [user.id, verifyToken, verifyExpires]
    );

    // 確認メール送信
    const verifyUrl = `https://memo.robostudy.jp/verify-email?token=${verifyToken}`;
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: '【ライフメモナビ】メールアドレスの確認をお願いします',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E75B6;">メールアドレスの確認</h2>
            <p>${name} 様、ライフメモナビにご登録いただきありがとうございます！</p>
            <p>以下のボタンをクリックして、メールアドレスを確認してください。</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}"
                 style="background-color: #2E75B6; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 6px; font-size: 16px;">
                メールアドレスを確認する
              </a>
            </p>
            <p style="color: #999; font-size: 13px;">
              ※このリンクは24時間有効です。<br>
              ※心当たりがない場合は、このメールを無視してください。
            </p>
            <hr>
            <p style="color: #999; font-size: 12px;">ライフメモナビ運営事務局</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('確認メール送信エラー:', mailErr);
      // メール送信失敗でも登録自体は成功させる
    }

    res.status(201).json({
      id: user.id, name: user.name, age: user.age,
      email: user.email, project_type: user.project_type, plan: user.plan,
      message: '登録完了！確認メールを送信しました。メールのリンクをクリックしてログインできるようになります。'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    // メールアドレス重複エラーを日本語で返す
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(409).json({ error: 'このメールアドレスはすでに登録されています。ログイン画面からログインしてください。' });
    }
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
    // メール未確認チェック（既存ユーザーはNULLなのでスルー）
    if (user.email_verified === false) {
      return res.status(403).json({
        error: 'メールアドレスが確認されていません。登録時に送信した確認メールのリンクをクリックしてください。',
        email_unverified: true
      });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ id: user.id, name: user.name, age: user.age, email: user.email, project_type: user.project_type, plan: user.plan || 'standard', token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== メールアドレス確認 ==========
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    const result = await pool.query(
      'SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: '確認リンクが無効または期限切れです。再度ご登録ください。' });
    }
    const userId = result.rows[0].user_id;
    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
    await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
    // フロントエンドのログインページにリダイレクト
    res.redirect('https://memo.robostudy.jp/login?verified=true');
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'メール確認に失敗しました' });
  }
});

// ========== 確認メール再送信 ==========
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: '確認メールを送信しました。受信箱をご確認ください。' });
    }
    const user = result.rows[0];
    if (user.email_verified === true || user.email_verified === null) {
      return res.json({ message: 'このメールアドレスはすでに確認済みです。' });
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [user.id, verifyToken, verifyExpires]
    );
    const verifyUrl = `https://memo.robostudy.jp/verify-email?token=${verifyToken}`;
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: '【ライフメモナビ】メールアドレスの確認をお願いします',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">メールアドレスの確認</h2>
          <p>以下のボタンをクリックして、メールアドレスを確認してください。</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background-color: #2E75B6; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              メールアドレスを確認する
            </a>
          </p>
          <p style="color: #999; font-size: 13px;">※このリンクは24時間有効です。</p>
          <hr>
          <p style="color: #999; font-size: 12px;">ライフメモナビ運営事務局</p>
        </div>
      `,
    });
    res.json({ message: '確認メールを再送信しました。受信箱をご確認ください。' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'メール送信に失敗しました' });
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
      from: process.env.GMAIL_USER,
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