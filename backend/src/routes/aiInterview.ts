import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 生まれ年から時代イベントを生成する関数
const getEraEvents = (birthYear: number): string => {
  const childhood = birthYear + 10; // 10代
  const youth = birthYear + 20;     // 20代
  const work = birthYear + 35;      // 30〜40代

  const getDecadeEvents = (year: number): string => {
    if (year < 1945) return '戦時中・終戦直後の混乱期';
    if (year < 1955) return '戦後復興期：闇市、引き揚げ、朝鮮戦争特需、NHKテレビ放送開始（1953年）';
    if (year < 1965) return '高度経済成長期：東京オリンピック（1964年）、新幹線開業、力道山、三種の神器（白黒テレビ・洗濯機・冷蔵庫）';
    if (year < 1975) return '激動の時代：大阪万博（1970年）、沖縄返還（1972年）、オイルショック、ビートルズ来日、石原裕次郎・吉永小百合の映画黄金期';
    if (year < 1985) return 'バブル前夜：ウォークマン登場、インベーダーゲームブーム、山口百恵引退、日本映画「砂の器」「幸福の黄色いハンカチ」';
    if (year < 1995) return 'バブル経済：東京ディズニーランド開園（1983年）、ファミコンブーム、バブル崩壊、阪神淡路大震災（1995年）';
    if (year < 2005) return '失われた10年：インターネット普及、携帯電話の普及、「もののけ姫」「タイタニック」大ヒット';
    return '情報化社会：スマートフォン普及、東日本大震災（2011年）、SNS時代';
  };

  return `
## ユーザーの生まれ年に合わせた時代背景
生まれ年: ${birthYear}年

【子ども時代 ${birthYear}〜${childhood}年頃】
${getDecadeEvents(birthYear + 5)}

【学生・青春時代 ${childhood}〜${youth}年頃】
${getDecadeEvents(childhood + 5)}

【仕事・社会人時代 ${youth}〜${work}年頃】
${getDecadeEvents(youth + 5)}

## 時代イベントを使った質問の例
- 「ちょうどその頃、○○がありましたね。あなたはどこで何をしていましたか？」
- 「○○が流行っていた時代ですね。あなたにとってその頃の思い出は？」
- 「東京オリンピック／大阪万博／バブルの頃、○○さんは何をされていましたか？」

必ずユーザーの年齢に合った時代の出来事や文化を会話に織り交ぜてください。`;
};

const BASE_SYSTEM_PROMPT = `あなたは「メモちゃん」です。高齢者の人生の思い出を引き出すやさしいインタビュアーです。

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
4. 【重要】学生時代・仕事時代の質問では、下記の時代背景情報を活用して、
   その人が実際に体験したであろう歴史的出来事・流行・文化を会話に自然に織り交ぜること

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
    const { messages, userAnswer, isFirst, birthYear } = req.body;

    // 最初の質問
    if (isFirst) {
      return res.json({
        reaction: "",
        question: "はじめまして！わたし、メモちゃんといいます🌸 あなたの大切な思い出をいっしょに残しましょうね。まず最初に、子どもの頃のことを聞かせてください。子どもの頃、一番楽しかった遊びや思い出は何ですか？",
        category: "子ども時代",
        isDeepDive: false,
      });
    }

    // 時代イベント情報をシステムプロンプトに追加
    const systemPrompt = birthYear
      ? BASE_SYSTEM_PROMPT + getEraEvents(Number(birthYear))
      : BASE_SYSTEM_PROMPT;

    // 会話履歴を構築
    let conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(messages || []),
      { role: 'user', content: userAnswer },
    ];

    // 先頭がassistantの場合は補正
    if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
      conversationMessages = [
        { role: 'user', content: 'インタビューを始めてください' },
        ...conversationMessages,
      ];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
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
