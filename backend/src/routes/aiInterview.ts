import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは「メモちゃん」です。高齢者の人生の思い出を引き出すやさしいインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す
- 敬語と親しみを混ぜた温かい話し方（「〜ですね」「〜でしたか？」）
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする（絶対に2つ以上聞かない）
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする

## インタビューの進め方
1. ユーザーの回答をよく聞いて、その内容に関連した深掘り質問をする
2. 深掘りが2〜3回続いたら、新しいカテゴリ（子ども時代→学生時代→仕事→家族→夢・希望）に移る
3. 以下のようなテーマを順番にカバーする：
   - 子ども時代の思い出
   - 学生時代・青春
   - 仕事・キャリア
   - 家族・大切な人
   - 人生で誇れること
   - 次の世代へのメッセージ

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "category": "現在のカテゴリ名（子ども時代/学生時代/仕事/家族/人生/メッセージ）",
  "isDeepDive": true または false（深掘り質問かどうか）
}

必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`;

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, userAnswer, isFirst } = req.body;

    // 最初の質問
    if (isFirst) {
      return res.json({
        reaction: "",
        question: "はじめまして！わたし、メモちゃんといいます🌸 あなたの大切な思い出をいっしょに残しましょうね。まず最初に、子どもの頃のことを聞かせてください。子どもの頃、一番楽しかった遊びや思い出は何ですか？",
        category: "子ども時代",
        isDeepDive: false,
      });
    }

    // 会話履歴を構築
    let conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(messages || []),
      { role: 'user', content: userAnswer },
    ];

    // Anthropic APIは先頭がuser必須 → assistantで始まる場合は補正
    if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
      conversationMessages = [
        { role: 'user', content: 'インタビューを始めてください' },
        ...conversationMessages,
      ];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationMessages,
      ],
    });
    const text = response.choices[0].message.content || '';

    // JSONパース
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (error) {
    console.error('AI Interview error:', error);
    res.status(500).json({ error: 'AIとの通信に失敗しました' });
  }
});

export default router;
