import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace('/api', '');

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const verified = searchParams.get('verified') === 'true';
  const isEnglish = searchParams.get('lang') === 'en' || localStorage.getItem('lm_lang') === 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailUnverified(false);
    setResendMessage('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('lm_lang', isEnglish ? 'en' : 'ja');
      navigate('/home');
    } catch (err: any) {
      if (err.response?.data?.email_unverified) {
        setEmailUnverified(true);
      }
      setError(err.response?.data?.error || (isEnglish ? 'Login failed' : 'ログインに失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      setResendMessage(data.message || (isEnglish ? 'Verification email has been resent.' : '確認メールを再送信しました。'));
    } catch {
      setResendMessage(isEnglish ? 'Could not send. Please try again later.' : '送信に失敗しました。しばらくしてからお試しください。');
    } finally {
      setResendLoading(false);
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
            {isEnglish ? 'Life Memo Navi' : 'ライフメモナビ'}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {isEnglish ? 'Preserve important stories for the future' : '人生の大切な記録を未来へ'}
          </p>
        </div>
        {verified && (
          <div style={{ background: '#D4EDDA', border: '1px solid #28a745', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#155724' }}>
            {isEnglish ? '✅ Email verification is complete. Please log in.' : '✅ メールアドレスの確認が完了しました。ログインしてください。'}
          </div>
        )}
        {error && (
          <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: emailUnverified ? '8px' : '24px', color: '#C0392B' }}>
            {error}
          </div>
        )}
        {emailUnverified && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            {resendMessage ? (
              <div style={{ background: '#D4EDDA', border: '1px solid #28a745', borderRadius: '8px', padding: '12px 16px', color: '#155724', fontSize: '0.9rem' }}>
                {resendMessage}
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{ background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', borderRadius: '8px', padding: '10px 20px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
              >
                {resendLoading ? (isEnglish ? 'Sending...' : '送信中...') : (isEnglish ? 'Resend verification email' : '確認メールを再送する')}
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>{isEnglish ? 'Email address' : 'メールアドレス'}</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              style={{ width: '100%', padding: '14px 16px', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '1rem', background: 'var(--cream)', outline: 'none' }}
              placeholder="example@email.com" />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>{isEnglish ? 'Password' : 'パスワード'}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
              style={{ width: '100%', padding: '14px 16px', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '1rem', background: 'var(--cream)', outline: 'none' }}
              placeholder={isEnglish ? 'Password' : 'パスワード'} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)',
            border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer',
          }}>
            {loading ? '...' : (isEnglish ? 'Log in' : 'ログイン')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          {isEnglish ? 'New to Life Memo Navi?' : 'アカウントをお持ちでない方は'}{' '}
          <Link to={isEnglish ? '/register?lang=en' : '/register'} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            {isEnglish ? 'Create an account' : '新規登録'}
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
          <Link to={isEnglish ? '/forgot-password?lang=en' : '/forgot-password'} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            {isEnglish ? 'Forgot your password?' : 'パスワードをお忘れの方はこちら'}
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.8rem' }}>
          {isEnglish ? (
            <Link to="/login" onClick={() => localStorage.setItem('lm_lang', 'ja')} style={{ color: 'var(--text-light)' }}>日本語ログインへ</Link>
          ) : (
            <Link to="/login?lang=en" onClick={() => localStorage.setItem('lm_lang', 'en')} style={{ color: 'var(--text-light)' }}>English mode</Link>
          )}
        </p>
      </div>
    </div>
  );
}
