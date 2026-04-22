import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { interviewApi, timelineApi, photoApi, pdfApi } from '../api';
import MemoChanAvatar, { AvatarStyle } from '../components/MemoChanAvatar';

const fieldLabels: Record<string, string> = {
  jibunshi: '自分史',
  kaishashi: '会社史',
  shukatsu: '終活ノート',
  other: '日記・営業報告',
};

const fieldDescriptions: Record<string, string> = {
  jibunshi: 'あなたの人生の記録を少しずつ積み重ねていきましょう。',
  kaishashi: '会社の歩みと大切な出来事を記録していきましょう。',
  shukatsu: '大切なことを整理して、未来に伝えましょう。',
  other: '日記・メモ帳として自由に記録したり、営業日報を管理できます。',
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

  // 「その他」のとき専用カード構成
  const otherCards = [
    {
      to: `/field/${fieldType}/interview`,
      emoji: '📓',
      title: '日記・メモ帳',
      desc: '日々の出来事やアイデアを自由に書き留めましょう',
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
      title: '出来事',
      desc: '大切な出来事を時系列で整理しましょう',
      stat: `${stats.timelines} 件の記録`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: '写真',
      desc: '大切な写真をデジタルで保管しましょう',
      stat: `${stats.photos} 枚の写真`,
      color: '#7B8FBB',
    },
  ];

  const cards = fieldType === 'other' ? otherCards : [
    {
      to: `/field/${fieldType}/interview`,
      emoji: '💬',
      title: '聞き取り',
      desc: '15の質問に答えて、あなたの物語を綴りましょう',
      stat: `${stats.interviews} / 15 問完了`,
      color: '#E8956D',
    },
    {
      to: `/field/${fieldType}/timeline`,
      emoji: '📅',
      title: '出来事',
      desc: '大切な出来事を時系列で整理しましょう',
      stat: `${stats.timelines} 件の記録`,
      color: '#6B9B6B',
    },
    {
      to: `/field/${fieldType}/photos`,
      emoji: '🖼',
      title: '写真',
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
        <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '8px' }}>
          {fieldLabel}
        </p>
        <h2 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '2rem', color: 'var(--cream)',
          marginBottom: '16px',
        }}>
          {user.name}さんの{fieldLabel}
        </h2>
        <p style={{ opacity: 0.85, fontSize: '1rem', lineHeight: 1.8 }}>
          {fieldDesc}<br />
          完成したらPDFとして保存・印刷することができます。
        </p>

        {/* 進捗バー（その他フィールドでは非表示） */}
        {fieldType !== 'other' && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>聞き取り進捗</span>
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

      {/* ===== メモちゃんとおしゃべり（自分史・終活ノートのみ表示） ===== */}
      {fieldType !== 'kaishashi' && fieldType !== 'kaishaishi' && fieldType !== 'other' && <div
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
              メモちゃんとおしゃべり
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              メモちゃんが時代のヒントを教えてくれながら、<br />
              声で話すだけで記録できる発話対話モードです。
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
          🎤 話してみる →
        </div>
      </div>}

      {/* ===== 終活ノート ===== */}
      <div
        className="fade-in"
        onClick={() => navigate('/shukatsu')}
        style={{
          background: 'linear-gradient(135deg, #f9f0ff, #fdf6ec)',
          borderRadius: 'var(--radius)',
          padding: '32px',
          boxShadow: 'var(--shadow)',
          border: '2px solid #d4a8e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '40px',
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
          <div style={{ fontSize: '3rem' }}>📖</div>
          <div>
            <h3 style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: '1.3rem',
              color: '#6B3FA0',
              marginBottom: '8px',
            }}>
              終活ノート
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              医療・介護の希望、財産・相続、葬儀の希望、家族へのメッセージを<br />
              AIと対話しながら整理できます。
            </p>
          </div>
        </div>
        <div style={{
          background: '#8E44AD',
          color: 'white',
          padding: '14px 28px',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 500,
          fontSize: '1rem',
          whiteSpace: 'nowrap',
        }}>
          開く →
        </div>
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
            聞き取りと出来事をまとめたPDFを生成します。印刷して手元に残せます。
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
          📄 PDFをダウンロード
        </a>
      </div>

    </Layout>
  );
}

