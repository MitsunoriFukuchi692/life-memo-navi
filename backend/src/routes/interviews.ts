import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';
import OpenAI from 'openai';
import { encrypt, decrypt } from '../utils/encryption.js';

const router: Router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JIBUNSHI_QUESTIONS = [
  "あなたの生まれた時代はどんな時代でしたか？",
  "生まれた場所と、幼い頃の思い出は？",
  "家族について教えてください",
  "学生時代の思い出は？",
  "最初の職場での経験は？",
  "人生での大きな決断は？",
  "仕事でやりがいを感じたことは？",
  "人生で出会った大切な人は？",
  "趣味や好きなことは？",
  "人生での失敗や試練は？",
  "それらからどう学びましたか？",
  "今、大切にしていることは？",
  "家族や後世代に伝えたいことは？",
  "人生で一番幸せだった時は？",
  "未来へのメッセージは？"
];

const KAISHASHI_QUESTIONS = [
  "創業のきっかけは何でしたか？",
  "創業当時の社会状況や業界の様子は？",
  "会社名の由来や理念は？",
  "創業メンバーや初期の苦労は？",
  "最初の商品・サービスは？",
  "事業拡大の転機は何でしたか？",
  "大きな失敗や危機はありましたか？",
  "それをどう乗り越えましたか？",
  "印象に残る顧客や取引先との出来事は？",
  "社員との思い出や組織づくりで大切にしたことは？",
  "技術やサービスでこだわった点は？",
  "社会にどんな価値を提供してきましたか？",
  "自社の強みは何だと思いますか？",
  "後継者や次世代へ伝えたい経営の考え方は？",
  "未来の会社に望むことは？"
];

const SHUKATSU_QUESTIONS = [
  "現在の健康状態について",
  "持病や常用している薬は？",
  "緊急連絡先は？",
  "介護が必要になった場合の希望は？",
  "医療・延命治療についての考えは？",
  "財産（不動産・預金など）の概要は？",
  "保険の加入状況は？",
  "大切にしている品や処分してほしい物は？",
  "デジタル資産（ID・PWなど）の管理方法は？",
  "葬儀の形式や希望は？",
  "お墓や納骨の希望は？",
  "遺言書の有無や内容は？",
  "家族へのメッセージは？",
  "友人・知人へ伝えたいことは？",
  "最期まで大切にしたい生き方は？"
];

const OTHER_QUESTIONS = [
  "人生（経営）で一番影響を受けた出来事は？",
  "あなたの判断基準になっている信念は？",
  "苦しい時に支えになった考え方は？",
  "若い頃の自分にアドバイスするとしたら？",
  "周囲からどんな人だと言われますか？",
  "自分の長所と短所は？",
  "人付き合いで大切にしてきたことは？",
  "大事にしている習慣や日課は？",
  "好きな言葉や座右の銘は？",
  "今でも後悔していることは？",
  "誇りに思っていることは？",
  "人生（会社）を通して得た教訓は？",
  "社会や地域に対する想いは？",
  "人生の最終章でやりたいことは？",
  "自分を一言で表すと？"
];

const getQuestions = (fieldType: string): string[] => {
  switch (fieldType) {
    case 'kaishashi': return KAISHASHI_QUESTIONS;
    case 'shukatsu': return SHUKATSU_QUESTIONS;
    case 'other': return OTHER_QUESTIONS;
    default: return JIBUNSHI_QUESTIONS;
  }
};

// GET: user_id + field_type で取得（復号して返す）
router.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const field_type = (req.query.field_type as string) || 'jibunshi';
    const result = await pool.query(
      'SELECT * FROM interviews WHERE user_id = $1 AND field_type = $2 ORDER BY question_id',
      [user_id, field_type]
    );
    // answer_text を復号して返す
    const rows = result.rows.map(row => ({
      ...row,
      answer_text: row.answer_text ? decrypt(row.answer_text) : row.answer_text,
    }));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: field_type を含めて保存（暗号化して保存）
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, question_id, answer_text, field_type = 'jibunshi' } = req.body;
    if (!user_id || !question_id || question_id < 1 || question_id > 15) {
      return res.status(400).json({ error: 'Invalid question_id (1-15)' });
    }
    const questions = getQuestions(field_type);
    const question_text = questions[question_id - 1];

    // answer_text を暗号化して保存
    const encryptedAnswer = answer_text ? encrypt(answer_text) : answer_text;

    const result = await pool.query(
      `INSERT INTO interviews (user_id, question_id, question_text, answer_text, field_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, question_id, field_type)
       DO UPDATE SET answer_text = $4, updated_at = NOW()
       RETURNING *`,
      [user_id, question_id, question_text, encryptedAnswer, field_type]
    );
    // 返すときは復号して返す
    const row = result.rows[0];
    res.status(201).json({
      ...row,
      answer_text: row.answer_text ? decrypt(row.answer_text) : row.answer_text,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ai-edit', async (req: Request, res: Response) => {
  try {
    const { question_text, answer_text } = req.body;
    if (!answer_text?.trim()) return res.status(400).json({ error: '回答が空です' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `あなたは人生・会社の記録文章編集アシスタントです。ユーザーが書いた回答を、自然で読みやすい文章に整えてください。内容は変えず、話し言葉を丁寧な書き言葉に変換し、箇条書きや断片的な文をつながりのある文章にまとめてください。整えた文章のみを出力してください。` },
        { role: 'user', content: `質問：${question_text}\n\n回答：${answer_text}` },
      ],
      max_tokens: 800, temperature: 0.7,
    });
    res.json({ edited_text: completion.choices[0].message.content || answer_text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ai-edit-all', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || answers.length === 0) return res.status(400).json({ error: '回答がありません' });
    const results: { question_id: number; edited_text: string }[] = [];
    for (const item of answers) {
      if (!item.answer_text?.trim()) {
        results.push({ question_id: item.question_id, edited_text: item.answer_text });
        continue;
      }
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `あなたは人生・会社の記録文章編集アシスタントです。ユーザーが書いた回答を、自然で読みやすい文章に整えてください。内容は変えず、話し言葉を丁寧な書き言葉に変換し、箇条書きや断片的な文をつながりのある文章にまとめてください。整えた文章のみを出力してください。` },
          { role: 'user', content: `質問：${item.question_text}\n\n回答：${item.answer_text}` },
        ],
        max_tokens: 800, temperature: 0.7,
      });
      results.push({ question_id: item.question_id, edited_text: completion.choices[0].message.content || item.answer_text });
    }
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answer_text } = req.body;

    // answer_text を暗号化して保存
    const encryptedAnswer = answer_text ? encrypt(answer_text) : answer_text;

    const result = await pool.query(
      'UPDATE interviews SET answer_text = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [encryptedAnswer, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
    // 返すときは復号して返す
    const row = result.rows[0];
    res.json({
      ...row,
      answer_text: row.answer_text ? decrypt(row.answer_text) : row.answer_text,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
