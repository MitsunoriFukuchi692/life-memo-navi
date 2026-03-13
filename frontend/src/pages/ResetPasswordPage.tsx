import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password || !confirm) { setError('パスワードを入力してください'); return; }
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上にしてください'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      alert('パスワードを変更しました。新しいパスワードでログインしてください。');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#2E75B6', marginBottom: '24px' }}>新しいパスワードを設定</h2>

        <input
          type="password"
          placeholder="新しいパスワード（6文字以上）"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', marginBottom: '12px', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="パスワード（確認）"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: '#2E75B6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? '変更中...' : 'パスワードを変更する'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#2E75B6' }}>← ログインに戻る</Link>
        </p>
      </div>
    </div>
  );
}