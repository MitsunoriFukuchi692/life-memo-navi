import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace('/api', '');

const PROJECT_TYPES = [
  { value: 'jibunshi', label: '自分史' },
  { value: 'kaishashi', label: '会社史' },
  { value: 'shukatsu', label: '終活ノート' },
  { value: 'other', label: 'その他' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', age: '', email: '', password: '', project_type: 'jibunshi' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 団体コード入力ステップ用
  const [step, setStep] = useState<'register' | 'orgCode'>('register');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [orgCode, setOrgCode] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');
  const [orgError, setOrgError] = useState('');
  const [skipLoading, setSkipLoading] = useState(false);
  const [skipError, setSkipError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, age: Number(form.age) });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      setRegisteredUser(res.data);
      setStep('orgCode'); // 登録完了後に団体コード画面へ
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (code?: string) => {
    setSkipLoading(true);
    setSkipError('');
    try {
      const user = registeredUser || JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id || user.id,
          userEmail: user.email || form.email,
          orgCode: code || '',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSkipError('決済ページの取得に失敗しました。もう一度お試しください。');
      }
    } catch {
      setSkipError('サーバーに接続できませんでした。しばらくしてからもう一度お試しください。');
    } finally {
      setSkipLoading(false);
    }
  };

  const handleOrgJoin = async () => {
    if (!orgCode.trim()) {
      setOrgError('団体コードを入力してください');
      return;
    }
    setOrgLoading(true);
    setOrgError('');
    try {
      const res = await fetch(`${API_BASE}/api/org/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgCode.trim().toUpperCase(),
          userId: registeredUser?.user_id || registeredUser?.id,
          userName: registeredUser?.name || form.name,
          userEmail: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrgError(data.error || 'エラーが発生しました');
        return;
      }
      setOrgMessage(data.message);
      // 学会コードの場合はStripe決済へ（14日トライアル付き¥220プラン）
      const isGakkai = orgCode.trim().toUpperCase() === '120-4967';
      setTimeout(() => {
        if (isGakkai) {
          startCheckout(orgCode.trim().toUpperCase());
        } else {
          navigate('/home');
        }
      }, 1500);
    } catch {
      setOrgError('サーバーに接続できませんでした');
    } finally {
      setOrgLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '2px solid var(--cream-dark)', borderRadius: '8px',
    fontSize: '1rem', background: 'var(--cream)', outline: 'none'
  };

  // ========================================
  // 団体コード入力画面
  // ========================================
  if (step === 'orgCode') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>

          {orgMessage ? (
            // 参加成功メッセージ
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', marginBottom: '8px' }}>{orgMessage}</h2>
              <p style={{ color: 'var(--text-light)' }}>ホーム画面へ移動します...</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏢</div>
                <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', marginBottom: '8px' }}>所属団体はありますか？</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  学会・団体から招待コードを受け取っている方は<br />入力してください。
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>団体コード</label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="例: 120-4967"
                  style={{ ...inp, textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '3px' }}
                />
              </div>

              {orgError && (
                <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#C0392B' }}>
                  {orgError}
                </div>
              )}

              <button
                onClick={handleOrgJoin}
                disabled={orgLoading || skipLoading}
                style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer', marginBottom: '12px' }}
              >
                {orgLoading ? '確認中...' : '参加する'}
              </button>

              {skipError && (
                <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', color: '#C0392B', fontSize: '0.9rem' }}>
                  {skipError}
                </div>
              )}

              <button
                onClick={() => startCheckout()}
                disabled={skipLoading || orgLoading}
                style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--text-light)', border: '2px solid var(--cream-dark)', borderRadius: '8px', fontSize: '0.95rem', cursor: skipLoading ? 'not-allowed' : 'pointer', opacity: skipLoading ? 0.7 : 1 }}
              >
                {skipLoading ? '決済ページを準備中...' : 'スキップして通常プランへ（¥380/月）'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // 通常の登録画面
  // ========================================
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.6rem' }}>新規登録</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '8px' }}>あなたの大切な物語を始めましょう</p>
        </div>
        {error && (
          <div style={{ background: '#FEE2DC', border: '1px solid var(--accent)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#C0392B' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>記録の種類</label>
            {PROJECT_TYPES.map(pt => (
              <label key={pt.value} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', marginBottom: '8px',
                border: `2px solid ${form.project_type === pt.value ? 'var(--accent)' : 'var(--cream-dark)'}`,
                borderRadius: '8px', cursor: 'pointer',
                background: form.project_type === pt.value ? 'rgba(200,105,74,0.06)' : 'transparent'
              }}>
                <input
                  type="radio" value={pt.value}
                  checked={form.project_type === pt.value}
                  onChange={e => setForm({ ...form, project_type: e.target.value })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '0.9rem' }}>{pt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>お名前</label>
              <input
                type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required style={inp} placeholder="福地三則"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>年齢</label>
              <input
                type="number" value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                required min="1" max="120" style={inp} placeholder="75"
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>Email</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required style={inp} placeholder="example@email.com"
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500 }}>パスワード（6文字以上）</label>
            <input
              type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required minLength={6} style={inp} placeholder="password"
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '16px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer' }}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>ログイン</Link>
        </p>
      </div>
    </div>
  );
}
