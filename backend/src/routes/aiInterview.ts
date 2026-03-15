import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// 自分史の15問（固定）
// ============================================================
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

// ============================================================
// 会社史の15問（固定）
// ============================================================
const KAISHAISHI_QUESTIONS = [
  "会社を創業しようと思ったきっかけは何ですか？",
  "創業当時、どのような事業からスタートしましたか？",
  "創業期に最も苦労したことは何でしたか？",
  "最初のお客様や取引先との出会いを教えてください。",
  "事業が軌道に乗ったと感じたのはいつ頃ですか？",
  "会社の成長を支えてくれた社員や仲間について教えてください。",
  "経営上の大きな転機や転換点はありましたか？",
  "業界や市場の変化にどのように対応してきましたか？",
  "会社として誇りに思う実績やエピソードを教えてください。",
  "経営で大切にしてきた理念や信条は何ですか？",
  "苦境を乗り越えた経験があれば教えてください。",
  "地域や社会との関わりで印象に残っていることはありますか？",
  "会社の文化や雰囲気をどのように作ってきましたか？",
  "後継者や次世代への思いはありますか？",
  "これから会社をどのようにしていきたいですか？"
];

// ============================================================
// 自分史：生まれ年に合わせた時代ヒントを生成
// ============================================================
const getEraHint = (questionId: number, birthYear: number): string => {
  const age10 = birthYear + 10;
  const age20 = birthYear + 20;
  const age35 = birthYear + 35;

  const getEvents = (year: number): string => {
    if (year < 1945) return '戦時中・終戦直後';
    if (year < 1955) return '戦後復興期（NHKテレビ放送開始・朝鮮戦争特需）';
    if (year < 1965) return '高度経済成長期（東京オリンピック・新幹線開業・三種の神器）';
    if (year < 1975) return '激動の時代（大阪万博・オイルショック・ビートルズ来日）';
    if (year < 1985) return 'バブル前夜（ウォークマン・インベーダーゲーム・山口百恵引退）';
    if (year < 1995) return 'バブル期（東京ディズニーランド開園・ファミコンブーム・バブル崩壊）';
    if (year < 2005) return '失われた10年（インターネット普及・携帯電話の普及）';
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

// ============================================================
// 会社史：創業年に合わせた時代ヒントを生成
// ============================================================
const getCompanyEraHint = (questionId: number, foundingYear: number): string => {
  const plus10 = foundingYear + 10;
  const plus20 = foundingYear + 20;

  const getEvents = (year: number): string => {
    if (year < 1945) return '戦時中・終戦直後（物資統制・軍需経済）';
    if (year < 1955) return '戦後復興期（朝鮮戦争特需・インフレ・復興需要）';
    if (year < 1965) return '高度経済成長期（東京オリンピック・新幹線開業・設備投資ブーム）';
    if (year < 1975) return '激動の時代（大阪万博・オイルショック・中小企業の台頭）';
    if (year < 1985) return '安定成長期（省エネ化・合理化・内需拡大）';
    if (year < 1992) return 'バブル経済期（地価急騰・設備投資拡大・採用難）';
    if (year < 2001) return 'バブル崩壊・失われた10年（不良債権問題・リストラ・経営改革）';
    if (year < 2011) return 'IT革命・リーマンショック期（デジタル化・世界金融危機・内需縮小）';
    if (year < 2020) return '東日本大震災後の復興期（インバウンド需要・アベノミクス・人手不足）';
    return 'コロナ禍・DX推進の時代（テレワーク・デジタル化・物価上昇・人材確保難）';
  };

  switch (questionId) {
    case 1:
    case 2:
      return `（創業年は${foundingYear}年。当時の経済状況は「${getEvents(foundingYear)}」。この時代背景を自然に会話に織り交ぜてください）`;
    case 3:
    case 4:
      return `（創業から数年は${foundingYear}〜${foundingYear + 5}年頃。「${getEvents(foundingYear + 3)}」の時代です）`;
    case 5:
    case 6:
    case 7:
      return `（成長期は${foundingYear}〜${plus10}年頃。「${getEvents(foundingYear + 7)}」の社会状況をヒントに）`;
    case 8:
    case 9:
    case 10:
      return `（さらなる展開期は${plus10}〜${plus20}年頃。「${getEvents(foundingYear + 15)}」の業界変化をヒントに）`;
    default:
      return '';
  }
};

// ============================================================
// システムプロンプトを構築
// ============================================================
const buildSystemPrompt = (
  questionId: number,
  fieldType: string,
  birthYear?: number,
  foundingYear?: number
): string => {
  const isKaisha = fieldType === '会社史';
  const questions = isKaisha ? KAISHAISHI_QUESTIONS : JIBUNSHI_QUESTIONS;
  const question = questions[questionId - 1];

  const eraHint = isKaisha
    ? (foundingYear ? getCompanyEraHint(questionId, foundingYear) : '')
    : (birthYear ? getEraHint(questionId, birthYear) : '');

  const characterDescription = isKaisha
    ? `あなたは「メモちゃん」です。会社の歴史をまとめる専門のインタビュアーです。`
    : `あなたは「メモちゃん」です。高齢者の自分史作りをサポートするやさしいインタビュアーです。`;

  const toneDescription = isKaisha
    ? `- 経営者への敬意を持った、丁寧かつ親しみやすい口調で話す（「〜でしたか？」「〜なのですね」）
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする
- 時代背景や業界の動向にも自然に触れ、臨場感を出す`
    : `- 孫のような親しみやすい口調で話す（「〜ですね」「〜でしたか？」）
- 絵文字を1〜2個使って親しみやすくする
- 一度に1つの質問だけする
- 相手の答えに必ず共感・感想を一言添えてから次の質問をする`;

  return `${characterDescription}

## キャラクター設定
${toneDescription}

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

// ============================================================
// POSTハンドラー
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      messages,
      userAnswer,
      isFirst,
      questionId = 1,
      birthYear,
      foundingYear,
      fieldType = '自分史',  // ← 追加：デフォルトは自分史
    } = req.body;

    const isKaisha = fieldType === '会社史';
    const questions = isKaisha ? KAISHAISHI_QUESTIONS : JIBUNSHI_QUESTIONS;

    // 最初の質問
    if (isFirst) {
      let openingMessage = '';
      if (isKaisha) {
        const eraHint = foundingYear
          ? `（${foundingYear}年創業ですね📖 その時代の業界状況も交えてお話しましょう）`
          : '';
        openingMessage = `はじめまして！わたし、メモちゃんといいます🏢 貴社の大切な歴史を、いっしょに記録しましょうね。${eraHint}\n\nまず最初に、「会社を創業しようと思ったきっかけ」について聞かせてください。どのような想いから始まりましたか？`;
      } else {
        const eraHint = birthYear
          ? `（${birthYear}年生まれの方ですね😊 その時代のことも交えてお話しましょう）`
          : '';
        openingMessage = `はじめまして！わたし、メモちゃんといいます🌸 あなたの大切な人生の記録を、いっしょに残しましょうね。${eraHint}\n\nまず最初に、「あなたが生まれた時代」について聞かせてください。子どもの頃、どんな時代でしたか？`;
      }

      return res.json({
        reaction: "",
        question: openingMessage,
        questionId: 1,
        questionText: questions[0],
        isDeepDive: false,
        moveToNext: false,
      });
    }

    // 会話履歴を構築（直近6件のみ）
    let conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(messages || []).slice(-6),
      { role: 'user', content: userAnswer },
    ];

    if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
      conversationMessages = [
        { role: 'user', content: 'インタビューを始めてください' },
        ...conversationMessages,
      ];
    }

    const systemPrompt = buildSystemPrompt(
      questionId,
      fieldType,
      birthYear ? Number(birthYear) : undefined,
      foundingYear ? Number(foundingYear) : undefined
    );

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
      questionText: questions[questionId - 1],
    });
  } catch (error) {
    console.error('AI Interview error:', error);
    res.status(500).json({ error: 'AIとの通信に失敗しました' });
  }
});

export default router;
