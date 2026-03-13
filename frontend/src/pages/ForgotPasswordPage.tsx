import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { setError('メールアドレスを入力してください'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#2E75B6', marginBottom: '8px' }}>パスワードをお忘れですか？</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '24px' }}>
          登録したメールアドレスを入力してください。<br/>パスワードリセット用のメールをお送りします。
        </p>

        {message ? (
          <div style={{ background: '#e8f5e9', border: '1px solid #4CAF50', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#2e7d32' }}>
            ✅ {message}
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: '#2E75B6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
            >
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#2E75B6' }}>← ログインに戻る</Link>
        </p>
      </div>
    </div>
  );
}
