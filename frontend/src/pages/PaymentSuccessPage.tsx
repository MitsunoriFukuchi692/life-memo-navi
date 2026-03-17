import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF6F0, #F0E8D8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans JP', sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 48,
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(92,64,51,0.12)',
      }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
        <h1 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 24, color: '#5C4033', marginBottom: 16,
        }}>
          ご登録ありがとうございます！
        </h1>
        <p style={{ fontSize: 15, color: '#7A6A5A', lineHeight: 1.8, marginBottom: 32 }}>
          サブスクリプションが有効になりました。<br />
          Life Memo Naviのすべての機能をお使いいただけます。
        </p>
        <div style={{
          background: '#F0F7FF', borderRadius: 12, padding: 16, marginBottom: 32,
          border: '1px solid #90CAF9',
        }}>
          <p style={{ fontSize: 13, color: '#1565C0', margin: 0 }}>
            5秒後に自動的にホーム画面へ移動します
          </p>
        </div>
        <button
          onClick={() => navigate('/home')}
          style={{
            width: '100%', padding: 16,
            background: '#5C4033', color: '#FAF6F0',
            border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ホームへ進む →
        </button>
      </div>
    </div>
  );
}
