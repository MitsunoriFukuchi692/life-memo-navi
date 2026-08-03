import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatBirthdateLabel } from '../utils/birthdate';

const API = import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  age: number | null;
  birthdate: string | null;
  created_at: string;
  record_count: number;
  last_active: string | null;
}

export default function AdminUsersPage() {
  const [searchParams] = useSearchParams();
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [onlyUnused, setOnlyUnused] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // URLの ?key= か、セッション保存済みのキーで自動読込
  useEffect(() => {
    const k = searchParams.get('key') || sessionStorage.getItem('adminKey') || '';
    if (k) { setKey(k); fetchUsers(k); }
  }, []);

  const fetchUsers = async (k: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/users?key=${encodeURIComponent(k)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '取得に失敗しました');
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setAuthed(true);
      sessionStorage.setItem('adminKey', k);
    } catch (e: any) {
      setError(e.message || '取得に失敗しました');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem('adminKey');
    setAuthed(false); setUsers([]); setTotal(0); setKey('');
  };

  const deleteUser = async (u: AdminUser) => {
    const msg = `「${u.name}」（${u.email}）を削除します。\nこの人の記録・写真・年表もすべて消え、元に戻せません。\n\n本当に削除しますか？`;
    if (!window.confirm(msg)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`${API}/admin/users/${u.id}?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '削除に失敗しました');
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 集計
  const now = new Date();
  const isSameDay = (d: Date) => d.toDateString() === now.toDateString();
  const isSameMonth = (d: Date) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const newToday = users.filter(u => u.created_at && isSameDay(new Date(u.created_at))).length;
  const newMonth = users.filter(u => u.created_at && isSameMonth(new Date(u.created_at))).length;
  const unusedCount = users.filter(u => !u.record_count).length;

  // 検索・未利用フィルタ
  const filtered = users.filter(u => {
    if (onlyUnused && u.record_count) return false;
    if (!q.trim()) return true;
    return (u.name || '').includes(q.trim()) ||
      (u.email || '').toLowerCase().includes(q.trim().toLowerCase());
  });

  const fmtDateTime = (s: string) =>
    s ? new Date(s).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

  const downloadCsv = () => {
    const header = ['id', '名前', 'メール', '年齢', '生年月日', '記録数', '最終利用', '登録日時'];
    const rows = filtered.map(u => [
      u.id, u.name, u.email, u.age ?? '', u.birthdate ?? '',
      u.record_count ?? 0, u.last_active ? fmtDateTime(u.last_active) : '未利用', fmtDateTime(u.created_at),
    ]);
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifememo_users_${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const C = { bg: '#FAF6F0', card: '#fff', border: '#F0E8D8', brown: '#5C4033', brown2: '#8B7355', accent: '#C8694A' };

  // ── キー未入力／認証前 ──
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Noto Sans JP', sans-serif" }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 2px 12px rgba(92,64,51,0.08)' }}>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.4rem', color: C.brown, marginBottom: 8 }}>管理画面</h1>
          <p style={{ color: C.brown2, fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>登録者一覧を表示します。管理キーを入力してください。</p>
          <input
            type="password" value={key} placeholder="管理キー"
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchUsers(key); }}
            style={{ width: '100%', padding: '12px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 16, background: C.bg, boxSizing: 'border-box', marginBottom: 12 }}
          />
          {error && <p style={{ color: '#C62828', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            onClick={() => fetchUsers(key)} disabled={loading || !key}
            style={{ width: '100%', padding: 14, background: loading || !key ? '#ccc' : C.brown, color: '#FAF6F0', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading || !key ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '確認中...' : '表示する'}
          </button>
        </div>
      </div>
    );
  }

  // ── 一覧表示 ──
  const stat = (label: string, value: number | string, accent = C.brown) => (
    <div style={{ flex: 1, minWidth: 140, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ color: C.brown2, fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent, fontSize: 30, fontWeight: 700 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 5%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Noto Serif JP',serif", color: C.brown, fontWeight: 600 }}>📋 登録者一覧（管理）</span>
        <button onClick={signOut} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.brown2, borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>ロック</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        {/* 集計カード */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {stat('総登録者数', total, C.accent)}
          {stat('今月の新規', newMonth)}
          {stat('今日の新規', newToday)}
          {stat('未利用（記録0）', unusedCount, '#B5651D')}
        </div>

        {/* 操作バー */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <input
            type="text" value={q} placeholder="名前・メールで検索"
            onChange={e => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 15, background: C.card, boxSizing: 'border-box' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.brown, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={onlyUnused} onChange={e => setOnlyUnused(e.target.checked)} />
            未利用のみ
          </label>
          <button onClick={() => fetchUsers(key)} disabled={loading} style={{ padding: '10px 16px', background: C.card, border: `1px solid ${C.border}`, color: C.brown, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>{loading ? '更新中...' : '🔄 更新'}</button>
          <button onClick={downloadCsv} style={{ padding: '10px 16px', background: C.brown, border: 'none', color: '#FAF6F0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>⬇ CSV</button>
        </div>

        {error && <p style={{ color: '#C62828', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        {/* テーブル */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 860 }}>
              <thead>
                <tr style={{ background: '#F7F1E8', color: C.brown2, textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>名前</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>メール</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>年齢</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>生年月日</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>記録数</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>最終利用</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>登録日時</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const unused = !u.record_count;
                  return (
                  <tr key={u.id} style={{ borderTop: `1px solid ${C.border}`, color: '#2C2C2C', background: unused ? '#FBF3E9' : 'transparent' }}>
                    <td style={{ padding: '11px 14px', color: C.brown2 }}>{i + 1}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '11px 14px' }}>{u.email}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>{u.age ? `${u.age}歳` : '—'}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>{u.birthdate ? formatBirthdateLabel(u.birthdate) : '—'}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', textAlign: 'center', fontWeight: 600, color: unused ? '#B5651D' : '#2C2C2C' }}>{u.record_count ?? 0}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: unused ? '#B5651D' : C.brown2 }}>{u.last_active ? fmtDateTime(u.last_active) : '未利用'}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: C.brown2 }}>{fmtDateTime(u.created_at)}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => deleteUser(u)} disabled={deletingId === u.id} style={{
                        background: '#fff', color: '#C62828', border: '1px solid #E9A8A8',
                        borderRadius: 6, padding: '5px 12px', fontSize: 13,
                        cursor: deletingId === u.id ? 'not-allowed' : 'pointer',
                      }}>{deletingId === u.id ? '削除中...' : '削除'}</button>
                    </td>
                  </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: C.brown2 }}>該当する登録者がいません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ color: C.brown2, fontSize: 12, marginTop: 12, lineHeight: 1.7 }}>
          ※ この画面は登録者の個人情報を含みます。URL・キーを他人と共有しないでください。
        </p>
      </div>
    </div>
  );
}
