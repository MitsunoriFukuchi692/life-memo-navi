import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { interviewApi, Interview } from '../api';
import api from '../api';

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
  "家族や後の世代に伝えたいことは？",
  "人生で一番幸せだった時は？",
  "未来へのメッセージは？",
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
  "未来の会社に望むことは？",
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
  "最期まで大切にしたい生き方は？",
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
  "自分を一言で表すと？",
];

const getQuestions = (fieldType: string): string[] => {
  switch (fieldType) {
    case 'kaishashi': return KAISHASHI_QUESTIONS;
    case 'shukatsu': return SHUKATSU_QUESTIONS;
    case 'other': return OTHER_QUESTIONS;
    default: return JIBUNSHI_QUESTIONS;
  }
};

// Web Speech API の型定義
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function InterviewPage() {
  const { fieldType = 'jibunshi' } = useParams<{ fieldType: string }>();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const QUESTIONS = getQuestions(fieldType);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [saved, setSaved] = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditingAll, setAiEditingAll] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  // 音声入力
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API の初期化
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;        // 話し続けても認識
      recognition.interimResults = false;   // 確定した結果のみ取得

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setAnswers(prev => ({
          ...prev,
          [current + 1]: (prev[current + 1] || '') + transcript,
        }));
        setSaved(prev => ({ ...prev, [current + 1]: false }));
      };

      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // 質問が変わったら音声入力を停止
  useEffect(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [current]);

  // ボタンを押している間だけ録音
  const handleVoiceStart = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleVoiceStop = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  // fieldTypeが変わったら回答をリセットして再取得
  useEffect(() => {
    setAnswers({});
    setSaved({});
    setCurrent(0);
    interviewApi.getAll(user.id, fieldType).then(res => {
      const map: { [key: number]: string } = {};
      const savedMap: { [key: number]: boolean } = {};
      res.data.forEach(iv => {
        map[iv.question_id] = iv.answer_text;
        savedMap[iv.question_id] = true;
      });
      setAnswers(map);
      setSaved(savedMap);
      setInterviews(res.data);
    }).catch(console.error);
  }, [user.id, fieldType]);

  const handleSave = async () => {
    const answerText = answers[current + 1];
    if (!answerText?.trim()) return;
    setSaving(true);
    try {
      await interviewApi.save({
        user_id: user.id,
        question_id: current + 1,
        answer_text: answerText,
        field_type: fieldType,
      });
      setSaved(prev => ({ ...prev, [current + 1]: true }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAiEdit = async () => {
    const answerText = answers[current + 1];
    if (!answerText?.trim()) return;
    setAiEditing(true);
    try {
      const res = await api.post('/interviews/ai-edit', {
        question_text: QUESTIONS[current],
        answer_text: answerText,
      });
      setAnswers(prev => ({ ...prev, [current + 1]: res.data.edited_text }));
      setSaved(prev => ({ ...prev, [current + 1]: false }));
    } catch (e) {
      console.error(e);
      alert('AI編集に失敗しました。もう一度お試しください。');
    } finally {
      setAiEditing(false);
    }
  };

  const handleAiEditAll = async () => {
    const answersToEdit = Object.entries(answers)
      .filter(([_, text]) => text?.trim())
      .map(([qId, text]) => ({
        question_id: Number(qId),
        question_text: QUESTIONS[Number(qId) - 1],
        answer_text: text,
      }));

    if (answersToEdit.length === 0) {
      alert('回答がありません。先に回答を入力してください。');
      return;
    }

    if (!confirm(`${answersToEdit.length}問の回答をまとめてAI編集します。よろしいですか？`)) return;

    setAiEditingAll(true);
    try {
      const res = await api.post('/interviews/ai-edit-all', { answers: answersToEdit });
      const newAnswers = { ...answers };
      res.data.results.forEach((r: { question_id: number; edited_text: string }) => {
        newAnswers[r.question_id] = r.edited_text;
      });
      setAnswers(newAnswers);
      const newSaved = { ...saved };
      answersToEdit.forEach(a => { newSaved[a.question_id] = false; });
      setSaved(newSaved);
      alert(`${answersToEdit.length}問のAI編集が完了しました！内容を確認して保存してください。`);
    } catch (e) {
      console.error(e);
      alert('AI編集に失敗しました。もう一度お試しください。');
    } finally {
      setAiEditingAll(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    if (current < 14) setCurrent(current + 1);
  };

  const completedCount = Object.values(saved).filter(Boolean).length;
  const answeredCount = Object.values(answers).filter(t => t?.trim()).length;
  const progress = (completedCount / 15) * 100;

  return (
    <Layout title="💬 聞き取り">
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{completedCount} / 15 問完了</span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'var(--cream-dark)', borderRadius: '20px', height: '8px' }}>
          <div style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-light))', borderRadius: '20px', height: '100%', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
          {QUESTIONS.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: current === i ? '2px solid var(--accent)' : '2px solid var(--cream-dark)',
              background: saved[i + 1] ? 'var(--accent)' : (current === i ? 'var(--cream-dark)' : 'var(--white)'),
              color: saved[i + 1] ? 'white' : (current === i ? 'var(--brown-dark)' : 'var(--text-light)'),
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>{i + 1}</button>
          ))}
        </div>

        {answeredCount > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={handleAiEditAll} disabled={aiEditingAll} style={{
              padding: '12px 32px',
              background: aiEditingAll ? '#ccc' : 'linear-gradient(135deg, #5B3A8A, #7B5EA7)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: 'white',
              fontSize: '1rem', fontWeight: 600, cursor: aiEditingAll ? 'not-allowed' : 'pointer',
              fontFamily: "'Noto Sans JP', sans-serif",
              boxShadow: aiEditingAll ? 'none' : '0 4px 12px rgba(91,58,138,0.3)',
            }}>
              {aiEditingAll ? '✨ AI編集中...' : `✨ 全${answeredCount}問まとめてAI編集`}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>
              ※ 回答済みの全問を一括で自然な文章に整えます
            </p>
          </div>
        )}
      </div>

      <div className="fade-in" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '40px', boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ background: 'var(--brown-dark)', color: 'var(--cream)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            質問 {current + 1} / 15
          </span>
          {saved[current + 1] && (
            <span style={{ background: '#E8F5E9', color: '#388E3C', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginLeft: '8px' }}>
              ✓ 保存済み
            </span>
          )}
        </div>

        <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', color: 'var(--brown-dark)', margin: '20px 0 24px', lineHeight: 1.6 }}>
          {QUESTIONS[current]}
        </h3>

        <textarea
          value={answers[current + 1] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current + 1]: e.target.value }))}
          placeholder="ここに自由に書いてください。思い出した順番でも、箇条書きでも大丈夫です。"
          style={{ width: '100%', minHeight: '200px', padding: '20px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text)', background: 'var(--cream)', resize: 'vertical', outline: 'none', fontFamily: "'Noto Sans JP', sans-serif" }}
          onFocus={e => e.target.style.borderColor = 'var(--brown-light)'}
          onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
        />

        {/* 音声入力ボタン */}
        {voiceSupported && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onMouseDown={handleVoiceStart}
              onMouseUp={handleVoiceStop}
              onTouchStart={handleVoiceStart}
              onTouchEnd={handleVoiceStop}
              style={{
                padding: '16px 40px',
                background: isListening
                  ? 'linear-gradient(135deg, #e53935, #ef5350)'
                  : 'linear-gradient(135deg, #1976D2, #42A5F5)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Noto Sans JP', sans-serif",
                boxShadow: isListening
                  ? '0 0 0 6px rgba(229,57,53,0.3)'
                  : '0 4px 12px rgba(25,118,210,0.4)',
                transition: 'all 0.2s',
                userSelect: 'none',
              }}
            >
              {isListening ? '🔴 話してください...' : '🎤 押している間だけ録音'}
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px' }}>
              {isListening
                ? '※ ボタンを離すと録音が終わります'
                : '※ ボタンを押している間、話した内容が自動でテキストになります'}
            </p>
          </div>
        )}

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button onClick={handleAiEdit} disabled={aiEditing || !answers[current + 1]?.trim()} style={{
            padding: '10px 20px',
            background: aiEditing ? '#ccc' : 'linear-gradient(135deg, #7B5EA7, #9B7EC8)',
            border: 'none', borderRadius: 'var(--radius-sm)', color: 'white',
            fontSize: '0.9rem', fontWeight: 500, cursor: aiEditing ? 'not-allowed' : 'pointer',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>
            {aiEditing ? '✨ AI編集中...' : '✨ この回答をAIで整える'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
            ※ 内容はそのままに、読みやすい文章に整えます
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={secondaryButtonStyle}>← 前の質問</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving || !answers[current + 1]?.trim()} style={saveButtonStyle}>
              {saving ? '保存中...' : '保存'}
            </button>
            {current < 14 ? (
              <button onClick={handleSaveAndNext} disabled={saving} style={primaryButtonStyle}>保存して次へ →</button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>✓ 完了</button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const secondaryButtonStyle: React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
const saveButtonStyle: React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: '2px solid var(--brown)', borderRadius: 'var(--radius-sm)', color: 'var(--brown)', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
const primaryButtonStyle: React.CSSProperties = { padding: '12px 28px', background: 'var(--brown-dark)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--cream)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
