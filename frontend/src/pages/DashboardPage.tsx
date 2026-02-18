import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { interviewApi, timelineApi, photoApi, pdfApi } from '../api';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    interviews: 0,
    timelines: 0,
    photos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [iv, tl, ph] = await Promise.all([
          interviewApi.getAll(user.id),
          timelineApi.getAll(user.id),
          photoApi.getAll(user.id),
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

  const cards = [
    {
      to: '/interview',
      emoji: '💬',
      title: 'インタビュー',
      desc: '15の質問に答えて、あなたの物語を綴りましょう',
      stat: `${stats.interviews} / 15 問完了`,
      color: '#E8956D',
    },
    {
      to: '/timeline',
      emoji: '📅',
      title: '人生年表',
      desc: '大切な出来事を時系列で整理しましょう',
      stat: `${stats.timelines} 件の記録`,
      color: '#6B9B6B',
    },
    {
      to: '/photos',
      emoji: '🖼',
      title: '思い出の写真',
      desc: '大切な写真をデジタルで保管しましょう',
      stat: `${stats.photos} 枚の写真`,
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
        <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '8px' }}>こんにちは</p>
        <h2 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '2rem', color: 'var(--cream)',
          marginBottom: '16px',
        }}>
          {user.name}さんの物語
        </h2>
        <p style={{ opacity: 0.85, fontSize: '1rem', lineHeight: 1.8 }}>
          あなたの人生の記録を少しずつ積み重ねていきましょう。<br />
          完成したらPDFとして保存・印刷することができます。
        </p>

        {/* 進捗バー */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>インタビュー進捗</span>
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

      {/* PDF出力 */}
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
            📄 PDFとして保存
          </h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            インタビューと年表をまとめたPDFを生成します。印刷して手元に残せます。
          </p>
        </div>
        <a
          href={pdfApi.generateUrl(user.id)}
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
            transition: 'background 0.2s',
          }}
        >
          PDFを生成する
        </a>
      </div>
    </Layout>
  );
}
