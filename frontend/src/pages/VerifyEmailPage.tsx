import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace('/api', '');

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('確認リンクが無効です。');
      return;
    }

    fetch(`${API_BASE}/api/auth/verify-email?token=${token}`)
      .then(async res => {
        if (res.redirected) {
          // バックエンドがリダイレクトする場合は成功とみなす
          setStatus('success');
          return;
        }
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(data.error || '確認に失敗しました。');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('サーバーに接続できませんでした。');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: '24px', padding: '56px 48px',
        width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem' }}>確認中...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
              メールアドレスの確認が完了しました！
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
              ライフメモナビへようこそ。<br />ログインしてお使いください。
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer' }}
            >
              ログインする
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', marginBottom: '12px' }}>
              確認リンクが無効です
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '8px' }}>
              {message}
            </p>
            <p style={{ color: 'var(--text-light)', marginBottom: '32px', fontSize: '0.9rem' }}>
              リンクの有効期限（24時間）が切れている可能性があります。<br />
              ログイン画面から確認メールを再送できます。
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer' }}
            >
              ログイン画面へ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
