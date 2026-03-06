import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com';

// ========================================
// 型定義
// ========================================
interface Member {
  id: number;
  user_name: string;
  user_email: string;
  joined_at: string;
}

interface OrgInfo {
  id: number;
  name: string;
  orgCode: string;
  contactEmail: string;
  createdAt: string;
}

// ========================================
// 事務局ダッシュボード画面
// ========================================
const OrgDashboard: React.FC = () => {
  const [orgCode, setOrgCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async () => {
    if (!orgCode.trim() || !adminEmail.trim()) {
      setError('団体コードとメールアドレスを入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/org/dashboard/${orgCode.trim().toUpperCase()}?adminEmail=${encodeURIComponent(adminEmail.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }

      setOrgInfo(data.organization);
      setMembers(data.members);
      setTotalCount(data.totalCount);
      setLoggedIn(true);
    } catch {
      setError('サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // ログイン画面
  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <div style={styles.logo}>🏢</div>
          <h1 style={styles.title}>団体管理ダッシュボード</h1>
          <p style={styles.subtitle}>ライフ・メモナビ 事務局専用</p>

          <div style={styles.formGroup}>
            <label style={styles.label}>団体コード</label>
            <input
              style={styles.input}
              type="text"
              placeholder="例: NIPP-1234"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>管理者メールアドレス</label>
            <input
              style={styles.input}
              type="email"
              placeholder="jimusho@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={styles.button}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </div>
      </div>
    );
  }

  // ダッシュボード画面
  return (
    <div style={styles.dashboard}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🏢 {orgInfo?.name}</h1>
          <p style={styles.headerSub}>団体コード: <strong>{orgInfo?.orgCode}</strong></p>
        </div>
        <button
          style={styles.logoutBtn}
          onClick={() => { setLoggedIn(false); setOrgCode(''); setAdminEmail(''); }}
        >
          ログアウト
        </button>
      </div>

      {/* 統計カード */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{totalCount}</div>
          <div style={styles.statLabel}>登録会員数</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {members.filter(m => {
              const d = new Date(m.joined_at);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </div>
          <div style={styles.statLabel}>今月の新規登録</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{orgInfo?.orgCode}</div>
          <div style={styles.statLabel}>招待コード</div>
        </div>
      </div>

      {/* 会員一覧 */}
      <div style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>👥 会員一覧</h2>
        {members.length === 0 ? (
          <div style={styles.emptyState}>
            <p>まだ会員が登録されていません。</p>
            <p>招待コード「<strong>{orgInfo?.orgCode}</strong>」を会員の方にお伝えください。</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>No.</th>
                  <th style={styles.th}>お名前</th>
                  <th style={styles.th}>メールアドレス</th>
                  <th style={styles.th}>参加日</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{member.user_name || '（未設定）'}</td>
                    <td style={styles.td}>{member.user_email || '（未設定）'}</td>
                    <td style={styles.td}>{formatDate(member.joined_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 招待コード案内 */}
      <div style={styles.inviteSection}>
        <h2 style={styles.sectionTitle}>📋 会員招待方法</h2>
        <p style={styles.inviteText}>
          会員の方にアプリ登録時に以下のコードを入力してもらうと、自動的にこのダッシュボードに反映されます。
        </p>
        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>招待コード</span>
          <span style={styles.codeValue}>{orgInfo?.orgCode}</span>
        </div>
        <p style={styles.inviteNote}>
          ※ コードは事務局スタッフのみ知っている状態にしてください
        </p>
      </div>
    </div>
  );
};

// ========================================
// スタイル
// ========================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  loginBox: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center',
    marginBottom: '28px',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#e53935',
    fontSize: '13px',
    background: '#fde8e8',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  dashboard: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'white',
  },
  headerTitle: {
    margin: 0,
    fontSize: '22px',
  },
  headerSub: {
    margin: '4px 0 0',
    opacity: 0.85,
    fontSize: '14px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.5)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    padding: '24px 32px',
    flexWrap: 'wrap',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px 28px',
    flex: 1,
    minWidth: '140px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  tableSection: {
    margin: '0 32px 24px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thead: {
    background: '#f0f0f0',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#555',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#333',
    borderBottom: '1px solid #f0f0f0',
  },
  trEven: { background: 'white' },
  trOdd: { background: '#fafafa' },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
    fontSize: '15px',
    lineHeight: '2',
  },
  inviteSection: {
    margin: '0 32px 32px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  inviteText: {
    color: '#555',
    fontSize: '14px',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  codeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'linear-gradient(135deg, #667eea20, #764ba220)',
    border: '2px solid #667eea',
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '12px',
  },
  codeLabel: {
    fontSize: '13px',
    color: '#667eea',
    fontWeight: 'bold',
  },
  codeValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: '2px',
  },
  inviteNote: {
    fontSize: '12px',
    color: '#999',
  },
};

export default OrgDashboard;
