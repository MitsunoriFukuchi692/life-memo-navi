import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db.js';
const router: Router = express.Router();

// ユーザー登録
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, age, email, password, project_type } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // 登録日から30日後を試用期限にセット
    const result = await pool.query(
      `INSERT INTO users (name, age, email, password_hash, project_type, trial_expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
       RETURNING id, name, age, email, project_type, trial_expires_at`,
      [name, age, email, hashedPassword, project_type || 'jibunshi']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ id: user.id, name: user.name, age: user.age, email: user.email, project_type: user.project_type, token });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ログイン
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

    // トライアル期限チェック
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
    res.json({ id: user.id, name: user.name, age: user.age, email: user.email, project_type: user.project_type, token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
