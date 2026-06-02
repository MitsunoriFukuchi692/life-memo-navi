import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { interviewApi, timelineApi, photoApi, pdfApi } from '../api';
import MemoChanAvatar, { AvatarStyle } from '../components/MemoChanAvatar';

const fieldLabels: Record<string, string> = {
  jibunshi: 'Life Story',
  kaishashi: 'Company History',
  shukatsu: 'Legacy Notes',
  other: 'Notes',
  diary: 'Journal',
  salesreport: 'Sales Reports',
};

const fieldDescriptions: Record<string, string> = {
  jibunshi: 'Build a thoughtful record of a persons life, one answer at a time.',
  kaishashi: 'Capture the companys journey, turning points, people, and values.',
  shukatsu: '大切なことを整理して、未来に伝えましょう。',
  other: '日記・メモ帳として自由に記録したり、営業日報を管理できます。',
  diary: '日々のTimelineやアイデアを自由に書き留めましょう。',
  salesreport: '訪問先・商談内容・次回アクションを記録・管理できます。',
};

export default function DashboardPage() {
  const { fieldType = 'jibunshi' } = useParams<{ fieldType: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ interviews: 0, timelines: 0, photos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [iv, tl, ph] = await Promise.all([
          interviewApi.getAll(user.id, fieldType),
          timelineApi.getAll(user.id, fieldType),
          photoApi.getAll(user.id, fieldType),
        ]);
        setStats({
          interviews: iv.data.length,
          timelines: tl.data.length,
          photos: ph.data.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.id]);

  const completionPercent = Math.round((stats.interviews / 15) * 100);
  const fieldLabel = fieldLabels[fieldType] || fieldType;
  const fieldDesc = fieldDescriptions[fieldType] || '';

  // 「その他（旧）」のとき専用カード構成
  const otherCards = [
    {
      to: `/field/${fieldType}/interview`,
      emoji: '📓',
      title: '日記・メモ帳',
      desc: '日々のTimelineやアイデアを自由に書き留めましょう',
      stat: `${stats.interviews} 件のメモ`,
      color: '#A07850',
    },
    {
      to: `/field/${fieldType}/sales-report`,
      emoji: '📊',
      title: '営業日報',
      desc: '訪問先・商談内容・次回アクションを記録・管理できます',
      stat: '日報を開く',
      color: '#2c7bb6',
    },
    {
      to: `/field/${fieldType}/timeline`,
      emoji: '📅',
      title: 'Timeline',
      desc: 'Organize important events in chronological order',
      stat: `${stats.timelines} events`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: 'Photos',
      desc: '大切なPhotosをデジタルで保管しましょう',
      stat: `${stats.photos} 枚のPhotos`,
      color: '#7B8FBB',
    },
  ];

  // 「日記・メモ帳」専用カード構成
  const diaryCards = [
    {
      to: `/field/${fieldType}/interview`,
      emoji: '📓',
      title: '日記・メモ帳',
      desc: '日々のTimelineやアイデアを自由に書き留めましょう',
      stat: `${stats.interviews} 件のメモ`,
      color: '#A07850',
    },
    {
      to: `/field/${fieldType}/timeline`,
      emoji: '📅',
      title: 'Timeline',
      desc: 'Organize important events in chronological order',
      stat: `${stats.timelines} events`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: 'Photos',
      desc: '大切なPhotosをデジタルで保管しましょう',
      stat: `${stats.photos} 枚のPhotos`,
      color: '#7B8FBB',
    },
  ];

  // 「営業報告」専用カード構成
  const salesreportCards = [
    {
      to: `/field/${fieldType}/sales-report`,
      emoji: '📊',
      title: '営業日報',
      desc: '訪問先・商談内容・次回アクションを記録・管理できます',
      stat: '日報を開く',
      color: '#2c7bb6',
    },
    {
      to: `/field/${fieldType}/timeline`,
      emoji: '📅',
      title: 'Timeline',
      desc: 'Organize important events in chronological order',
      stat: `${stats.timelines} events`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: 'Photos',
      desc: '大切なPhotosをデジタルで保管しましょう',
      stat: `${stats.photos} 枚のPhotos`,
      color: '#7B8FBB',
    },
  ];

  const cards = fieldType === 'other' ? otherCards
    : fieldType === 'diary' ? diaryCards
    : fieldType === 'salesreport' ? salesreportCards
    : [
    {
      to: `/field/${fieldType}/interview`,
      emoji: '💬',
      title: 'Interview',
      desc: 'Answer 15 guided questions to shape the story',
      stat: `${stats.interviews} / 15 complete`,
      color: '#E8956D',
    },
    {
      to: `/field/${fieldType}/timeline`,
      emoji: '📅',
      title: 'Timeline',
      desc: 'Organize important events in chronological order',
      stat: `${stats.timelines} events`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: 'Photos',
      desc: '大切なPhotosをデジタルで保管しましょう',
      stat: `${stats.photos} 枚のPhotos`,
      color: '#7B8FBB',
    },
  ];

  return (
    <Layout>
      {/* 挨拶 */}
      <div className="fade-in" style={{
        background: 'linear-gradient(135deg, var(--brown-dark), var(--brown))',
        borderRadius: 'var(--radius)',
        padding: '40px 48px',
        color: 'var(--cream)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          fontSize: '8rem', opacity: 0.08, lineHeight: 1,
        }}>🌸</div>
        <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '8px' }}>
          {fieldLabel}
        </p>
        <h2 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '2rem', color: 'var(--cream)',
          marginBottom: '16px',
        }}>
          {user.name}s {fieldLabel}
        </h2>
        <p style={{ opacity: 0.85, fontSize: '1rem', lineHeight: 1.8 }}>
          {fieldDesc}<br />
          When finished, you can save and print it as a PDF.
        </p>

        {/* 進捗バー（その他・日記・営業報告フィールドでは非表示） */}
        {fieldType !== 'other' && fieldType !== 'diary' && fieldType !== 'salesreport' && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Interview progress</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{completionPercent}%</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              height: '10px',
            }}>
              <div style={{
                background: 'var(--cream)',
                borderRadius: '20px',
                height: '100%',
                width: `${completionPercent}%`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* カード */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        {cards.map(card => (
          <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
            <div className="fade-in" style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--cream-dark)',
              transition: 'all 0.25s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{card.emoji}</div>
              <h3 style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: '1.3rem',
                color: 'var(--brown-dark)',
                marginBottom: '10px',
              }}>
                {card.title}
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
                {card.desc}
              </p>
              <div style={{
                display: 'inline-block',
                background: `${card.color}20`,
                color: card.color,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                {loading ? '...' : card.stat}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== Talk with Memo-chan（自分史・終活ノートのみ表示） ===== */}
      {(fieldType === 'jibunshi' || fieldType === 'kaishashi') && <div
        className="fade-in"
        onClick={() => navigate(`/voice-chat?fieldType=${fieldType}`)}
        style={{
          background: 'linear-gradient(135deg, #fff8f0, #fdeede)',
          borderRadius: 'var(--radius)',
          padding: '32px',
          boxShadow: 'var(--shadow)',
          border: '2px solid #f0c070',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '24px',
          cursor: 'pointer',
          transition: 'all 0.25s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <MemoChanAvatar size={64} mood="normal" avatarStyle={(localStorage.getItem('memochan_avatar') as AvatarStyle) || 'manga'} />
          <div>
            <h3 style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: '1.3rem',
              color: '#a06020',
              marginBottom: '8px',
            }}>
              Talk with Memo-chan
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              A voice-guided interview mode with gentle prompts and memory cues.
            </p>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #c9773a, #e8956d)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 500,
          fontSize: '1rem',
          whiteSpace: 'nowrap',
        }}>
          🎤 Start talking →
        </div>
      </div>}
      {/* PDF output */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--cream-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.2rem', marginBottom: '8px' }}>
            📄 Save as PDF
          </h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Generate a PDF that combines the interview answers and timeline events.
          </p>
        </div>
        <a
          href={pdfApi.generateUrl(user.id, fieldType)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: 'var(--accent)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '1rem',
          }}
        >
          📄 Download PDF
        </a>
      </div>

    </Layout>
  );
}
