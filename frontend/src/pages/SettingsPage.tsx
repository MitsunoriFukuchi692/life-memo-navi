import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
  }, []);

  // トライアル残り日数
  const trialDaysLeft = () => {
    if (!user?.trial_expires_at) return null;
    const diff = new Date(user.trial_expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // アカウント削除実行
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'さくじょ') {
      setError('「さくじょ」と入力してください');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      localStorage.clear();
      alert('アカウントとすべてのデータを削除しました。ご利用ありがとうございました。');
      navigate('/');
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  if (!user) return null;
  const days = trialDaysLeft();

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF6F0',
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>
      {/* ヘッダー */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F0E8D8',
        padding: '0 5%', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate('/home')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8B7355', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← ホームに戻る
        </button>
        <span style={{ fontFamily: "'Noto Serif JP',serif", color: '#5C4033', fontWeight: 600 }}>
          ⚙️ 設定
        </span>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

        {/* ユーザー情報 */}
        <section style={{
          background: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid #F0E8D8', marginBottom: 24,
          boxShadow: '0 2px 12px rgba(92,64,51,0.07)',
        }}>
          <h2 style={{ fontSize: 16, color: '#5C4033', marginBottom: 20, fontWeight: 600 }}>
            👤 アカウント情報
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'お名前', value: user.name },
              { label: 'メールアドレス', value: user.email },
              { label: '年齢', value: user.age ? `${user.age}歳` : '未設定' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #F0E8D8',
              }}>
                <span style={{ color: '#8B7355', fontSize: 14 }}>{item.label}</span>
                <span style={{ color: '#2C2C2C', fontSize: 14, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* トライアル状況 */}
        {days !== null && (
          <section style={{
            background: days <= 7 ? '#FFF3E0' : '#F0F7FF',
            borderRadius: 16, padding: 24,
            border: `1px solid ${days <= 7 ? '#FFB74D' : '#90CAF9'}`,
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, color: '#5C4033', marginBottom: 12, fontWeight: 600 }}>
              📅 トライアル状況
            </h2>
            <p style={{ fontSize: 24, fontWeight: 700, color: days <= 7 ? '#E65100' : '#1565C0' }}>
              残り <span>{days}</span> 日
            </p>
            {days <= 7 && (
              <p style={{ fontSize: 13, color: '#E65100', marginTop: 8 }}>
                ⚠️ まもなく期限が切れます。継続利用はお問い合わせください。
              </p>
            )}
            <a href="mailto:mitsunorif@robostudy.jp" style={{
              display: 'inline-block', marginTop: 12,
              background: '#5C4033', color: '#FAF6F0',
              padding: '8px 20px', borderRadius: 8, fontSize: 13,
              textDecoration: 'none',
            }}>
              継続利用のお問い合わせ →
            </a>
          </section>
        )}

        {/* プライバシー */}
        <section style={{
          background: '#fff', borderRadius: 16, padding: 24,
          border: '1px solid #F0E8D8', marginBottom: 24,
          boxShadow: '0 2px 12px rgba(92,64,51,0.07)',
        }}>
          <h2 style={{ fontSize: 16, color: '#5C4033', marginBottom: 16, fontWeight: 600 }}>
            🔒 プライバシー・セキュリティ
          </h2>
          <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.8, marginBottom: 12 }}>
            入力されたすべての記録内容は暗号化されてサーバーに保存されています。
            管理者を含め、第三者があなたの記録内容を閲覧することはできません。
          </p>
          <a href="/privacy" style={{ fontSize: 13, color: '#4a90d9' }}>
            プライバシーポリシーを確認する →
          </a>
        </section>

        {/* 危険ゾーン */}
        <section style={{
          background: '#fff', borderRadius: 16, padding: 24,
          border: '2px solid #FFCDD2',
          boxShadow: '0 2px 12px rgba(92,64,51,0.07)',
        }}>
          <h2 style={{ fontSize: 16, color: '#C62828', marginBottom: 12, fontWeight: 600 }}>
            ⚠️ 危険な操作
          </h2>
          <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.8, marginBottom: 16 }}>
            アカウントを削除すると、すべての記録・写真・年表データが完全に削除されます。
            この操作は取り消せません。
          </p>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              background: '#fff', color: '#C62828',
              border: '2px solid #C62828', borderRadius: 8,
              padding: '10px 24px', fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}>
              アカウントを削除する
            </button>
          ) : (
            <div style={{
              background: '#FFF5F5', borderRadius: 12, padding: 20,
              border: '1px solid #FFCDD2',
            }}>
              <p style={{ fontSize: 14, color: '#C62828', fontWeight: 600, marginBottom: 12 }}>
                本当に削除しますか？
              </p>
              <p style={{ fontSize: 13, color: '#7A6A5A', marginBottom: 16, lineHeight: 1.7 }}>
                確認のため、下のボックスに <strong>「さくじょ」</strong> と入力してください。
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="さくじょ"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '2px solid #FFCDD2', borderRadius: 8,
                  fontSize: 16, marginBottom: 12,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              {error && (
                <p style={{ color: '#C62828', fontSize: 13, marginBottom: 12 }}>{error}</p>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setError(''); }}
                  style={{
                    flex: 1, background: '#fff', color: '#5C4033',
                    border: '2px solid #C4A882', borderRadius: 8,
                    padding: '10px', fontSize: 14, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1, background: deleting ? '#ccc' : '#C62828',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px', fontSize: 14,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontWeight: 600,
                  }}
                >
                  {deleting ? '削除中...' : '完全に削除する'}
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
