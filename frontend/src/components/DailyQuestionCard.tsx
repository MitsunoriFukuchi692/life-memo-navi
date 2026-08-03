import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyContent } from '../data/dailyQuestions';

// 起動時に表示する「今日の質問」カード。
// 「この思い出を書く」で、質問を種として日記（自由記述）の入力へ進む。
export default function DailyQuestionCard() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const content = getDailyContent(offset, Number(user.age) || undefined);

  const handleWrite = () => {
    // 日記フォームに今日の質問をタイトルとして引き渡す（InterviewPage側で拾う）
    localStorage.setItem('todayQuestion', content.question);
    navigate('/field/diary/interview');
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto 40px' }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--cream-dark)',
        boxShadow: 'var(--shadow)',
        padding: '28px 26px 22px',
      }}>
        {/* あいさつと日付 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '18px',
        }}>
          <span style={{ color: 'var(--text-light)', fontSize: '0.95rem', fontWeight: 600 }}>
            ☀️ {content.greeting}
          </span>
          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{content.dateLabel}</span>
        </div>

        {/* 今日は何の日（該当日のみ） */}
        {content.special && (
          <div style={{
            background: '#FBF1E6', borderRadius: '10px', padding: '11px 14px',
            marginBottom: '18px', fontSize: '0.95rem', lineHeight: 1.6, color: '#9a5a1f',
          }}>
            🍯 今日は {content.special}
          </div>
        )}

        {/* 今日の質問 */}
        <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', letterSpacing: '0.05em', margin: '0 0 8px' }}>
          きょうの質問
        </p>
        <p style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '1.5rem', lineHeight: 1.55, fontWeight: 600,
          color: 'var(--brown-dark)', margin: '0 0 22px',
        }}>
          {content.question}
        </p>

        {/* その頃の出来事（年齢が分かる時だけ・思い出の呼び水） */}
        {content.eraTopic && (
          <div style={{
            background: '#EEF3F7', borderRadius: '10px', padding: '11px 14px',
            margin: '0 0 22px', fontSize: '0.95rem', lineHeight: 1.6, color: '#3a5a72',
          }}>
            <span style={{ fontWeight: 600 }}>その頃の出来事：</span>{content.eraTopic}
          </div>
        )}

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleWrite}
            style={{
              flex: 1, minWidth: '200px', height: '50px', border: 'none',
              borderRadius: '10px', background: 'var(--brown-dark)', color: 'var(--white)',
              fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            ✏️ この思い出を書く
          </button>
          <button
            onClick={() => setOffset(o => o + 1)}
            style={{
              height: '50px', padding: '0 18px', background: 'var(--white)',
              border: '1.5px solid var(--brown-light)', borderRadius: '10px',
              color: 'var(--brown-dark)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            🔄 別の質問
          </button>
        </div>
      </div>

      {/* やさしい一言 */}
      <p style={{
        textAlign: 'center', color: 'var(--text-light)', fontSize: '1rem',
        lineHeight: 1.7, margin: '16px 4px 0',
      }}>
        {content.word}
      </p>
    </div>
  );
}
