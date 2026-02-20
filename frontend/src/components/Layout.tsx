import { ReactNode, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fieldNavItems = fieldType ? [
    { path: `/field/${fieldType}/interview`, label: '聞き取り' },
    { path: `/field/${fieldType}/timeline`, label: '出来事' },
    { path: `/field/${fieldType}/photos`, label: '写真' },
  ] : [];

  const fieldLabel = fieldType ? fieldLabels[fieldType] || fieldType : '';

  const navLinkStyle = (path: string): React.CSSProperties => {
    const active = location.pathname === path;
    return {
      display: 'flex', alignItems: 'center',
      padding: '14px 24px', textDecoration: 'none',
      color: active ? 'var(--accent)' : 'var(--text-light)',
      background: active ? 'rgba(200, 105, 74, 0.08)' : 'transparent',
      borderRight: active ? '3px solid var(--accent)' : '3px solid transparent',
      fontSize: '1rem', fontWeight: active ? 500 : 400,
    };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--brown-dark)', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--cream)', fontSize: '1.5rem',
              cursor: 'pointer', padding: '4px 8px',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
            <h1 style={{ fontFamily: "'Noto Serif JP', serif", color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>
              Life Memo Navi
              {fieldLabel && <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: '8px' }}>— {fieldLabel}</span>}
            </h1>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--brown-light)', fontSize: '0.85rem' }}>{user.name}</span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '5px 12px', borderRadius: '20px',
            fontSize: '0.8rem', cursor: 'pointer',
          }}>logout</button>
        </div>
      </header>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 90,
          }}
        />
      )}

      <nav style={{
        position: 'fixed',
        top: '64px', left: menuOpen ? 0 : '-220px',
        width: '200px',
        height: 'calc(100vh - 64px)',
        background: 'var(--white)',
        borderRight: '1px solid var(--cream-dark)',
        padding: '24px 0',
        zIndex: 95,
        transition: 'left 0.3s ease',
        overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {fieldNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={navLinkStyle(item.path)}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}

        {fieldNavItems.length > 0 && (
          <div style={{ borderTop: '1px solid var(--cream-dark)', margin: '16px 0' }} />
        )}

        <button
          onClick={() => { navigate('/'); setMenuOpen(false); }}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 24px',
            color: 'var(--text-light)', background: 'transparent',
            border: 'none', borderRight: '3px solid transparent',
            fontSize: '1rem', fontWeight: 400, cursor: 'pointer',
            width: '100%', textAlign: 'left',
          }}
        >
          ← 戻る
        </button>
      </nav>

      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {title && (
          <h2 style={{
            fontSize: '1.5rem', marginBottom: '24px',
            paddingBottom: '12px', borderBottom: '2px solid var(--cream-dark)',
          }}>{title}</h2>
        )}
        {children}
      </main>
    </div>
  );
}
