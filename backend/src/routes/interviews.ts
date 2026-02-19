import express, { Router, Request, Response } from 'express';
import pool from '../db/db.js';
import OpenAI from 'openai';

const router: Router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INTERVIEW_QUESTIONS = [
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

// ユーザーのインタビュー一覧取得
router.get('/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM interviews WHERE user_id = $1 ORDER BY question_id',
      [user_id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// インタビュー回答保存
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, question_id, answer_text } = req.body;

    if (!user_id || !question_id || question_id < 1 || question_id > 15) {
      return res.status(400).json({ error: 'Invalid question_id (1-15)' });
    }

    const question_text = INTERVIEW_QUESTIONS[question_id - 1];

    const result = await pool.query(
      'INSERT INTO interviews (user_id, question_id, question_text, answer_text) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, question_id) DO UPDATE SET answer_text = $4, updated_at = NOW() RETURNING *',
      [user_id, question_id, question_text, answer_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Save interview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI編集（1問）
router.post('/ai-edit', async (req: Request, res: Response) => {
  try {
    const { question_text, answer_text } = req.body;

    if (!answer_text?.trim()) {
      return res.status(400).json({ error: '回答が空です' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは自分史の文章編集アシスタントです。
ユーザーが書いた回答を、自然で読みやすい文章に整えてください。
ルール：
- 内容は変えず、言葉を整えるだけにする
- 話し言葉を丁寧な書き言葉に変換する
- 箇条書きや断片的な文を、つながりのある文章にまとめる
- 日本語で出力する
- 整えた文章のみを出力し、説明や前置きは不要`,
        },
        {
          role: 'user',
          content: `質問：${question_text}\n\n回答：${answer_text}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const edited = completion.choices[0].message.content || answer_text;
    res.json({ edited_text: edited });
  } catch (error: any) {
    console.error('AI edit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI編集（全問一括）
router.post('/ai-edit-all', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    // answers: [{ question_id, question_text, answer_text }]

    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: '回答がありません' });
    }

    const results: { question_id: number; edited_text: string }[] = [];

    for (const item of answers) {
      if (!item.answer_text?.trim()) {
        results.push({ question_id: item.question_id, edited_text: item.answer_text });
        continue;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは自分史の文章編集アシスタントです。
ユーザーが書いた回答を、自然で読みやすい文章に整えてください。
ルール：
- 内容は変えず、言葉を整えるだけにする
- 話し言葉を丁寧な書き言葉に変換する
- 箇条書きや断片的な文を、つながりのある文章にまとめる
- 日本語で出力する
- 整えた文章のみを出力し、説明や前置きは不要`,
          },
          {
            role: 'user',
            content: `質問：${item.question_text}\n\n回答：${item.answer_text}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const edited = completion.choices[0].message.content || item.answer_text;
      results.push({ question_id: item.question_id, edited_text: edited });
    }

    res.json({ results });
  } catch (error: any) {
    console.error('AI edit all error:', error);
    res.status(500).json({ error: error.message });
  }
});

// インタビュー回答更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answer_text } = req.body;

    const result = await pool.query(
      'UPDATE interviews SET answer_text = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [answer_text, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
