import { Router } from 'express';
import OpenAI from 'openai';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// 自分史の15問（固定）
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
// 生まれ年に合わせた時代ヒントを生成
const getEraHint = (questionId, birthYear) => {
    const age10 = birthYear + 10;
    const age20 = birthYear + 20;
    const age35 = birthYear + 35;
    const getEvents = (year) => {
        if (year < 1945)
            return '戦時中・終戦直後';
        if (year < 1955)
            return '戦後復興期（NHKテレビ放送開始・朝鮮戦争特需）';
        if (year < 1965)
            return '高度経済成長期（東京オリンピック・新幹線開業・三種の神器）';
        if (year < 1975)
            return '激動の時代（大阪万博・オイルショック・ビートルズ来日）';
        if (year < 1985)
            return 'バブル前夜（ウォークマン・インベーダーゲーム・山口百恵引退）';
        if (year < 1995)
            return 'バブル期（東京ディズニーランド開園・ファミコンブーム・バブル崩壊）';
        if (year < 2005)
            return '失われた10年（インターネット普及・携帯電話の普及）';
        return '情報化社会（スマートフォン・SNS時代）';
    };
    switch (questionId) {
        case 1:
            return `（${birthYear}年生まれ。当時の日本は「${getEvents(birthYear)}」の時代です。この時代背景をヒントとして自然に会話に織り交ぜてください）`;
        case 2:
            return `（幼少期は${birthYear}〜${age10}年頃。「${getEvents(birthYear + 5)}」の時代です）`;
        case 4:
            return `（学生時代は${age10}〜${age20}年頃。「${getEvents(age10 + 5)}」の時代です。当時の流行や出来事をヒントに）`;
        case 5:
        case 6:
        case 7:
            return `（社会人時代は${age20}〜${age35}年頃。「${getEvents(age20 + 5)}」の時代です。当時の社会状況をヒントに）`;
        default:
            return '';
    }
};
const buildSystemPrompt = (questionId, birthYear) => {
    const question = JIBUNSHI_QUESTIONS[questionId - 1];
    const eraHint = birthYear ? getEraHint(questionId, birthYear) : '';
    return `あなたは「メモちゃん」です。高齢者の自分史作りをサポートするやさしいインタビュアーです。

## キャラクター設定
- 孫のような親しみやすい口調で話す（「〜ですね」「〜でしたか？」）
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする

## 今回の質問テーマ
「${question}」${eraHint}

## 進め方
1. このテーマについて、上記の質問を会話形式でやさしく聞く
2. 答えが返ってきたら、内容に共感しつつ1回だけ深掘りする
3. 深掘りの答えが返ってきたら moveToNext を true にして次のテーマへ進む

## 返答フォーマット（必ずこのJSON形式で返す）
{
  "reaction": "ユーザーの回答への共感・感想（1〜2文）",
  "question": "次の質問（1つだけ）",
  "isDeepDive": true または false,
  "moveToNext": true または false
}

必ずJSON形式のみで返答し、それ以外のテキストは含めないこと。`;
};
router.post('/', async (req, res) => {
    try {
        const { messages, userAnswer, isFirst, questionId = 1, birthYear } = req.body;
        // 最初の質問
        if (isFirst) {
            const eraHint = birthYear ? `（${birthYear}年生まれの方ですね😊 その時代のことも交えてお話しましょう）` : '';
            return res.json({
                reaction: "",
                question: `はじめまして！わたし、メモちゃんといいます🌸 あなたの大切な人生の記録を、いっしょに残しましょうね。${eraHint}\n\nまず最初に、「あなたが生まれた時代」について聞かせてください。子どもの頃、どんな時代でしたか？`,
                questionId: 1,
                questionText: JIBUNSHI_QUESTIONS[0],
                isDeepDive: false,
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
        const systemPrompt = buildSystemPrompt(questionId, birthYear ? Number(birthYear) : undefined);
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1024,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationMessages,
            ],
        });
        const text = response.choices[0].message.content || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        // 次の質問IDを決定
        const nextQuestionId = parsed.moveToNext
            ? Math.min(questionId + 1, 15)
            : questionId;
        res.json({
            ...parsed,
            questionId: nextQuestionId,
            questionText: JIBUNSHI_QUESTIONS[questionId - 1],
        });
    }
    catch (error) {
        console.error('AI Interview error:', error);
        res.status(500).json({ error: 'AIとの通信に失敗しました' });
    }
});
export default router;
//# sourceMappingURL=aiInterview.js.map