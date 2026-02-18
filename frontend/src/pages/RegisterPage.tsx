import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

const PROJECT_TYPES = [
  { value: 'jibunshi', label: '自分史' },
  { value: 'kaishashi', label: '会社史' },
  { value: 'shukatsu', label: '終活ノート' },
  { value: 'その他', label: 'その他' },
];

export default function 登録するP年齢() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ お名前: '', 年齢: '', email: '', password: '', project_type: 'jibunshi' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.登録する({ ...form, 年齢: Number(form.年齢) });
      localStor年齢.setItem('token', res.data.token);
      localStor年齢.setItem('user', JSON.stringify(res.data));
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
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.6rem' }}>新規登録</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '8px' }}>あなたの大切な物語を始めましょう</p>
        </div>
        {error && <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#C0392B' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>記録の種類</label>
            {PROJECT_TYPES.map(pt => (
              <label key={pt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '8px', border: `2px solid ${form.project_type === pt.value ? 'var(--accent)' : 'var(--cream-dark)'}`, borderRadius: '8px', cursor: 'pointer', background: form.project_type === pt.value ? 'rgba(200,105,74,0.06)' : 'transparent' }}>
                <input type="radio" value={pt.value} checked={form.project_type === pt.value} onChange={e => setForm({ ...form, project_type: e.target.value })} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: '0.9rem' }}>{pt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>お名前</label>
              <input type="text" value={form.お名前} onChange={e => setForm({ ...form, お名前: e.target.value })} required style={inp} placeholder="Yamada Hanako" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>年齢</label>
              <input type="number" value={form.年齢} onChange={e => setForm({ ...form, 年齢: e.target.value })} required min="1" max="120" style={inp} placeholder="75" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inp} placeholder="example@email.com" />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>パスワード（6文字以上）</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} style={inp} placeholder="password" />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer' }}>
            {loading ? '登録するing...' : '登録する'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          すでにアカウントをお持ちの方は{' '}
          <Link to="/ログイン" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>ログイン</Link>
        </p>
      </div>
    </div>
  );
}
