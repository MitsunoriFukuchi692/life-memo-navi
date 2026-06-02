import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { timelineApi, Timeline } from '../api';

const fieldTitles: Record<string, string> = {
  jibunshi: '人生年表',
  kaishashi: '会社年表',
  shukatsu: '終活年表',
  other: '年表',
};

// Web Speech API の型定義
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function TimelinePage() {
  const { fieldType = 'jibunshi' } = useParams<{ fieldType: string }>();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Timeline | null>(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    month: '',
    event_title: '',
    event_description: '',
  });
  const [saving, setSaving] = useState(false);

  // 音声入力
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listeningField, setListeningField] = useState<'event_title' | 'event_description' | null>(null);
  const recognitionRef = useRef<any>(null);
  const listeningFieldRef = useRef<'event_title' | 'event_description' | null>(null);

  // listeningFieldの変化をrefに同期
  useEffect(() => {
    listeningFieldRef.current = listeningField;
  }, [listeningField]);

  // Web Speech API の初期化
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const field = listeningFieldRef.current;
        if (!field) return;
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setForm(prev => ({ ...prev, [field]: (prev[field] || '') + finalTranscript }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        setListeningField(null);
      };

      recognition.onend = () => {
        setListeningField(null);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceStart = (field: 'event_title' | 'event_description') => {
    if (!recognitionRef.current) return;
    listeningFieldRef.current = field;
    setListeningField(field);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('音声認識開始エラー:', e);
    }
  };

  const handleVoiceStop = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('音声認識停止エラー:', e);
    }
    setListeningField(null);
  };

  const fetchTimelines = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await timelineApi.getAll(user.id, fieldType);
      setTimelines(res.data);
    } catch (e) {
      console.error('年表データの取得に失敗:', e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, [user.id, fieldType]);

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
          field_type: fieldType,
        });
      }
      setSaveError('');
      resetForm();
      fetchTimelines();
    } catch (e) {
      console.error('保存エラー:', e);
      setSaveError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ year: new Date().getFullYear().toString(), month: '', event_title: '', event_description: '' });
    setShowForm(false);
    setEditing(null);
    if (listeningField) handleVoiceStop();
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

  const grouped: { [year: number]: Timeline[] } = {};
  timelines.forEach(tl => {
    if (!grouped[tl.year]) grouped[tl.year] = [];
    grouped[tl.year].push(tl);
  });
  const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  const MONTHS = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const title = fieldTitles[fieldType] || '年表';

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <Layout title={`📅 ${title}`}>
      {/* PDF印刷用スタイル */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 20mm; }
        }
      `}</style>

      {/* ページ上部：ボタンエリア */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* 📄 PDFで保存ボタン（左側・目立つ位置） */}
        <button
          onClick={handlePrintPdf}
          className="no-print"
          style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Noto Sans JP', sans-serif",
            boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📄 PDFで保存・印刷
        </button>

        {/* ＋出来事を追加ボタン（右側） */}
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={primaryButtonStyle} className="no-print">
          ＋ 出来事を追加
        </button>
      </div>

      {showForm && (
        <div className="fade-in" style={{
          background: 'var(--white)', borderRadius: 'var(--radius)', padding: '36px',
          marginBottom: '32px', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--brown-light)',
        }}>
          <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.2rem', marginBottom: '24px', color: 'var(--brown-dark)' }}>
            {editing ? '出来事を編集' : '新しい出来事を追加'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>年 ＊</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                  required min="1900" max="2100" style={inputStyle} placeholder="1985" />
              </div>
              <div>
                <label style={labelStyle}>月（任意）</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} style={inputStyle}>
                  <option value="">月を選択</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 出来事タイトル + 音声入力 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>出来事のタイトル ＊</label>
              <input type="text" value={form.event_title} onChange={e => setForm({ ...form, event_title: e.target.value })}
                required style={inputStyle} placeholder="例: 〇〇高校を卒業" />
              {voiceSupported && (
                <button
                  type="button"
                  onMouseDown={() => handleVoiceStart('event_title')}
                  onMouseUp={handleVoiceStop}
                  onTouchStart={() => handleVoiceStart('event_title')}
                  onTouchEnd={handleVoiceStop}
                  style={{
                    marginTop: '8px',
                    padding: '10px 24px',
                    background: listeningField === 'event_title'
                      ? 'linear-gradient(135deg, #e53935, #ef5350)'
                      : 'linear-gradient(135deg, #1976D2, #42A5F5)',
                    border: 'none', borderRadius: '50px', color: 'white',
                    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    boxShadow: listeningField === 'event_title'
                      ? '0 0 0 5px rgba(229,57,53,0.3)'
                      : '0 3px 10px rgba(25,118,210,0.4)',
                    userSelect: 'none',
                  }}
                >
                  {listeningField === 'event_title' ? '🔴 話してください...' : '🎤 押している間だけ録音'}
                </button>
              )}
            </div>

            {/* 詳細 + 音声入力 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>詳細（任意）</label>
              <textarea value={form.event_description} onChange={e => setForm({ ...form, event_description: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="その時の気持ちや詳しいエピソードを書いてください" />
              {voiceSupported && (
                <button
                  type="button"
                  onMouseDown={() => handleVoiceStart('event_description')}
                  onMouseUp={handleVoiceStop}
                  onTouchStart={() => handleVoiceStart('event_description')}
                  onTouchEnd={handleVoiceStop}
                  style={{
                    marginTop: '8px',
                    padding: '10px 24px',
                    background: listeningField === 'event_description'
                      ? 'linear-gradient(135deg, #e53935, #ef5350)'
                      : 'linear-gradient(135deg, #1976D2, #42A5F5)',
                    border: 'none', borderRadius: '50px', color: 'white',
                    fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    boxShadow: listeningField === 'event_description'
                      ? '0 0 0 5px rgba(229,57,53,0.3)'
                      : '0 3px 10px rgba(25,118,210,0.4)',
                    userSelect: 'none',
                  }}
                >
                  {listeningField === 'event_description' ? '🔴 話してください...' : '🎤 押している間だけ録音'}
                </button>
              )}
            </div>

            {saveError && (
              <div style={{ background: '#FEE2DC', border: '1px solid #C0392B', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', color: '#C0392B', fontSize: '0.9rem' }}>
                ⚠️ {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm} style={secondaryButtonStyle}>キャンセル</button>
              <button type="submit" disabled={saving} style={primaryButtonStyle}>
                {saving ? '保存中...' : (editing ? '更新する' : '追加する')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div id="print-area">
        {/* 印刷時のタイトル */}
        <div style={{ display: 'none' }} className="print-only">
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", textAlign: 'center', marginBottom: '24px' }}>
            {user.name || ''} の {title}
          </h2>
        </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : fetchError ? (
        <div style={{
          background: '#FEE2DC', borderRadius: 'var(--radius)', padding: '40px',
          textAlign: 'center', border: '2px solid #C0392B',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#C0392B', fontSize: '1rem', marginBottom: '16px' }}>
            データの取得に失敗しました。<br />ページを再読み込みしてください。
          </p>
          <button onClick={fetchTimelines} style={{ padding: '10px 24px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
            再読み込み
          </button>
        </div>
      ) : timelines.length === 0 ? (
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius)', padding: '60px',
          textAlign: 'center', border: '2px dashed var(--cream-dark)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
          <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
            まだ出来事が登録されていません。<br />「出来事を追加」ボタンから始めましょう。
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          <div style={{ position: 'absolute', left: '8px', top: '20px', bottom: '20px', width: '2px', background: 'var(--brown-light)' }} />
          {sortedYears.map(year => (
            <div key={year} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'var(--brown-dark)', border: '3px solid var(--cream)',
                  boxShadow: '0 0 0 2px var(--brown)', position: 'absolute', left: '0',
                }} />
                <div style={{
                  marginLeft: '16px', background: 'var(--brown-dark)', color: 'var(--cream)',
                  padding: '4px 16px', borderRadius: '20px',
                  fontFamily: "'Noto Serif JP', serif", fontWeight: 600, fontSize: '1rem',
                }}>
                  {year}年
                </div>
              </div>
              {grouped[year].sort((a, b) => (a.month || 0) - (b.month || 0)).map(tl => (
                <div key={tl.id} className="fade-in" style={{
                  background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '20px 24px',
                  marginBottom: '12px', boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)',
                  marginLeft: '16px', position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      {tl.month && (
                        <span style={{
                          background: 'var(--cream-dark)', color: 'var(--brown)',
                          padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem',
                          marginBottom: '8px', display: 'inline-block',
                        }}>
                          {MONTHS[tl.month]}
                        </span>
                      )}
                      <h4 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.05rem', color: 'var(--brown-dark)', margin: '6px 0' }}>
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
      </div>{/* /print-area */}
    </Layout>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', color: 'var(--brown)', fontWeight: 500, fontSize: '0.9rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', color: 'var(--text)', background: 'var(--cream)', outline: 'none' };
const primaryButtonStyle: React.CSSProperties = { padding: '12px 28px', background: 'var(--brown-dark)', color: 'var(--cream)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
const secondaryButtonStyle: React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
const iconButtonStyle: React.CSSProperties = { padding: '6px 14px', background: 'transparent', border: '1px solid var(--cream-dark)', borderRadius: '6px', color: 'var(--text-light)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Noto Sans JP', sans-serif" };
