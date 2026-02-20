import { ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

interface LayoutProps { children: ReactNode; title?: string; }

const fieldLabels: Record<string, string> = {
  jibunshi: '自分史',
  kaishashi: '会社史',
  shukatsu: '終活ノート',
  other: 'その他',
};

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { fieldType } = useParams<{ fieldType: string }>();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 分野内のナビ（聞き取り・出来事・写真・戻る）
  const fieldNavItems = fieldType ? [
    { path: `/field/${fieldType}/interview`, label: '聞き取り' },
    { path: `/field/${fieldType}/timeline`, label: '出来事' },
    { path: `/field/${fieldType}/photos`, label: '写真' },
  ] : [];

  const fieldLabel = fieldType ? fieldLabels[fieldType] || fieldType : '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--brown-dark)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", color: 'var(--cream)', fontSize: '1.2rem', fontWeight: 600 }}>
            Life Memo Navi
            {fieldLabel && (
              <span style={{ fontSize: '0.9rem', opacity: 0.8, marginLeft: '12px' }}>
                — {fieldLabel}
              </span>
            )}
          </h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem' }}>{user.name}</span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
            cursor: 'pointer',
          }}>logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{
          width: '200px', background: 'var(--white)',
          borderRight: '1px solid var(--cream-dark)', padding: '24px 0',
          position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflow: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* 分野メニュー */}
          {fieldNavItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 24px', textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-light)',
                background: active ? 'rgba(200, 105, 74, 0.08)' : 'transparent',
                borderRight: active ? '3px solid var(--accent)' : '3px solid transparent',
                fontSize: '1rem', fontWeight: active ? 500 : 400,
              }}>
                {item.label}
              </Link>
            );
          })}

          {/* 区切り線 */}
          {fieldNavItems.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--cream-dark)',
              margin: '16px 0',
            }} />
          )}

          {/* 戻るボタン */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '14px 24px', textDecoration: 'none',
              color: 'var(--text-light)', background: 'transparent',
              border: 'none', borderRight: '3px solid transparent',
              fontSize: '1rem', fontWeight: 400, cursor: 'pointer',
              width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200, 105, 74, 0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-light)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            ← 戻る
          </button>
        </nav>

        <main style={{ flex: 1, padding: '40px', maxWidth: '900px' }}>
          {title && (
            <h2 style={{
              fontSize: '1.8rem', marginBottom: '32px',
              paddingBottom: '16px', borderBottom: '2px solid var(--cream-dark)',
            }}>{title}</h2>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
