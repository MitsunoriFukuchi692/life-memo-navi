import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';

// ============================================================
// 型定義
// ============================================================
export interface SalesReport {
  id: number;
  user_id: number;
  report_date: string;
  visit_company: string;
  contact_person: string;
  purpose: string;
  content: string;
  next_action: string;
  impression: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 営業日報ページ
// ============================================================
export default function SalesReportPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  // フォーム state
  const today = new Date().toISOString().slice(0, 10);
  const [formDate, setFormDate] = useState(today);
  const [formVisitCompany, setFormVisitCompany] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNextAction, setFormNextAction] = useState('');
  const [formImpression, setFormImpression] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get<SalesReport[]>(`/sales-reports/user/${user.id}`);
      setReports(res.data);
    } catch (e) {
      console.error('営業日報取得失敗:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormDate(today);
    setFormVisitCompany('');
    setFormContactPerson('');
    setFormPurpose('');
    setFormContent('');
    setFormNextAction('');
    setFormImpression('');
    setSaveError('');
  };

  const openNew = () => { resetForm(); setShowForm(true); };

  const openEdit = (r: SalesReport) => {
    setEditingId(r.id);
    setFormDate(r.report_date.slice(0, 10));
    setFormVisitCompany(r.visit_company || '');
    setFormContactPerson(r.contact_person || '');
    setFormPurpose(r.purpose || '');
    setFormContent(r.content || '');
    setFormNextAction(r.next_action || '');
    setFormImpression(r.impression || '');
    setSaveError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formContent.trim()) { setSaveError('商談内容を入力してください。'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        user_id: user.id,
        report_date: formDate,
        visit_company: formVisitCompany,
        contact_person: formContactPerson,
        purpose: formPurpose,
        content: formContent,
        next_action: formNextAction,
        impression: formImpression,
      };
      if (editingId !== null) {
        await api.put(`/sales-reports/${editingId}`, payload);
      } else {
        await api.post('/sales-reports', payload);
      }
      setShowForm(false);
      resetForm();
      await fetchReports();
    } catch (e) {
      console.error(e);
      setSaveError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, company: string) => {
    if (!confirm(`「${company || 'この日報'}」を削除してよろしいですか？`)) return;
    try {
      await api.delete(`/sales-reports/${id}`);
      await fetchReports();
    } catch {
      alert('削除に失敗しました。');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  // フィルタ済みリスト
  const filtered = reports.filter(r => {
    const matchDate = filterDate ? r.report_date.startsWith(filterDate) : true;
    const matchComp = filterCompany ? r.visit_company?.includes(filterCompany) : true;
    return matchDate && matchComp;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '2px solid var(--cream-dark)',
    borderRadius: 'var(--radius-sm)', fontSize: '1rem', color: 'var(--text)',
    background: 'var(--cream)', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Noto Sans JP', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.85rem', color: 'var(--text-light)',
    marginBottom: '6px', fontWeight: 600,
  };

  return (
    <Layout title="📊 営業日報">
      {/* ヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #1a4a6e, #2c7bb6)',
        borderRadius: 'var(--radius)', padding: '32px 40px',
        color: 'white', marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.8rem', marginBottom: '8px' }}>
              📊 営業日報
            </h2>
            <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: 1.6 }}>
              訪問先・商談内容・次回アクションを記録・管理できます。<br />
              {reports.length > 0 ? `${reports.length} 件の日報が保存されています。` : 'まだ日報がありません。「新規作成」から記録を始めましょう。'}
            </p>
          </div>
          <button onClick={() => navigate('/field/other')} style={{
            padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.9rem', cursor: 'pointer',
          }}>
            ← その他に戻る
          </button>
        </div>
      </div>

      {/* 新規作成ボタン + フィルタ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '0.9rem' }}
            placeholder="年月で絞り込み" />
          <input type="text" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
            style={{ ...inputStyle, width: '180px', padding: '8px 12px', fontSize: '0.9rem' }}
            placeholder="会社名で絞り込み" />
          {(filterDate || filterCompany) && (
            <button onClick={() => { setFilterDate(''); setFilterCompany(''); }}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.85rem', cursor: 'pointer' }}>
              ✕ クリア
            </button>
          )}
        </div>
        <button onClick={openNew} style={{
          padding: '12px 28px', background: '#1a4a6e', border: 'none',
          borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '1rem',
          fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,74,110,0.3)',
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          ✏️ 新規作成
        </button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="fade-in" style={{
          background: 'var(--white)', borderRadius: 'var(--radius)', padding: '36px',
          boxShadow: 'var(--shadow)', border: '2px solid #2c7bb6', marginBottom: '32px',
        }}>
          <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.2rem', color: '#1a4a6e', marginBottom: '28px' }}>
            {editingId !== null ? '✏️ 日報を編集' : '✏️ 新しい営業日報'}
          </h3>

          {/* 1行目: 日付・会社名・担当者 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>日付 <span style={{ color: '#c0392b' }}>*</span></label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>訪問先・会社名</label>
              <input type="text" value={formVisitCompany} onChange={e => setFormVisitCompany(e.target.value)}
                placeholder="例：株式会社〇〇" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>担当者名</label>
              <input type="text" value={formContactPerson} onChange={e => setFormContactPerson(e.target.value)}
                placeholder="例：田中部長" style={inputStyle} />
            </div>
          </div>

          {/* 目的 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>訪問目的</label>
            <input type="text" value={formPurpose} onChange={e => setFormPurpose(e.target.value)}
              placeholder="例：新規提案、フォローアップ、契約更新の相談"
              style={inputStyle} />
          </div>

          {/* 商談内容 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>商談内容・打ち合わせ内容 <span style={{ color: '#c0392b' }}>*</span></label>
            <textarea value={formContent} onChange={e => setFormContent(e.target.value)}
              placeholder="話し合った内容、提案事項、相手の反応などを記録してください..."
              style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#2c7bb6'}
              onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
            />
          </div>

          {/* 2列: 次回アクション・所感 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>次回アクション・TODO</label>
              <textarea value={formNextAction} onChange={e => setFormNextAction(e.target.value)}
                placeholder="例：〇〇の資料を送付する、△△に確認する"
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#2c7bb6'}
                onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
              />
            </div>
            <div>
              <label style={labelStyle}>所感・気づき</label>
              <textarea value={formImpression} onChange={e => setFormImpression(e.target.value)}
                placeholder="訪問を通じて感じたこと、今後への気づきなど"
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#2c7bb6'}
                onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'}
              />
            </div>
          </div>

          {saveError && <p style={{ color: '#C0392B', fontSize: '0.9rem', marginBottom: '12px' }}>⚠️ {saveError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => { setShowForm(false); resetForm(); }}
              style={{ padding: '10px 24px', background: 'transparent', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.95rem', cursor: 'pointer' }}>
              キャンセル
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 32px', background: saving ? '#ccc' : '#1a4a6e', border: 'none',
              borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.95rem',
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? '保存中...' : '💾 保存する'}
            </button>
          </div>
        </div>
      )}

      {/* 日報一覧 */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>読み込み中...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
            {reports.length === 0 ? '日報がありません。「新規作成」から記録を始めましょう。' : '該当する日報が見つかりませんでした。'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(r => (
            <div key={r.id} className="fade-in" style={{
              background: 'var(--white)', borderRadius: 'var(--radius)', padding: '28px 32px',
              boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)',
              borderLeft: '4px solid #2c7bb6',
            }}>
              {/* ヘッダー行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a4a6e' }}>
                    📅 {formatDate(r.report_date)}
                  </span>
                  {r.visit_company && (
                    <span style={{ background: '#e8f4fd', color: '#1a4a6e', padding: '3px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                      🏢 {r.visit_company}
                    </span>
                  )}
                  {r.contact_person && (
                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>👤 {r.contact_person}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(r)}
                    style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #2c7bb6', borderRadius: '20px', color: '#2c7bb6', fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✏️ 編集
                  </button>
                  <button onClick={() => handleDelete(r.id, r.visit_company)}
                    style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #e0a0a0', borderRadius: '20px', color: '#c0392b', fontSize: '0.85rem', cursor: 'pointer' }}>
                    🗑 削除
                  </button>
                </div>
              </div>

              {/* 目的 */}
              {r.purpose && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>訪問目的</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.95rem' }}>{r.purpose}</p>
                </div>
              )}

              {/* 商談内容 */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>商談内容</span>
                <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.content}</p>
              </div>

              {/* 次回アクション・所感 */}
              {(r.next_action || r.impression) && (
                <div style={{ display: 'grid', gridTemplateColumns: r.next_action && r.impression ? '1fr 1fr' : '1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--cream-dark)' }}>
                  {r.next_action && (
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e67e22' }}>📌 次回アクション</span>
                      <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.next_action}</p>
                    </div>
                  )}
                  {r.impression && (
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#27ae60' }}>💡 所感・気づき</span>
                      <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.impression}</p>
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '12px', textAlign: 'right' }}>
                最終更新: {new Date(r.updated_at).toLocaleString('ja-JP')}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
