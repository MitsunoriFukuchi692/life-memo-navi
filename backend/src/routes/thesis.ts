import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// 博士論文 章情報
// ============================================================
const CHAPTERS = [
  { name: '第１章：序論',     hint: '研究の背景・目的・意義・論文の構成' },
  { name: '第２章：先行研究', hint: '既存の老化防止医療研究のレビューと本研究の位置づけ' },
  { name: '第３章：研究方法', hint: '実験デザイン・対象・測定方法・統計解析' },
  { name: '第４章：実験・結果', hint: '実験結果の記述・図表の説明' },
  { name: '第５章：考察',     hint: '結果の解釈・先行研究との比較・限界と今後の課題' },
  { name: '第６章：結論',     hint: '研究の総括・学術的貢献・実用的示唆' },
];

// ============================================================
// システムプロンプト生成
// ============================================================
const buildThesisPrompt = (
  chapterIndex: number,
  refs: string[]
): string => {
  const ch = CHAPTERS[chapterIndex] ?? CHAPTERS[0];
  const refText = refs && refs.length > 0
    ? '\n\n【登録済み参考文献】\n' + refs.map((r, i) => `[${i + 1}] ${r}`).join('\n')
    : '';

  return `あなたは老化防止医療の博士論文執筆を専門的に支援するAIアシスタントです。
研究者との対話を通じて、学術論文として適切な文章を生成・提案します。

【現在の執筆章】
${ch.name}

【この章のポイント】
${ch.hint}

【行動指針】
1. 研究者の回答から、論文に使える学術的な文章を生成する
2. 専門用語（老化機構、テロメア、サーチュイン、mTOR経路、カロリー制限、セノリシス、NAD+など）を適切に使用する
3. 日本語の学術論文スタイルで記述する
4. 文章を生成する場合は必ず「---論文草稿---」という区切りを入れて、論文に追加できる形で提示する
5. 深掘りしたい場合は追加の質問を1〜2問提示する
6. 参考文献がある場合は適宜引用する（[著者, 年]形式）
7. 研究者が「論文に追加して」「草稿に入れて」等と言った場合は必ず「---論文草稿---」セクションを含める
${refText}

【重要】研究者の話した内容を尊重し、学術論文として昇華させてください。`;
};

// ============================================================
// POST /api/thesis/chat  ─ チャット本体
// ============================================================
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],      // 会話履歴 [{role, content}]
      userMessage = '',   // 今回のユーザー発言
      chapterIndex = 0,   // 章インデックス 0〜5
      refs = [],          // 参考文献リスト
    } = req.body;

    if (!userMessage.trim()) {
      return res.status(400).json({ error: 'メッセージが空です' });
    }

    const systemPrompt = buildThesisPrompt(Number(chapterIndex), refs);

    // 会話履歴（直近8件）＋今回のメッセージ
    const conversationMessages: ChatCompletionMessageParam[] = [
      ...(messages as { role: 'user' | 'assistant'; content: string }[])
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content } as ChatCompletionMessageParam)),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1400,
      temperature: 0.7,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...conversationMessages,
      ],
    });

    const reply = response.choices[0].message.content ?? '';

    // 論文草稿部分を自動抽出
    let draftText: string | null = null;
    const marker = reply.indexOf('---論文草稿---');
    if (marker !== -1) {
      draftText = reply.slice(marker + '---論文草稿---'.length).trim();
    }

    res.json({
      reply,
      draftText,   // null or 挿入候補テキスト
    });

  } catch (error: any) {
    console.error('Thesis chat error:', error);
    res.status(500).json({ error: 'AIとの通信に失敗しました: ' + (error.message || '') });
  }
});

// ============================================================
// POST /api/thesis/refs  ─ 参考文献を引用形式に整形
// ============================================================
router.post('/refs', async (req: Request, res: Response) => {
  try {
    const { refs = [] } = req.body;
    if (!refs.length) return res.status(400).json({ error: '参考文献が空です' });

    const refText = (refs as string[]).map((r, i) => `[${i + 1}] ${r}`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [{
        role: 'user' as const,
        content: `以下の参考文献リストを、日本語の博士論文スタイル（APA形式または著者・年形式）に整形してください：\n\n${refText}`,
      }],
    });

    res.json({ formatted: response.choices[0].message.content ?? '' });
  } catch (error: any) {
    console.error('Refs format error:', error);
    res.status(500).json({ error: '参考文献の整形に失敗しました' });
  }
});

export default router;
