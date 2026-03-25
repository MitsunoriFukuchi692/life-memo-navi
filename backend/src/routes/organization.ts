import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

const router = Router();

// DB接続（既存のdb設定を流用）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// メール送信設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ========================================
// テーブル初期化（起動時に呼ぶ）
// ========================================
export async function initOrganizationTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      org_code VARCHAR(20) UNIQUE NOT NULL,
      contact_email VARCHAR(200),
      admin_email VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id),
      user_id INTEGER NOT NULL,
      user_name VARCHAR(200),
      user_email VARCHAR(200),
      joined_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('✅ 団体テーブル初期化完了');
}

// ========================================
// ランダムな団体コード生成（例: NIPP-1234）
// ========================================
function generateOrgCode(prefix: string): string {
  const num = crypto.randomInt(1000, 9999);
  const clean = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
  return `${clean}-${num}`;
}

// 仮パスワード生成（8文字英数字）
function generateTempPassword(): string {
  return crypto.randomBytes(4).toString('hex'); // 例: a3f8c2d1
}

// ========================================
// POST /api/org/create
// 新しい団体を登録する（管理者のみ）
// ========================================
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { name, contactEmail, adminEmail, adminSecret } = req.body;

    // 管理者認証（環境変数で設定）
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: '権限がありません' });
    }

    if (!name || !adminEmail) {
      return res.status(400).json({ error: '団体名とメールアドレスは必須です' });
    }

    // 団体コード生成（重複しないまで試みる）
    let orgCode = '';
    let attempts = 0;
    while (attempts < 10) {
      orgCode = generateOrgCode(name);
      const existing = await pool.query(
        'SELECT id FROM organizations WHERE org_code = $1', [orgCode]
      );
      if (existing.rows.length === 0) break;
      attempts++;
    }

    const result = await pool.query(
      `INSERT INTO organizations (name, org_code, contact_email, admin_email)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, orgCode, contactEmail || '', adminEmail]
    );

    res.json({
      success: true,
      organization: result.rows[0],
      message: `団体コード: ${orgCode} を発行しました`,
    });
  } catch (err) {
    console.error('団体作成エラー:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// POST /api/org/join
// 団体コードを入力して会員として参加
// ========================================
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { orgCode, userId, userName, userEmail } = req.body;

    if (!orgCode || !userId) {
      return res.status(400).json({ error: '団体コードとユーザーIDは必須です' });
    }

    // 団体コードを確認
    const orgResult = await pool.query(
      'SELECT * FROM organizations WHERE org_code = $1', [orgCode.trim().toUpperCase()]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: '団体コードが見つかりません。正しいコードを入力してください。' });
    }

    const org = orgResult.rows[0];

    // すでに参加済みか確認
    const existing = await pool.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [org.id, userId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        alreadyJoined: true,
        orgName: org.name,
        message: `すでに「${org.name}」に参加しています`,
      });
    }

    // 参加登録
    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, user_name, user_email)
       VALUES ($1, $2, $3, $4)`,
      [org.id, userId, userName || '', userEmail || '']
    );

    res.json({
      success: true,
      orgName: org.name,
      message: `「${org.name}」に参加しました！`,
    });
  } catch (err) {
    console.error('団体参加エラー:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// GET /api/org/dashboard/:orgCode
// 事務局スタッフ用：会員一覧を取得
// ========================================
router.get('/dashboard/:orgCode', async (req: Request, res: Response) => {
  try {
    const { orgCode } = req.params;
    const { adminEmail } = req.query;

    // 団体を確認
    const orgResult = await pool.query(
      'SELECT * FROM organizations WHERE org_code = $1', [orgCode.toUpperCase()]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: '団体が見つかりません' });
    }

    const org = orgResult.rows[0];

    // 管理者メールアドレスで認証
    if (org.admin_email !== adminEmail) {
      return res.status(403).json({ error: '管理者権限がありません' });
    }

    // 会員一覧を取得
    const membersResult = await pool.query(
      `SELECT id, user_name, user_email, joined_at
       FROM organization_members
       WHERE organization_id = $1
       ORDER BY joined_at DESC`,
      [org.id]
    );

    res.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        orgCode: org.org_code,
        contactEmail: org.contact_email,
        createdAt: org.created_at,
      },
      members: membersResult.rows,
      totalCount: membersResult.rows.length,
    });
  } catch (err) {
    console.error('ダッシュボード取得エラー:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// GET /api/org/info/:orgCode
// 団体情報を取得（ユーザー向け：認証不要）
// ========================================
router.get('/info/:orgCode', async (req: Request, res: Response) => {
  try {
    const { orgCode } = req.params;

    const result = await pool.query(
      'SELECT name, org_code, created_at FROM organizations WHERE org_code = $1',
      [orgCode.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '団体コードが見つかりません' });
    }

    res.json({
      success: true,
      organization: result.rows[0],
    });
  } catch (err) {
    console.error('団体情報取得エラー:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// POST /api/org/import-members
// CSVインポート：会員一括登録＋招待メール送信
// ========================================
router.post('/import-members', async (req: Request, res: Response) => {
  const { orgCode, adminEmail, members } = req.body;

  if (!orgCode || !adminEmail || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: '必要な情報が不足しています' });
  }

  try {
    // 団体と管理者を確認（admin_emailで統一）
    const orgResult = await pool.query(
      `SELECT * FROM organizations WHERE org_code = $1 AND admin_email = $2`,
      [orgCode.toUpperCase(), adminEmail.trim()]
    );

    if (orgResult.rows.length === 0) {
      return res.status(403).json({ error: '団体コードまたは管理者メールアドレスが正しくありません' });
    }

    const org = orgResult.rows[0];
    let successCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 各会員を処理
    for (const member of members) {
      const { name, email } = member;

      if (!name || !email) {
        errors.push(`${email || '不明'}: 名前またはメールアドレスが空です`);
        continue;
      }

      try {
        // 既存ユーザーチェック
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email.trim().toLowerCase()]
        );

        let userId: number;

        if (existingUser.rows.length > 0) {
          // 既存ユーザー
          userId = existingUser.rows[0].id;

          const alreadyMember = await pool.query(
            'SELECT id FROM organization_members WHERE user_id = $1 AND organization_id = $2',
            [userId, org.id]
          );

          if (alreadyMember.rows.length > 0) {
            skippedCount++;
            continue; // 既に会員 → スキップ
          }

          // 既存ユーザーを組織に追加
          await pool.query(
            `INSERT INTO organization_members (organization_id, user_id, user_name, user_email, joined_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [org.id, userId, name.trim(), email.trim().toLowerCase()]
          );

          await sendWelcomeEmail(email, name, org.name, null);
          successCount++;

        } else {
          // 新規ユーザー作成
          const tempPassword = generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          const newUser = await pool.query(
            `INSERT INTO users (name, email, password, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             RETURNING id`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword]
          );

          userId = newUser.rows[0].id;

          // organization_membersに追加
          await pool.query(
            `INSERT INTO organization_members (organization_id, user_id, user_name, user_email, joined_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [org.id, userId, name.trim(), email.trim().toLowerCase()]
          );

          await sendWelcomeEmail(email, name, org.name, tempPassword);
          successCount++;
        }

      } catch (memberError) {
        console.error(`会員処理エラー (${email}):`, memberError);
        errors.push(`${email}: 処理中にエラーが発生しました`);
      }
    }

    return res.json({
      success: successCount,
      skipped: skippedCount,
      errors,
    });

  } catch (err) {
    console.error('CSVインポートエラー:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// 招待メール送信関数
// ========================================
async function sendWelcomeEmail(
  email: string,
  name: string,
  orgName: string,
  tempPassword: string | null
): Promise<void> {
  const loginUrl = 'https://memo.robostudy.jp';

  const passwordSection = tempPassword
    ? `■ 仮パスワード: ${tempPassword}\n\n初回ログイン後、マイページからパスワードを変更してください。`
    : `すでにアカウントをお持ちのため、これまでのパスワードでログインいただけます。`;

  const mailOptions = {
    from: `"ライフ・メモナビ事務局" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `【ライフ・メモナビ】${orgName}からご招待が届きました`,
    text: `
${name} 様

${orgName}からライフ・メモナビへご招待いたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ライフ・メモナビで会員の皆様の元気と健康の秘訣を記録に残し、
子供達や孫の世代の応援になるようにしましょう。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ ログインURL: ${loginUrl}
■ メールアドレス: ${email}
${passwordSection}

ご不明な点がございましたら、事務局までお問い合わせください。

───────────────────────────
ライフ・メモナビ（ロボ・スタディ株式会社）
https://memo.robostudy.jp
───────────────────────────
`,
    html: `
<div style="font-family: 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; font-size: 22px; margin: 0;">📖 ライフ・メモナビ</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">あなたの人生を記録に残しましょう</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #333;">${name} 様</p>
    <p style="font-size: 14px; color: #555; line-height: 1.8;">
      <strong>${orgName}</strong>からライフ・メモナビへご招待いたします。
    </p>
    <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.8;">
        ライフ・メモナビで会員の皆様の元気と健康の秘訣を記録に残し、<br>
        <strong>子供達や孫の世代の応援になるようにしましょう。</strong>
      </p>
    </div>
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #333;">📋 ログイン情報</p>
      <table style="width: 100%; font-size: 14px; color: #555;">
        <tr><td style="padding: 4px 0; width: 140px;">ログインURL</td><td><a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a></td></tr>
        <tr><td style="padding: 4px 0;">メールアドレス</td><td>${email}</td></tr>
        ${tempPassword ? `<tr><td style="padding: 4px 0;">仮パスワード</td><td><strong style="font-size: 18px; letter-spacing: 2px; color: #333;">${tempPassword}</strong></td></tr>` : ''}
      </table>
      ${tempPassword ? '<p style="font-size: 12px; color: #e65100; margin: 12px 0 0;">※ 初回ログイン後、マイページからパスワードを変更してください</p>' : ''}
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${loginUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ライフ・メモナビにログイン
      </a>
    </div>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      ライフ・メモナビ（ロボ・スタディ株式会社）<br>
      <a href="${loginUrl}" style="color: #999;">${loginUrl}</a>
    </p>
  </div>
</div>
`,
  };

  await transporter.sendMail(mailOptions);
}

export default router;
