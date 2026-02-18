$base = "C:\Users\mfuku\._life-memo navi _260217\frontend"

$layout = @'
import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps { children: ReactNode; title?: string; }

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/interview', label: 'INTERVIEW' },
    { path: '/timeline', label: 'TIMELINE' },
    { path: '/photos', label: 'PHOTOS' },
  ];

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
          </h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem' }}>{user.name}</span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
          }}>logout</button>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{
          width: '200px', background: 'var(--white)',
          borderRight: '1px solid var(--cream-dark)', padding: '24px 0',
          position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflow: 'auto',
        }}>
          {navItems.map(item => {
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
'@
Set-Content "$base\src\components\Layout.tsx" $layout -Encoding UTF8
Write-Host "OK: Layout.tsx"

$login = @'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: '24px', padding: '56px 48px',
        width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.8rem', marginBottom: '8px' }}>
            Life Memo Navi
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Your life story, preserved forever</p>
        </div>
        {error && (
          <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#C0392B' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              style={{ width: '100%', padding: '14px 16px', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '1rem', background: 'var(--cream)', outline: 'none' }}
              placeholder="example@email.com" />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
              style={{ width: '100%', padding: '14px 16px', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '1rem', background: 'var(--cream)', outline: 'none' }}
              placeholder="password" />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)',
            border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer',
          }}>
            {loading ? '...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
'@
Set-Content "$base\src\pages\LoginPage.tsx" $login -Encoding UTF8
Write-Host "OK: LoginPage.tsx"

$register = @'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

const PROJECT_TYPES = [
  { value: 'jibunshi', label: 'Autobiography' },
  { value: 'kaishashi', label: 'Company History' },
  { value: 'shukatsu', label: 'End-of-life Notes' },
  { value: 'other', label: 'Other' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', email: '', password: '', project_type: 'jibunshi' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, age: Number(form.age) });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '1rem', background: 'var(--cream)', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.6rem' }}>New Account</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '8px' }}>Start your life story</p>
        </div>
        {error && <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#C0392B' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Project Type</label>
            {PROJECT_TYPES.map(pt => (
              <label key={pt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '8px', border: `2px solid ${form.project_type === pt.value ? 'var(--accent)' : 'var(--cream-dark)'}`, borderRadius: '8px', cursor: 'pointer', background: form.project_type === pt.value ? 'rgba(200,105,74,0.06)' : 'transparent' }}>
                <input type="radio" value={pt.value} checked={form.project_type === pt.value} onChange={e => setForm({ ...form, project_type: e.target.value })} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: '0.9rem' }}>{pt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inp} placeholder="Yamada Hanako" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Age</label>
              <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required min="1" max="120" style={inp} placeholder="75" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inp} placeholder="example@email.com" />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Password (6+ chars)</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} style={inp} placeholder="password" />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
'@
Set-Content "$base\src\pages\RegisterPage.tsx" $register -Encoding UTF8
Write-Host "OK: RegisterPage.tsx"

Write-Host "ALL DONE"
