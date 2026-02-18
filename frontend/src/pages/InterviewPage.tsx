import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { interviewApi, Interview } from '../api';

const QUESTIONS = [
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

export default function InterviewPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [saved, setSaved] = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    interviewApi.getAll(user.id).then(res => {
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
  }, [user.id]);

  const handleSave = async () => {
    const answerText = answers[current + 1];
    if (!answerText?.trim()) return;
    setSaving(true);
    try {
      await interviewApi.save({
        user_id: user.id,
        question_id: current + 1,
        answer_text: answerText,
      });
      setSaved(prev => ({ ...prev, [current + 1]: true }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    if (current < 14) setCurrent(current + 1);
  };

  const completedCount = Object.values(saved).filter(Boolean).length;
  const progress = (completedCount / 15) * 100;

  return (
    <Layout title="💬 インタビュー">
      {/* 進捗 */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {completedCount} / 15 問完了
          </span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'var(--cream-dark)', borderRadius: '20px', height: '8px' }}>
          <div style={{
            background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
            borderRadius: '20px', height: '100%',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>

        {/* 問題番号ナビ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
          {QUESTIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                border: current === i ? '2px solid var(--accent)' : '2px solid var(--cream-dark)',
                background: saved[i + 1] ? 'var(--accent)' : (current === i ? 'var(--cream-dark)' : 'var(--white)'),
                color: saved[i + 1] ? 'white' : (current === i ? 'var(--brown-dark)' : 'var(--text-light)'),
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 現在の質問 */}
      <div className="fade-in" style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        padding: '40px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--cream-dark)',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            background: 'var(--brown-dark)',
            color: 'var(--cream)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            質問 {current + 1} / 15
          </span>
          {saved[current + 1] && (
            <span style={{
              background: '#E8F5E9',
              color: '#388E3C',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginLeft: '8px',
            }}>
              ✓ 保存済み
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '1.4rem',
          color: 'var(--brown-dark)',
          margin: '20px 0 24px',
          lineHeight: 1.6,
        }}>
          {QUESTIONS[current]}
        </h3>

        <textarea
          value={answers[current + 1] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current + 1]: e.target.value }))}
          placeholder="ここに自由に書いてください。思い出した順番でも、箇条書きでも大丈夫です。"
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '20px',
            border: '2px solid var(--cream-dark)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--text)',
            background: 'var(--cream)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = 'var(--brown-light)'}
          onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            style={secondaryButtonStyle}
          >
            ← 前の質問
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving || !answers[current + 1]?.trim()}
              style={saveButtonStyle}
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {current < 14 ? (
              <button
                onClick={handleSaveAndNext}
                disabled={saving}
                style={primaryButtonStyle}
              >
                保存して次へ →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                style={primaryButtonStyle}
              >
                ✓ 完了
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  background: 'transparent',
  border: '2px solid var(--cream-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-light)',
  fontSize: '0.95rem',
  cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
};

const saveButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  background: 'transparent',
  border: '2px solid var(--brown)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--brown)',
  fontSize: '0.95rem',
  cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '12px 28px',
  background: 'var(--brown-dark)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--cream)',
  fontSize: '0.95rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
};
