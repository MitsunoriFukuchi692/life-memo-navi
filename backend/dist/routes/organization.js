import { Router } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
const router = Router();
// DB接続（既存のdb設定を流用）
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
function generateOrgCode(prefix) {
    const num = crypto.randomInt(1000, 9999);
    const clean = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
    return `${clean}-${num}`;
}
// ========================================
// POST /api/org/create
// 新しい団体を登録する（管理者のみ）
// ========================================
router.post('/create', async (req, res) => {
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
            const existing = await pool.query('SELECT id FROM organizations WHERE org_code = $1', [orgCode]);
            if (existing.rows.length === 0)
                break;
            attempts++;
        }
        const result = await pool.query(`INSERT INTO organizations (name, org_code, contact_email, admin_email)
       VALUES ($1, $2, $3, $4) RETURNING *`, [name, orgCode, contactEmail || '', adminEmail]);
        res.json({
            success: true,
            organization: result.rows[0],
            message: `団体コード: ${orgCode} を発行しました`,
        });
    }
    catch (err) {
        console.error('団体作成エラー:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});
// ========================================
// POST /api/org/join
// 団体コードを入力して会員として参加
// ========================================
router.post('/join', async (req, res) => {
    try {
        const { orgCode, userId, userName, userEmail } = req.body;
        if (!orgCode || !userId) {
            return res.status(400).json({ error: '団体コードとユーザーIDは必須です' });
        }
        // 団体コードを確認
        const orgResult = await pool.query('SELECT * FROM organizations WHERE org_code = $1', [orgCode.trim().toUpperCase()]);
        if (orgResult.rows.length === 0) {
            return res.status(404).json({ error: '団体コードが見つかりません。正しいコードを入力してください。' });
        }
        const org = orgResult.rows[0];
        // すでに参加済みか確認
        const existing = await pool.query('SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2', [org.id, userId]);
        if (existing.rows.length > 0) {
            return res.json({
                success: true,
                alreadyJoined: true,
                orgName: org.name,
                message: `すでに「${org.name}」に参加しています`,
            });
        }
        // 参加登録
        await pool.query(`INSERT INTO organization_members (organization_id, user_id, user_name, user_email)
       VALUES ($1, $2, $3, $4)`, [org.id, userId, userName || '', userEmail || '']);
        res.json({
            success: true,
            orgName: org.name,
            message: `「${org.name}」に参加しました！`,
        });
    }
    catch (err) {
        console.error('団体参加エラー:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});
// ========================================
// GET /api/org/dashboard/:orgCode
// 事務局スタッフ用：会員一覧を取得
// ========================================
router.get('/dashboard/:orgCode', async (req, res) => {
    try {
        const { orgCode } = req.params;
        const { adminEmail } = req.query;
        // 団体を確認
        const orgResult = await pool.query('SELECT * FROM organizations WHERE org_code = $1', [orgCode.toUpperCase()]);
        if (orgResult.rows.length === 0) {
            return res.status(404).json({ error: '団体が見つかりません' });
        }
        const org = orgResult.rows[0];
        // 管理者メールアドレスで認証
        if (org.admin_email !== adminEmail) {
            return res.status(403).json({ error: '管理者権限がありません' });
        }
        // 会員一覧を取得
        const membersResult = await pool.query(`SELECT id, user_name, user_email, joined_at
       FROM organization_members
       WHERE organization_id = $1
       ORDER BY joined_at DESC`, [org.id]);
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
    }
    catch (err) {
        console.error('ダッシュボード取得エラー:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});
// ========================================
// GET /api/org/info/:orgCode
// 団体情報を取得（ユーザー向け：認証不要）
// ========================================
router.get('/info/:orgCode', async (req, res) => {
    try {
        const { orgCode } = req.params;
        const result = await pool.query('SELECT name, org_code, created_at FROM organizations WHERE org_code = $1', [orgCode.toUpperCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '団体コードが見つかりません' });
        }
        res.json({
            success: true,
            organization: result.rows[0],
        });
    }
    catch (err) {
        console.error('団体情報取得エラー:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});
export default router;
//# sourceMappingURL=organization.js.map