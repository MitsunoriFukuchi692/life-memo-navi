import { useNavigate } from 'react-router-dom';

const fields = [
  { key: 'jibunshi', label: '自分史', emoji: '📖', desc: 'あなたの人生の物語を記録しましょう', color: '#C8694A' },
  { key: 'kaishashi', label: '会社史', emoji: '🏢', desc: '会社の歩みと歴史を記録しましょう', color: '#6B9B6B' },
  { key: 'shukatsu', label: '終活ノート', emoji: '🕊️', desc: '大切なことを整理して残しましょう', color: '#7B8FBB' },
  { key: 'other', label: 'その他', emoji: '📝', desc: '自由に記録・整理しましょう', color: '#A07850' },
];

export default function FieldSelectPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', flexDirection: 'column', display: 'flex' }}>
      {/* ヘッダー */}
      <header style={{
        background: 'var(--brown-dark)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <h1 style={{ fontFamily: "'Noto Serif JP', serif", color: 'var(--cream)', fontSize: '1.2rem', fontWeight: 600 }}>
          Life Memo Navi
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem' }}>{user.name}</span>

          {/* ⚙️ 設定ボタン */}
          <button onClick={() => navigate('/settings')} title="設定" style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '6px 12px', borderRadius: '20px',
            fontSize: '1rem', cursor: 'pointer', lineHeight: 1,
          }}>
            ⚙️
          </button>

          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
            cursor: 'pointer',
          }}>logout</button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '8px' }}>ようこそ</p>
          <h2 style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: '2rem', color: 'var(--brown-dark)', marginBottom: '16px',
          }}>
            {user.name}さん
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', lineHeight: 1.8 }}>
            記録する分野を選んでください
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          maxWidth: '900px',
          width: '100%',
        }}>
          {fields.map(field => (
            <div
              key={field.key}
              onClick={() => navigate(`/field/${field.key}`)}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius)',
                padding: '40px 28px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--cream-dark)',
                cursor: 'pointer',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                (e.currentTarget as HTMLDivElement).style.borderColor = field.color;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cream-dark)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{field.emoji}</div>
              <h3 style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: '1.4rem', color: 'var(--brown-dark)', marginBottom: '10px',
              }}>
                {field.label}
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {field.desc}
              </p>
              <div style={{
                display: 'inline-block', marginTop: '20px',
                background: `${field.color}20`, color: field.color,
                padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500,
              }}>
                開く →
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
