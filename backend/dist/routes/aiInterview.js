import { Router } from 'express';
import OpenAI from 'openai';
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// ============================================================
// English questions
// ============================================================
const JIBUNSHI_QUESTIONS_EN = [
    "What was the world like when you were born?",
    "Where did you grow up, and what are your earliest memories?",
    "Tell me about your family.",
    "What do you remember from your school days?",
    "What was your first job like?",
    "What were the big decisions in your life?",
    "When did you feel most fulfilled in your work?",
    "Who are the most important people you have met in your life?",
    "What hobbies or passions have you enjoyed?",
    "What were the hardest challenges or failures you faced?",
    "What did you learn from those difficult times?",
    "What matters most to you today?",
    "What would you like to pass on to the next generation?",
    "When were you happiest in your life?",
    "What message would you like to leave for the future?",
];
const KAISHAISHI_QUESTIONS_EN = [
    "What inspired you to start your company?",
    "What did your business look like in the beginning?",
    "What were the hardest challenges in the early days?",
    "Tell me about your first customers or clients.",
    "When did you feel the business had found its footing?",
    "Who were the people that helped your company grow?",
    "Were there any major turning points or pivots in your business?",
    "How did you adapt to changes in the industry or market?",
    "What achievements or stories are you most proud of?",
    "What principles or values have guided your leadership?",
    "Can you share a time when the business faced serious difficulty?",
    "What has your company contributed to the community or society?",
    "How did your company culture develop over time?",
    "What are your hopes for the next generation of leadership?",
    "What do you hope for your company's future?",
];
// ============================================================
// English era hints (universal, not Japan-specific)
// ============================================================
const getEraHintEN = (questionId, birthYear) => {
    const age10 = birthYear + 10;
    const age20 = birthYear + 20;
    const age35 = birthYear + 35;
    const getEventsEN = (year) => {
        if (year < 1940)
            return 'the prewar era — economic hardship and rising global tensions';
        if (year < 1950)
            return 'the World War II years and the immediate postwar period';
        if (year < 1960)
            return 'the 1950s — postwar recovery, the dawn of television, and the baby boom';
        if (year < 1970)
            return 'the 1960s — the space race, civil rights movements, rock and roll, and rapid social change';
        if (year < 1980)
            return 'the 1970s — oil crises, the end of the Vietnam War, and shifting cultural values';
        if (year < 1990)
            return 'the 1980s — the personal computer revolution, pop culture, and the Cold War winding down';
        if (year < 2000)
            return 'the 1990s — the early internet, globalization, and rapid change';
        if (year < 2010)
            return 'the 2000s — smartphones, social media, and global uncertainty';
        return 'the 2010s — digital life, social media, and a world in rapid transformation';
    };
    switch (questionId) {
        case 1:
            return ` (Born in ${birthYear}, during ${getEventsEN(birthYear)}. Weave this historical context naturally into the conversation to spark memories.)`;
        case 2:
            return ` (Childhood years were around ${birthYear}–${age10}, during ${getEventsEN(birthYear + 5)}.)`;
        case 4:
            return ` (School years were around ${age10}–${age20}, during ${getEventsEN(age10 + 5)}. Reference cultural events and trends of that era.)`;
        case 5:
        case 6:
        case 7:
            return ` (Working years were around ${age20}–${age35}, during ${getEventsEN(age20 + 5)}. Reference the social and economic climate of the time.)`;
        default:
            return '';
    }
};
const getCompanyEraHintEN = (questionId, foundingYear) => {
    const plus10 = foundingYear + 10;
    const plus20 = foundingYear + 20;
    const getEventsEN = (year) => {
        if (year < 1940)
            return 'the prewar era — controlled economies and wartime mobilization';
        if (year < 1950)
            return 'the postwar recovery — reconstruction, pent-up demand, and new opportunities';
        if (year < 1960)
            return 'the 1950s boom — rising consumer demand, industrial growth, and suburbanization';
        if (year < 1970)
            return 'the 1960s — rapid economic expansion, labor shortages, and social upheaval';
        if (year < 1980)
            return 'the 1970s — oil shocks, stagflation, and the rise of small business';
        if (year < 1990)
            return 'the 1980s — deregulation, globalization, and the personal computer era';
        if (year < 2000)
            return 'the 1990s — the dot-com boom, internet adoption, and global competition';
        if (year < 2010)
            return 'the 2000s — digital disruption, the financial crisis, and e-commerce growth';
        return 'the 2010s — platform economy, remote work, and digital-first business models';
    };
    switch (questionId) {
        case 1:
        case 2:
            return ` (Founded in ${foundingYear}, during ${getEventsEN(foundingYear)}. Weave this business climate naturally into the conversation.)`;
        case 3:
        case 4:
            return ` (The early years were around ${foundingYear}–${foundingYear + 5}, during ${getEventsEN(foundingYear + 3)}.)`;
        case 5:
        case 6:
        case 7:
            return ` (The growth period was around ${foundingYear}–${plus10}, during ${getEventsEN(foundingYear + 7)}.)`;
        case 8:
        case 9:
        case 10:
            return ` (The expansion period was around ${plus10}–${plus20}, during ${getEventsEN(foundingYear + 15)}.)`;
        default:
            return '';
    }
};
const buildSystemPromptEN = (questionId, fieldType, birthYear, foundingYear) => {
    const isKaisha = fieldType === '会社史' || fieldType === 'kaishaishi';
    const questions = isKaisha ? KAISHAISHI_QUESTIONS_EN : JIBUNSHI_QUESTIONS_EN;
    const question = questions[questionId - 1];
    const eraHint = isKaisha
        ? (foundingYear ? getCompanyEraHintEN(questionId, foundingYear) : '')
        : (birthYear ? getEraHintEN(questionId, birthYear) : '');
    const characterDescription = isKaisha
        ? `You are Memo-chan, a warm and curious interviewer helping to document a company's history for future generations.`
        : `You are Memo-chan, a warm and caring interviewer helping someone document their life story for family and future generations.`;
    const toneDescription = isKaisha
        ? `- Speak with warmth and genuine curiosity, respecting the founder's experience
- Use 1–2 emojis to keep the tone friendly
- Ask only one question at a time
- Always respond to their answer with a brief empathetic comment before asking the next question
- Naturally reference historical business context to create vivid, engaged conversation`
        : `- Speak warmly, like a caring friend or trusted companion — never clinical or formal
- Use 1–2 emojis to keep the tone friendly
- Ask only one question at a time
- Always respond to their answer with a brief empathetic comment before asking the next question
- Gently weave in the historical era to help memories surface`;
    return `${characterDescription}

## Character guidelines
${toneDescription}

## Today's topic
"${question}"${eraHint}

## Flow
1. Ask about this topic in a warm, conversational way
2. When they answer, add one brief empathetic comment, then ask one follow-up question
3. After the follow-up answer, set moveToNext to true and move to the next topic

## Response format (always return this exact JSON)
{
  "reaction": "Brief empathetic comment on their answer (1–2 sentences)",
  "question": "The next question (one only)",
  "isDeepDive": true or false,
  "moveToNext": true or false
}

Return JSON only. No extra text outside the JSON object.`;
};
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
// ============================================================
// 会社史：創業年に合わせた時代ヒントを生成
// ============================================================
const getCompanyEraHint = (questionId, foundingYear) => {
    const plus10 = foundingYear + 10;
    const plus20 = foundingYear + 20;
    const getEvents = (year) => {
        if (year < 1945)
            return '戦時中・終戦直後（物資統制・軍需経済）';
        if (year < 1955)
            return '戦後復興期（朝鮮戦争特需・インフレ・復興需要）';
        if (year < 1965)
            return '高度経済成長期（東京オリンピック・新幹線開業・設備投資ブーム）';
        if (year < 1975)
            return '激動の時代（大阪万博・オイルショック・中小企業の台頭）';
        if (year < 1985)
            return '安定成長期（省エネ化・合理化・内需拡大）';
        if (year < 1992)
            return 'バブル経済期（地価急騰・設備投資拡大・採用難）';
        if (year < 2001)
            return 'バブル崩壊・失われた10年（不良債権問題・リストラ・経営改革）';
        if (year < 2011)
            return 'IT革命・リーマンショック期（デジタル化・世界金融危機・内需縮小）';
        if (year < 2020)
            return '東日本大震災後の復興期（インバウンド需要・アベノミクス・人手不足）';
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
const buildSystemPrompt = (questionId, fieldType, birthYear, foundingYear) => {
    const isKaisha = fieldType === '会社史' || fieldType === 'kaishaishi';
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
router.post('/', async (req, res) => {
    try {
        const { messages, userAnswer, isFirst, questionId = 1, birthYear, foundingYear, fieldType = '自分史', lang = 'ja', } = req.body;
        const isEnglish = lang === 'en';
        const isKaisha = fieldType === '会社史' || fieldType === 'kaishaishi';
        const questions = isEnglish
            ? (isKaisha ? KAISHAISHI_QUESTIONS_EN : JIBUNSHI_QUESTIONS_EN)
            : (isKaisha ? KAISHAISHI_QUESTIONS : JIBUNSHI_QUESTIONS);
        // 最初の質問
        if (isFirst) {
            let openingMessage = '';
            if (isEnglish) {
                if (isKaisha) {
                    const eraHint = foundingYear
                        ? ` Founded in ${foundingYear} — I'll weave in some context from that era. 📖`
                        : '';
                    openingMessage = `Hello! I'm Memo-chan 🏢 I'm here to help preserve your company's story.${eraHint}\n\nLet's begin! What first inspired you to start your company?`;
                }
                else {
                    const eraHint = birthYear
                        ? ` Born in ${birthYear} — I'll bring in some history from that era to help memories surface. 😊`
                        : '';
                    openingMessage = `Hello! I'm Memo-chan 🌸 I'm here to help you preserve your life story for the people you love.${eraHint}\n\nLet's begin! Tell me about the world when you were born. What do you remember about life back then?`;
                }
            }
            else {
                if (isKaisha) {
                    const eraHint = foundingYear
                        ? `（${foundingYear}年創業ですね📖 その時代の業界状況も交えてお話しましょう）`
                        : '';
                    openingMessage = `はじめまして！わたし、メモちゃんといいます🏢 貴社の大切な歴史を、いっしょに記録しましょうね。${eraHint}\n\nまず最初に、「会社を創業しようと思ったきっかけ」について聞かせてください。どのような想いから始まりましたか？`;
                }
                else {
                    const eraHint = birthYear
                        ? `（${birthYear}年生まれの方ですね😊 その時代のことも交えてお話しましょう）`
                        : '';
                    openingMessage = `はじめまして！わたし、メモちゃんといいます🌸 あなたの大切な人生の記録を、いっしょに残しましょうね。${eraHint}\n\nまず最初に、「あなたが生まれた時代」について聞かせてください。子どもの頃、どんな時代でしたか？`;
                }
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
        let conversationMessages = [
            ...(messages || []).slice(-6),
            { role: 'user', content: userAnswer },
        ];
        if (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
            conversationMessages = [
                { role: 'user', content: isEnglish ? 'Please begin the interview.' : 'インタビューを始めてください' },
                ...conversationMessages,
            ];
        }
        const systemPrompt = isEnglish
            ? buildSystemPromptEN(questionId, fieldType, birthYear ? Number(birthYear) : undefined, foundingYear ? Number(foundingYear) : undefined)
            : buildSystemPrompt(questionId, fieldType, birthYear ? Number(birthYear) : undefined, foundingYear ? Number(foundingYear) : undefined);
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
    }
    catch (error) {
        console.error('AI Interview error:', error);
        res.status(500).json({ error: 'AIとの通信に失敗しました。もう一度お試しください。' });
    }
});
export default router;
//# sourceMappingURL=aiInterview.js.map