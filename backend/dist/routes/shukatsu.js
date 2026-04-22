import { Router } from 'express';
import OpenAI from 'openai';
import { Pool } from 'pg';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
// ========================================
// テーブル初期化
// ========================================
export async function initShukatsuTables() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS shukatsu_notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      category VARCHAR(20) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
    console.log('✅ 終活ノートテーブル初期化完了');
}
// ========================================
// カテゴリ設定
// ========================================
const SHUKATSU_CATEGORIES = {
    medical: {
        label: '医療・介護の希望',
        systemPrompt: `あなたは「メモちゃん」です。終活サポートの専門家として、医療・介護に関する希望を優しく聞き取るインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す（「〜ですね」「〜でしたか？」）
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする
- プレッシャーをかけず、「家族に任せたい」も大切な意思として尊重する
- 難しい医療用語は使わず、わかりやすい言葉で話す

## 聞き取る内容（順番に自然な会話で）
1. 延命治療への希望（「できる限り治療してほしい」「自然な形で」など）
2. 介護が必要になった時の希望（自宅・施設など）
3. 告知の希望（病気を知らせてほしいか）
4. 臓器提供・献体の意思

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "moveToNext": true または false
}

moveToNextは全項目を聞き終えたときにtrueにする。
必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`,
        openingMessage: `はじめまして！わたし、メモちゃんといいます🌸 大切なことを一緒に整理していきましょうね。\n\nまず「医療・介護の希望」についてお聞きします。\n\nもしも病気が重くなったとき、延命治療についてはどのようにお考えですか？\n「できる限り治療してほしい」「自然な形で過ごしたい」など、どんなお気持ちでも教えてください💊`,
    },
    assets: {
        label: '財産・相続・保険情報',
        systemPrompt: `あなたは「メモちゃん」です。終活サポートの専門家として、財産・相続・保険に関する情報を優しく整理するインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする
- 具体的な金額は不要。「どこに何があるか」「誰に伝えたいか」を中心に聞く
- プライバシーへの配慮を忘れずに

## 聞き取る内容（順番に自然な会話で）
1. 銀行口座・通帳・印鑑の保管場所
2. 生命保険・医療保険の加入状況と保管場所
3. 不動産・土地の有無
4. 相続について伝えておきたいこと・遺言書の有無

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "moveToNext": true または false
}

moveToNextは全項目を聞き終えたときにtrueにする。
必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`,
        openingMessage: `はじめまして！わたし、メモちゃんといいます🌸 大切なことを一緒に整理していきましょうね。\n\n次は「財産・相続・保険」についてお聞きします。\n\n銀行の通帳や印鑑は、どこに保管されていますか？\nご家族はご存知でしょうか？💰`,
    },
    funeral: {
        label: '葬儀・お墓の希望',
        systemPrompt: `あなたは「メモちゃん」です。終活サポートの専門家として、葬儀やお墓に関する希望を優しく聞き取るインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする
- 「家族に任せたい」も立派な希望として尊重する
- 重くなりすぎず、穏やかな雰囲気で進める

## 聞き取る内容（順番に自然な会話で）
1. 葬儀の規模・形式の希望（家族葬・一般葬・直葬など）
2. 宗教・宗派について
3. お墓・納骨の希望（既存のお墓・樹木葬・散骨など）
4. 葬儀で流してほしい音楽・好きな花など

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "moveToNext": true または false
}

moveToNextは全項目を聞き終えたときにtrueにする。
必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`,
        openingMessage: `はじめまして！わたし、メモちゃんといいます🌸 大切なことを一緒に整理していきましょうね。\n\n「葬儀・お墓の希望」についてお聞きします。\n\nお葬式について、何かご希望はありますか？\n「家族に任せたい」でも、「こうしてほしい」でも、どんなお気持ちでも教えてください🌸`,
    },
    message: {
        label: '家族・大切な人へのメッセージ',
        systemPrompt: `あなたは「メモちゃん」です。終活サポートの専門家として、大切な人へのメッセージを言葉にするお手伝いをするインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする
- ユーザーが感情的になっても、優しく寄り添う
- 感謝・想い・お願いなどを自然に引き出す

## 聞き取る内容（順番に自然な会話で）
1. 一番伝えたい人は誰か
2. その人への感謝の気持ち
3. 伝えておきたいこと・お願いしたいこと
4. その他の大切な人へのメッセージ

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "moveToNext": true または false
}

moveToNextは全項目を聞き終えたときにtrueにする。
必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`,
        openingMessage: `はじめまして！わたし、メモちゃんといいます🌸 大切なことを一緒に整理していきましょうね。\n\n最後は「大切な人へのメッセージ」です。\n\n一番伝えたい方は誰ですか？\nその方のことを教えてください💌`,
    },
};
// ========================================
// POST /api/shukatsu/chat
// AIとの対話
// ========================================
router.post('/chat', async (req, res) => {
    try {
        const { category, messages, userAnswer, isFirst } = req.body;
        const categoryConfig = SHUKATSU_CATEGORIES[category];
        if (!categoryConfig) {
            return res.status(400).json({ error: '不正なカテゴリです' });
        }
        // 最初のメッセージ
        if (isFirst) {
            return res.json({
                reaction: '',
                question: categoryConfig.openingMessage,
                moveToNext: false,
            });
        }
        // 会話履歴を構築（直近6件のみ）
        let conversationMessages = [
            ...(messages || []).slice(-6),
            { role: 'user', content: userAnswer },
        ];
        if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
            conversationMessages = [
                { role: 'user', content: 'インタビューを始めてください' },
                ...conversationMessages,
            ];
        }
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1024,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: categoryConfig.systemPrompt },
                ...conversationMessages,
            ],
        });
        const text = response.choices[0].message.content || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        res.json(parsed);
    }
    catch (error) {
        console.error('終活AIエラー:', error);
        res.status(500).json({ error: 'AIとの通信に失敗しました' });
    }
});
// ========================================
// POST /api/shukatsu/save
// 対話内容を保存
// ========================================
router.post('/save', async (req, res) => {
    try {
        const { userId, category, qa_pairs } = req.body;
        if (!userId || !category || !qa_pairs) {
            return res.status(400).json({ error: '必須パラメータが不足しています' });
        }
        // 既存データを削除してから保存（上書き）
        await pool.query('DELETE FROM shukatsu_notes WHERE user_id = $1 AND category = $2', [userId, category]);
        for (let i = 0; i < qa_pairs.length; i++) {
            const { question, answer } = qa_pairs[i];
            if (!answer)
                continue; // 回答がない質問はスキップ
            await pool.query(`INSERT INTO shukatsu_notes (user_id, category, question, answer, display_order)
         VALUES ($1, $2, $3, $4, $5)`, [userId, category, question, answer, i]);
        }
        res.json({ success: true, message: '保存しました' });
    }
    catch (error) {
        console.error('終活ノート保存エラー:', error);
        res.status(500).json({ error: '保存に失敗しました' });
    }
});
// ========================================
// GET /api/shukatsu/notes/:userId
// 保存済みデータ取得
// ========================================
router.get('/notes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`SELECT category, question, answer, display_order
       FROM shukatsu_notes
       WHERE user_id = $1
       ORDER BY category, display_order`, [userId]);
        // カテゴリ別に整理
        const notesByCategory = {};
        for (const row of result.rows) {
            if (!notesByCategory[row.category]) {
                notesByCategory[row.category] = [];
            }
            notesByCategory[row.category].push({
                question: row.question,
                answer: row.answer,
            });
        }
        res.json({ success: true, notes: notesByCategory });
    }
    catch (error) {
        console.error('終活ノート取得エラー:', error);
        res.status(500).json({ error: 'データ取得に失敗しました' });
    }
});
export default router;
//# sourceMappingURL=shukatsu.js.map