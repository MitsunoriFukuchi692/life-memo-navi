import express from 'express';
import pool from '../db/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';
const router = express.Router();
// 復号ヘルパー関数（復号に失敗した場合は元データをそのまま返す）
const decryptRow = (row) => {
    try {
        return {
            ...row,
            event_title: row.event_title ? decrypt(row.event_title) : row.event_title,
            event_description: row.event_description ? decrypt(row.event_description) : row.event_description,
        };
    }
    catch (e) {
        console.error(`復号エラー (timeline id=${row.id}):`, e);
        // 復号に失敗した場合はそのまま返す（データが消えるよりマシ）
        return row;
    }
};
// ユーザーの年表一覧取得（field_type対応）
router.get('/user/:user_id', async (req, res) => {
    try {
        const user_id = req.user.id; // URLのuser_idは信用せず本人IDを使う
        const field_type = req.query.field_type || 'jibunshi';
        const result = await pool.query('SELECT * FROM timelines WHERE user_id = $1 AND field_type = $2 ORDER BY year ASC, month ASC', [user_id, field_type]);
        // 復号して返す
        res.json(result.rows.map(decryptRow));
    }
    catch (error) {
        console.error('Get timelines error:', error);
        res.status(500).json({ error: error.message });
    }
});
// 年表エントリ取得（ID指定）
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM timelines WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Timeline not found' });
        res.json(decryptRow(result.rows[0]));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 年表エントリ追加（field_type対応）
router.post('/', async (req, res) => {
    try {
        const user_id = req.user.id; // bodyのuser_idは信用せず本人IDを使う
        const { year, month, event_title, event_description, photo_id, field_type = 'jibunshi' } = req.body;
        if (!user_id || !year || !event_title) {
            return res.status(400).json({ error: 'Missing required fields: user_id, year, event_title' });
        }
        // 暗号化して保存
        const encryptedTitle = encrypt(event_title);
        const encryptedDescription = event_description ? encrypt(event_description) : null;
        const result = await pool.query('INSERT INTO timelines (user_id, year, month, event_title, event_description, photo_id, field_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [user_id, year, month || null, encryptedTitle, encryptedDescription, photo_id || null, field_type]);
        // 復号して返す
        res.status(201).json(decryptRow(result.rows[0]));
    }
    catch (error) {
        console.error('Create timeline error:', error);
        res.status(500).json({ error: error.message });
    }
});
// 年表エントリ更新
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { event_title, event_description, month, year, photo_id } = req.body;
        // 暗号化して保存
        const encryptedTitle = event_title ? encrypt(event_title) : null;
        // 空欄で送られた月・詳細はクリアできるよう「直接更新」する（COALESCEだと空更新が握り潰される）。
        // 必須の event_title / year だけは未送信時に既存値を保持（COALESCE）。
        const encryptedDescription = event_description ? encrypt(event_description) : null;
        const result = await pool.query(`UPDATE timelines SET
         event_title = COALESCE($1, event_title),
         event_description = $2,
         month = $3,
         year = COALESCE($4, year),
         photo_id = COALESCE($5, photo_id),
         updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`, [encryptedTitle, encryptedDescription, (month ?? null), year || null, photo_id || null, id, req.user.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Timeline not found' });
        // 復号して返す
        res.json(decryptRow(result.rows[0]));
    }
    catch (error) {
        console.error('Update timeline error:', error);
        res.status(500).json({ error: error.message });
    }
});
// 年表エントリ削除
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM timelines WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Timeline not found' });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete timeline error:', error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=timelines.js.map