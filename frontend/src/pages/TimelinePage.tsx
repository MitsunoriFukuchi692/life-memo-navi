import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { timelineApi, Timeline } from '../api';

export default function TimelinePage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Timeline | null>(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    month: '',
    event_title: '',
    event_description: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchTimelines = async () => {
    try {
      const res = await timelineApi.getAll(user.id);
      setTimelines(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await timelineApi.update(editing.id, {
          year: Number(form.year),
          month: form.month ? Number(form.month) : undefined,
          event_title: form.event_title,
          event_description: form.event_description || undefined,
        });
      } else {
        await timelineApi.create({
          user_id: user.id,
          year: Number(form.year),
          month: form.month ? Number(form.month) : undefined,
          event_title: form.event_title,
          event_description: form.event_description || undefined,
        });
      }
      resetForm();
      fetchTimelines();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ year: new Date().getFullYear().toString(), month: '', event_title: '', event_description: '' });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (tl: Timeline) => {
    setEditing(tl);
    setForm({
      year: String(tl.year),
      month: tl.month ? String(tl.month) : '',
      event_title: tl.event_title,
      event_description: tl.event_description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;
    try {
      await timelineApi.delete(id);
      fetchTimelines();
    } catch (e) {
      console.error(e);
    }
  };

  // 年でグループ化
  const grouped: { [year: number]: Timeline[] } = {};
  timelines.forEach(tl => {
    if (!grouped[tl.year]) grouped[tl.year] = [];
    grouped[tl.year].push(tl);
  });
  const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const MONTHS = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <Layout title="📅 人生年表">
      {/* 追加ボタン */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            background: 'var(--brown-dark)',
            color: 'var(--cream)',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          ＋ 出来事を追加
        </button>
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="fade-in" style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '36px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--brown-light)',
        }}>
          <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.2rem', marginBottom: '24px', color: 'var(--brown-dark)' }}>
            {editing ? '出来事を編集' : '新しい出来事を追加'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>年 ＊</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })}
                  required
                  min="1900" max="2100"
                  style={inputStyle}
                  placeholder="1985"
                />
              </div>
              <div>
                <label style={labelStyle}>月（任意）</label>
                <select
                  value={form.month}
                  onChange={e => setForm({ ...form, month: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">月を選択</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>出来事のタイトル ＊</label>
              <input
                type="text"
                value={form.event_title}
                onChange={e => setForm({ ...form, event_title: e.target.value })}
                required
                style={inputStyle}
                placeholder="例: 〇〇高校を卒業"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>詳細（任意）</label>
              <textarea
                value={form.event_description}
                onChange={e => setForm({ ...form, event_description: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="その時の気持ちや詳しいエピソードを書いてください"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                キャンセル
              </button>
              <button type="submit" disabled={saving} style={primaryButtonStyle}>
                {saving ? '保存中...' : (editing ? '更新する' : '追加する')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 年表表示 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : timelines.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '60px',
          textAlign: 'center',
          border: '2px dashed var(--cream-dark)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
          <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
            まだ出来事が登録されていません。<br />
            「出来事を追加」ボタンから始めましょう。
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          {/* タイムラインライン */}
          <div style={{
            position: 'absolute',
            left: '8px',
            top: '20px',
            bottom: '20px',
            width: '2px',
            background: 'var(--brown-light)',
          }} />

          {sortedYears.map(year => (
            <div key={year} style={{ marginBottom: '40px' }}>
              {/* 年ラベル */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--brown-dark)',
                  border: '3px solid var(--cream)',
                  boxShadow: '0 0 0 2px var(--brown)',
                  position: 'absolute',
                  left: '0',
                }} />
                <div style={{
                  marginLeft: '16px',
                  background: 'var(--brown-dark)',
                  color: 'var(--cream)',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontFamily: "'Noto Serif JP', serif",
                  fontWeight: 600,
                  fontSize: '1rem',
                }}>
                  {year}年
                </div>
              </div>

              {/* その年の出来事 */}
              {grouped[year].sort((a, b) => (a.month || 0) - (b.month || 0)).map(tl => (
                <div key={tl.id} className="fade-in" style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px 24px',
                  marginBottom: '12px',
                  boxShadow: 'var(--shadow)',
                  border: '1px solid var(--cream-dark)',
                  marginLeft: '16px',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      {tl.month && (
                        <span style={{
                          background: 'var(--cream-dark)',
                          color: 'var(--brown)',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginBottom: '8px',
                          display: 'inline-block',
                        }}>
                          {MONTHS[tl.month]}
                        </span>
                      )}
                      <h4 style={{
                        fontFamily: "'Noto Serif JP', serif",
                        fontSize: '1.05rem',
                        color: 'var(--brown-dark)',
                        margin: '6px 0',
                      }}>
                        {tl.event_title}
                      </h4>
                      {tl.event_description && (
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                          {tl.event_description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleEdit(tl)} style={iconButtonStyle}>編集</button>
                      <button onClick={() => handleDelete(tl.id)} style={{ ...iconButtonStyle, color: '#C0392B', borderColor: '#FADBD8' }}>削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '8px',
  color: 'var(--brown)', fontWeight: 500, fontSize: '0.9rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '2px solid var(--cream-dark)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '1rem', color: 'var(--text)',
  background: 'var(--cream)', outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '12px 28px',
  background: 'var(--brown-dark)',
  color: 'var(--cream)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.95rem', fontWeight: 500,
  cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  background: 'transparent',
  border: '2px solid var(--cream-dark)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-light)',
  fontSize: '0.95rem', cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
};

const iconButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: 'transparent',
  border: '1px solid var(--cream-dark)',
  borderRadius: '6px',
  color: 'var(--text-light)',
  fontSize: '0.8rem', cursor: 'pointer',
  fontFamily: "'Noto Sans JP', sans-serif",
};
