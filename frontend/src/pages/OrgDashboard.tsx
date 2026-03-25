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

interface CsvRow {
  name: string;
  email: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

type TabType = 'members' | 'import' | 'invite';

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
  const [activeTab, setActiveTab] = useState<TabType>('members');

  // CSVインポート関連
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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

  // ========================================
  // CSV処理
  // ========================================
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return;

    // ヘッダー行をスキップ（name,email など）
    const startIndex = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('お名前') ? 1 : 0;

    const rows: CsvRow[] = lines.slice(startIndex).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const name = cols[0] || '';
      const email = cols[1] || '';

      if (!name) return { name, email, valid: false, error: '名前が空です' };
      if (!email || !email.includes('@')) return { name, email, valid: false, error: 'メールアドレスが正しくありません' };

      return { name, email, valid: true };
    }).filter(r => r.name || r.email);

    setCsvRows(rows);
  };

  const handleImport = async () => {
    if (!orgInfo) return;
    const validRows = csvRows.filter(r => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/org/import-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgInfo.orgCode,
          adminEmail,
          members: validRows.map(r => ({ name: r.name, email: r.email })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportResult({ success: 0, skipped: 0, errors: [data.error || 'インポートに失敗しました'] });
        return;
      }

      setImportResult(data);

      // 会員一覧を再取得
      const res2 = await fetch(
        `${API_BASE}/api/org/dashboard/${orgInfo.orgCode}?adminEmail=${encodeURIComponent(adminEmail)}`
      );
      const data2 = await res2.json();
      if (res2.ok) {
        setMembers(data2.members);
        setTotalCount(data2.totalCount);
      }

      setCsvRows([]);
      setCsvFileName('');
    } catch {
      setImportResult({ success: 0, skipped: 0, errors: ['サーバーに接続できませんでした'] });
    } finally {
      setImporting(false);
    }
  };

  const resetCsv = () => {
    setCsvRows([]);
    setCsvFileName('');
    setImportResult(null);
  };

  // ========================================
  // ログイン画面
  // ========================================
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

          <button style={styles.button} onClick={handleLogin} disabled={loading}>
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </div>
      </div>
    );
  }

  const validCount = csvRows.filter(r => r.valid).length;
  const invalidCount = csvRows.filter(r => !r.valid).length;

  // ========================================
  // ダッシュボード画面
  // ========================================
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

      {/* タブナビゲーション */}
      <div style={styles.tabBar}>
        {([
          { key: 'members', label: '👥 会員一覧' },
          { key: 'import',  label: '📂 CSVインポート' },
          { key: 'invite',  label: '📋 招待コード' },
        ] as { key: TabType; label: string }[]).map(tab => (
          <button
            key={tab.key}
            style={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== 会員一覧タブ ========== */}
      {activeTab === 'members' && (
        <div style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>👥 会員一覧</h2>
          {members.length === 0 ? (
            <div style={styles.emptyState}>
              <p>まだ会員が登録されていません。</p>
              <p>招待コード「<strong>{orgInfo?.orgCode}</strong>」を会員の方にお伝えいただくか、<br />
              「CSVインポート」タブから一括登録してください。</p>
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
      )}

      {/* ========== CSVインポートタブ ========== */}
      {activeTab === 'import' && (
        <div style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>📂 会員名簿CSVインポート</h2>

          {/* CSVフォーマット説明 */}
          <div style={styles.infoBox}>
            <p style={styles.infoTitle}>📄 CSVファイルの形式</p>
            <p style={styles.infoText}>1列目：お名前　2列目：メールアドレス　の順でご用意ください。</p>
            <div style={styles.csvExample}>
              <code>
                name,email<br />
                山田太郎,yamada@example.com<br />
                鈴木花子,suzuki@example.com
              </code>
            </div>
            <p style={styles.infoNote}>
              ※ インポートすると各会員に自動で招待メールが送信されます<br />
              ※ 既に登録済みのメールアドレスはスキップされます
            </p>
          </div>

          {/* ファイル選択 */}
          {csvRows.length === 0 && !importResult && (
            <div style={styles.uploadArea}>
              <div style={styles.uploadIcon}>📂</div>
              <p style={styles.uploadText}>CSVファイルを選択してください</p>
              <label style={styles.uploadBtn}>
                ファイルを選択
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* プレビュー */}
          {csvRows.length > 0 && !importResult && (
            <>
              <div style={styles.previewHeader}>
                <span style={styles.fileName}>📄 {csvFileName}</span>
                <div style={styles.previewStats}>
                  <span style={styles.validBadge}>✅ 有効: {validCount}件</span>
                  {invalidCount > 0 && <span style={styles.invalidBadge}>⚠️ エラー: {invalidCount}件</span>}
                </div>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>No.</th>
                      <th style={styles.th}>お名前</th>
                      <th style={styles.th}>メールアドレス</th>
                      <th style={styles.th}>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr key={i} style={row.valid ? (i % 2 === 0 ? styles.trEven : styles.trOdd) : styles.trError}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={styles.td}>{row.name || '（空）'}</td>
                        <td style={styles.td}>{row.email || '（空）'}</td>
                        <td style={styles.td}>
                          {row.valid
                            ? <span style={styles.okBadge}>✅ OK</span>
                            : <span style={styles.ngBadge}>⚠️ {row.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.importActions}>
                <button style={styles.cancelBtn} onClick={resetCsv}>
                  キャンセル
                </button>
                <button
                  style={validCount === 0 ? styles.importBtnDisabled : styles.importBtn}
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                >
                  {importing ? '送信中...' : `${validCount}件をインポートして招待メールを送信`}
                </button>
              </div>
            </>
          )}

          {/* インポート結果 */}
          {importResult && (
            <div style={styles.resultBox}>
              <div style={styles.resultTitle}>📬 インポート完了！</div>
              <div style={styles.resultStats}>
                <div style={styles.resultItem}>
                  <span style={styles.resultNum}>{importResult.success}</span>
                  <span style={styles.resultLabel}>招待メール送信成功</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultNumGray}>{importResult.skipped}</span>
                  <span style={styles.resultLabel}>既登録のためスキップ</span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div style={styles.resultErrors}>
                  {importResult.errors.map((e, i) => <p key={i} style={styles.resultError}>⚠️ {e}</p>)}
                </div>
              )}
              <button style={styles.button} onClick={resetCsv}>
                続けてインポートする
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== 招待コードタブ ========== */}
      {activeTab === 'invite' && (
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
      )}
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
  logo: { fontSize: '48px', textAlign: 'center', marginBottom: '16px' },
  title: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', color: '#333', margin: '0 0 8px' },
  subtitle: { fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '28px' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #e0e0e0', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' },
  error: { color: '#e53935', fontSize: '13px', background: '#fde8e8', padding: '10px', borderRadius: '8px', marginBottom: '12px' },

  dashboard: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '"Noto Sans JP", sans-serif' },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' },
  headerTitle: { margin: 0, fontSize: '22px' },
  headerSub: { margin: '4px 0 0', opacity: 0.85, fontSize: '14px' },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  statsRow: { display: 'flex', gap: '16px', padding: '24px 32px', flexWrap: 'wrap' },
  statCard: { background: 'white', borderRadius: '12px', padding: '20px 28px', flex: 1, minWidth: '140px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#667eea' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '4px' },

  // タブ
  tabBar: { display: 'flex', gap: '4px', padding: '0 32px', marginBottom: '8px' },
  tab: { padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: '#e0e0e0', color: '#666', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0', background: 'white', color: '#667eea', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', borderBottom: '3px solid #667eea' },

  tableSection: { margin: '0 32px 24px', background: 'white', borderRadius: '0 12px 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '16px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f0f0f0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#555' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f0f0f0' },
  trEven: { background: 'white' },
  trOdd: { background: '#fafafa' },
  trError: { background: '#fff8f8' },

  emptyState: { textAlign: 'center', padding: '40px', color: '#888', fontSize: '15px', lineHeight: '2' },

  // CSVインポート
  infoBox: { background: '#f0f4ff', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' },
  infoTitle: { fontWeight: 'bold', color: '#667eea', marginBottom: '6px', fontSize: '14px' },
  infoText: { fontSize: '13px', color: '#555', marginBottom: '8px' },
  csvExample: { background: 'white', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#333', fontFamily: 'monospace', marginBottom: '8px', lineHeight: '1.8' },
  infoNote: { fontSize: '12px', color: '#888', lineHeight: '1.8' },

  uploadArea: { border: '2px dashed #667eea', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '20px' },
  uploadIcon: { fontSize: '40px', marginBottom: '12px' },
  uploadText: { color: '#666', marginBottom: '16px', fontSize: '15px' },
  uploadBtn: { display: 'inline-block', padding: '10px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },

  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  fileName: { fontSize: '14px', color: '#555', fontWeight: 'bold' },
  previewStats: { display: 'flex', gap: '8px' },
  validBadge: { background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
  invalidBadge: { background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
  okBadge: { color: '#2e7d32', fontSize: '13px' },
  ngBadge: { color: '#e65100', fontSize: '13px' },

  importActions: { display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '12px 24px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  importBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  importBtnDisabled: { padding: '12px 24px', background: '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '14px', fontWeight: 'bold' },

  resultBox: { textAlign: 'center', padding: '32px' },
  resultTitle: { fontSize: '22px', fontWeight: 'bold', color: '#333', marginBottom: '24px' },
  resultStats: { display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px' },
  resultItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  resultNum: { fontSize: '36px', fontWeight: 'bold', color: '#667eea' },
  resultNumGray: { fontSize: '36px', fontWeight: 'bold', color: '#aaa' },
  resultLabel: { fontSize: '13px', color: '#666' },
  resultErrors: { background: '#fff3e0', borderRadius: '8px', padding: '12px', marginBottom: '20px', textAlign: 'left' },
  resultError: { fontSize: '13px', color: '#e65100', margin: '4px 0' },

  // 招待コード
  inviteSection: { margin: '0 32px 32px', background: 'white', borderRadius: '0 12px 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  inviteText: { color: '#555', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' },
  codeBox: { display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #667eea20, #764ba220)', border: '2px solid #667eea', borderRadius: '12px', padding: '16px 24px', marginBottom: '12px' },
  codeLabel: { fontSize: '13px', color: '#667eea', fontWeight: 'bold' },
  codeValue: { fontSize: '28px', fontWeight: 'bold', color: '#333', letterSpacing: '2px' },
  inviteNote: { fontSize: '12px', color: '#999' },
};

export default OrgDashboard;
