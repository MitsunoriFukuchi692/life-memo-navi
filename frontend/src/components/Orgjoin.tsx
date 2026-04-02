import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace(/\/api$/, '');

interface OrgJoinProps {
  userId: number;
  userName?: string;
  userEmail?: string;
  onClose?: () => void;
}

const OrgJoin: React.FC<OrgJoinProps> = ({ userId, userName, userEmail, onClose }) => {
  const [orgCode, setOrgCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!orgCode.trim()) {
      setError('団体コードを入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/org/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgCode.trim().toUpperCase(),
          userId,
          userName: userName || '',
          userEmail: userEmail || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }

      setResult({ success: true, message: data.message });
    } catch {
      setError('サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✅</div>
        <p style={styles.successMsg}>{result.message}</p>
        {onClose && (
          <button style={styles.closeBtn} onClick={onClose}>閉じる</button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🏢 団体コードで参加</h3>
      <p style={styles.desc}>
        所属する団体・学会からコードを受け取った場合は入力してください。
      </p>
      <input
        style={styles.input}
        type="text"
        placeholder="例: NIPP-1234"
        value={orgCode}
        onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
        maxLength={10}
      />
      {error && <p style={styles.error}>{error}</p>}
      <button
        style={styles.btn}
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? '確認中...' : '参加する'}
      </button>
      {onClose && (
        <button style={styles.skipBtn} onClick={onClose}>スキップ</button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '2px solid #667eea',
    maxWidth: '400px',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  title: {
    fontSize: '18px',
    color: '#333',
    margin: '0 0 8px',
  },
  desc: {
    fontSize: '13px',
    color: '#777',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '18px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    textAlign: 'center',
    letterSpacing: '2px',
    fontWeight: 'bold',
  },
  error: {
    color: '#e53935',
    fontSize: '13px',
    marginTop: '8px',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  skipBtn: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: '#999',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
  },
  successBox: {
    textAlign: 'center',
    padding: '32px',
    background: 'white',
    borderRadius: '12px',
    border: '2px solid #4caf50',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  successMsg: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '16px',
  },
  closeBtn: {
    padding: '10px 24px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
  },
};

export default OrgJoin;
