import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { interviewApi, Interview } from '../api';
import api from '../api';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface DiaryEntry {
  id: number; date: string; title: string; body: string;
  question_id: number; updated_at: string;
}

function DiaryPage({ userId, fieldType = 'other' }: { userId: number; fieldType?: string }) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const r = new SR();
    r.lang = 'en-US'; r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((x: any) => x[0].transcript).join('');
      setFormBody((prev: string) => prev + t);
    };
    r.onerror = () => setIsListening(false);
    r.onend   = () => setIsListening(false);
    recognitionRef.current = r;
  }, []);

  const handleVoiceStart = () => { recognitionRef.current?.start(); setIsListening(true); };
  const handleVoiceStop  = () => { recognitionRef.current?.stop();  setIsListening(false); };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await interviewApi.getAll(userId, fieldType);
      const parsed: DiaryEntry[] = res.data.map((iv: Interview) => {
        const parts = (iv.question_text || '').split('｜');
        return { id: iv.id, date: parts[0] || '', title: parts[1] || '',
          body: iv.answer_text || '', question_id: iv.question_id, updated_at: iv.updated_at };
      });
      parsed.sort((a, b) => (b.date > a.date ? 1 : -1));
      setEntries(parsed);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchEntries(); }, []);

  const openNew = () => {
    setEditingId(null); setFormDate(new Date().toISOString().slice(0, 10));
    setFormTitle(''); setFormBody(''); setSaveError(''); setShowForm(true);
  };
  const openEdit = (entry: DiaryEntry) => {
    setEditingId(entry.question_id); setFormDate(entry.date);
    setFormTitle(entry.title); setFormBody(entry.body); setSaveError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formBody.trim()) { setSaveError('本文を入力してください。'); return; }
    setSaving(true); setSaveError('');
    try {
      const qId = editingId !== null ? editingId
        : entries.reduce((m, e) => Math.max(m, e.question_id), 0) + 1;
      const questionText = formDate + '｜' + (formTitle || '無題');
      await api.post('/interviews', {
        user_id: userId, question_id: qId, answer_text: formBody,
        field_type: fieldType, question_text: questionText,
      });
      setShowForm(false); await fetchEntries();
    } catch (e) { console.error(e); setSaveError('Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (entry: DiaryEntry) => {
    if (!window.confirm('「' + (entry.title || entry.date) + '」を削除してよろしいですか？')) return;
    setDeleting(entry.question_id);
    try {
      await api.delete('/interviews/entry/' + userId + '/' + fieldType + '/' + entry.question_id);
      await fetchEntries();
    } catch (e) { console.error(e); window.alert('削除に失敗しました。'); }
    finally { setDeleting(null); }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US',
      { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  const voiceBtn = (on: boolean): React.CSSProperties => ({
    padding: '14px 36px',
    background: on
      ? 'linear-gradient(135deg,#e53935,#ef5350)'
      : 'linear-gradient(135deg,#1976D2,#42A5F5)',
    border: 'none', borderRadius: '50px', color: 'white',
    fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none',
    boxShadow: on ? '0 0 0 6px rgba(229,57,53,0.3)' : '0 4px 12px rgba(25,118,210,0.4)',
    fontFamily: "'Noto Sans JP',sans-serif",
  });

  return (
    <Layout title="日記・メモ帳">
      <div style={{ background: 'linear-gradient(135deg,#6B4F3A,#A07850)', borderRadius: 'var(--radius)', padding: '32px 40px', color: '#ffffff', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP',serif", fontSize: '1.8rem', marginBottom: '10px', color: '#ffffff' }}>
              📓 日記・メモ帳
            </h2>
            <p style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.8 }}>
              日々の出来事、気づき、アイデアなど何でも自由に記録できます。<br />
              {entries.length > 0
                ? entries.length + ' 件のメモがSaveされています。'
                : 'まだメモがありません。「新しいメモを書く」から始めましょう。'}
            </p>
          </div>
          <button onClick={() => navigate('/field/' + fieldType)}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ← その他に戻る
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <button onClick={openNew}
          style={{ padding: '12px 28px', background: 'var(--brown-dark)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", boxShadow: '0 4px 12px rgba(107,79,58,0.3)' }}>
          ✏️ 新しいメモを書く
        </button>
      </div>

      {showForm && (
        <div className="fade-in" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '32px', boxShadow: 'var(--shadow)', border: '2px solid var(--brown-light)', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: "'Noto Serif JP',serif", fontSize: '1.2rem', color: 'var(--brown-dark)', marginBottom: '24px' }}>
            {editingId !== null ? '✏️ メモを編集' : '✏️ 新しいメモ'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px', fontWeight: 600 }}>日付</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', color: 'var(--text)', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px', fontWeight: 600 }}>タイトル（省略可）</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="例：今日の気づき"
                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', color: 'var(--text)', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px', fontWeight: 600 }}>本文</label>
            <textarea value={formBody} onChange={e => setFormBody(e.target.value)}
              placeholder="今日の出来事、気づき、アイデアを自由に..."
              style={{ width: '100%', minHeight: '220px', padding: '16px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text)', background: 'var(--cream)', resize: 'vertical', outline: 'none', fontFamily: "'Noto Sans JP',sans-serif", boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--brown-light)'}
              onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'} />
          </div>
          {voiceSupported && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button onMouseDown={handleVoiceStart} onMouseUp={handleVoiceStop}
                onTouchStart={handleVoiceStart} onTouchEnd={handleVoiceStop}
                style={voiceBtn(isListening)}>
                {isListening ? '🔴 Speak now...' : '🎤 Hold to record'}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px' }}>
                {isListening ? 'Release the button to stop recording.' : 'Hold the button and your speech will be transcribed automatically.'}
              </p>
            </div>
          )}
          {saveError && <p style={{ color: '#C0392B', fontSize: '0.9rem', marginBottom: '12px' }}>⚠️ {saveError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '10px 24px', background: 'transparent', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.95rem', cursor: 'pointer' }}>
              キャンセル
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px 28px', background: saving ? '#ccc' : 'var(--brown-dark)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--cream)', fontSize: '0.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : '💾 Saveする'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>読み込み中...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📓</div>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>まだメモがありません。<br />上の「新しいメモを書く」ボタンから記録を始めましょう。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {entries.map(entry => (
            <div key={entry.question_id} className="fade-in"
              style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '28px 32px', boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginRight: '12px' }}>📅 {formatDate(entry.date)}</span>
                  {entry.title && entry.title !== '無題' && (
                    <span style={{ background: 'var(--cream-dark)', color: 'var(--brown-dark)', padding: '2px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{entry.title}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(entry)}
                    style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--brown-light)', borderRadius: '20px', color: 'var(--brown)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✏️ 編集
                  </button>
                  <button onClick={() => handleDelete(entry)} disabled={deleting === entry.question_id}
                    style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #e0a0a0', borderRadius: '20px', color: '#c0392b', fontSize: '0.85rem', cursor: 'pointer' }}>
                    {deleting === entry.question_id ? '削除中...' : '🗑 削除'}
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{entry.body}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '12px', textAlign: 'right' }}>
                最終更新: {new Date(entry.updated_at).toLocaleString('en-US')}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

const JIBUNSHI_QUESTIONS = [
  'What was the world like when you were born?',
  'Where were you born, and what do you remember from early childhood?',
  'Tell us about your family.',
  'What memories stand out from your school years?',
  'What was your first workplace or first job like?',
  'What major decisions shaped your life?',
  'What moments made your work feel meaningful?',
  'Who were the important people you met in your life?',
  'What hobbies or interests have brought you joy?',
  'What failures or hardships did you face?',
  'What did you learn from those experiences?',
  'What matters most to you now?',
  'What would you like to pass on to your family or future generations?',
  'When were you happiest?',
  'What message would you like to leave for the future?',
];
const KAISHASHI_QUESTIONS = [
  'What inspired the founding of the company?',
  'What was society and the industry like at the time?',
  'What is the origin of the company name and philosophy?',
  'Who were the founding members, and what early struggles did they face?',
  'What were the first products or services?',
  'What turning points helped the business grow?',
  'Were there major failures or crises?',
  'How did the company overcome them?',
  'What memorable stories involve customers or business partners?',
  'What memories with employees shaped the organization?',
  'What standards or commitments guided the technology or service?',
  'What value has the company provided to society?',
  'What do you see as the companys greatest strengths?',
  'What management beliefs should be passed to successors?',
  'What do you hope for the companys future?',
];
const SHUKATSU_QUESTIONS = [
  "現在の健康状態について",
  "持病や常用している薬は？",
  "緊急連絡先は？",
  "介護が必要になった場合の希望は？",
  "医療・延命治療についての考えは？",
  "財産（不動産・預金など）の概要は？",
  "保険の加入状況は？",
  "大切にしている品や処分してほしい物は？",
  "デジタル資産（ID・PWなど）の管理方法は？",
  "葬儀の形式や希望は？",
  "お墓や納骨の希望は？",
  "遺言書の有無や内容は？",
  "家族へのメッセージは？",
  "友人・知人へ伝えたいことは？",
  "最期まで大切にしたい生き方は？",
];
const getQuestions = (fieldType: string): string[] => {
  switch (fieldType) {
    case 'kaishashi': return KAISHASHI_QUESTIONS;
    case 'shukatsu':  return SHUKATSU_QUESTIONS;
    default:          return JIBUNSHI_QUESTIONS;
  }
};

export default function InterviewPage() {
  const { fieldType = 'jibunshi' } = useParams<{ fieldType: string }>();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (fieldType === 'other' || fieldType === 'diary') return <DiaryPage userId={user.id} fieldType={fieldType} />;

  const QUESTIONS = getQuestions(fieldType);
  const [current, setCurrent]           = useState(0);
  const [answers, setAnswers]           = useState<{ [key: number]: string }>({});
  const [saved, setSaved]               = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [fetchError, setFetchError]     = useState(false);
  const [aiEditing, setAiEditing]       = useState(false);
  const [aiEditingAll, setAiEditingAll] = useState(false);
  const [interviews, setInterviews]     = useState<Interview[]>([]);
  const [isListening, setIsListening]   = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const currentRef     = useRef<number>(0);
  const [isSpeaking, setIsSpeaking]           = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const ttsAudioRef    = useRef<HTMLAudioElement | null>(null);
  const ttsFetchingRef = useRef(false);
  const API_BASE_TTS = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace(/\/api$/, '');

  useEffect(() => { currentRef.current = current; }, [current]);

  const speakQuestion = (text: string) => {
    ttsAudioRef.current?.pause(); ttsAudioRef.current = null; ttsFetchingRef.current = false;
    const cleanText = text.replace(/Q\d+[.．、\s]*/g, '').trim();
    if (!cleanText) return;
    ttsFetchingRef.current = true; setIsSpeaking(true);
    fetch(API_BASE_TTS + '/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    })
      .then(r => r.blob()).then(blob => {
        if (!ttsFetchingRef.current) return;
        ttsFetchingRef.current = false;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url); ttsAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => setIsSpeaking(false);
        audio.play();
      }).catch(() => { ttsFetchingRef.current = false; setIsSpeaking(false); });
  };

  useEffect(() => {
    if (autoReadEnabled) speakQuestion(QUESTIONS[current]);
    return () => {
      ttsAudioRef.current?.pause(); ttsAudioRef.current = null;
      ttsFetchingRef.current = false; setIsSpeaking(false);
    };
  }, [current, autoReadEnabled]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.lang = 'en-US'; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      const qId = currentRef.current + 1;
      setAnswers(prev => ({ ...prev, [qId]: (prev[qId] || '') + transcript }));
      setSaved(prev => ({ ...prev, [qId]: false }));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend   = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
  }, [current]);

  const handleVoiceStart = () => { if (!recognitionRef.current) return; recognitionRef.current.start(); setIsListening(true); };
  const handleVoiceStop  = () => { if (!recognitionRef.current) return; recognitionRef.current.stop();  setIsListening(false); };

  useEffect(() => {
    setAnswers({}); setSaved({}); setCurrent(0); setFetchError(false);
    interviewApi.getAll(user.id, fieldType).then(res => {
      const map: { [key: number]: string } = {};
      const savedMap: { [key: number]: boolean } = {};
      res.data.forEach((iv: Interview) => { map[iv.question_id] = iv.answer_text; savedMap[iv.question_id] = true; });
      setAnswers(map); setSaved(savedMap); setInterviews(res.data);
    }).catch((e: any) => { console.error(e); setFetchError(true); });
  }, [user.id, fieldType]);

  const handleSave = async () => {
    const answerText = answers[current + 1];
    if (!answerText?.trim()) return;
    setSaving(true); setSaveError('');
    try {
      await interviewApi.save({ user_id: user.id, question_id: current + 1, answer_text: answerText, field_type: fieldType });
      setSaved(prev => ({ ...prev, [current + 1]: true }));
    } catch (e) { console.error(e); setSaveError('Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleAiEdit = async () => {
    const answerText = answers[current + 1];
    if (!answerText?.trim()) return;
    setAiEditing(true);
    try {
      const res = await api.post('/interviews/ai-edit', { question_text: QUESTIONS[current], answer_text: answerText });
      setAnswers(prev => ({ ...prev, [current + 1]: res.data.edited_text }));
      setSaved(prev => ({ ...prev, [current + 1]: false }));
    } catch (e) { console.error(e); window.alert('AI editing failed. Please try again.'); }
    finally { setAiEditing(false); }
  };

  const handleAiEditAll = async () => {
    const answersToEdit = Object.entries(answers)
      .filter(([, text]) => text?.trim())
      .map(([qId, text]) => ({ question_id: Number(qId), question_text: QUESTIONS[Number(qId) - 1], answer_text: text }));
    if (answersToEdit.length === 0) { window.alert('There are no answers yet. Please enter an answer first.'); return; }
    if (!window.confirm(answersToEdit.length + ' answers will be polished with AI. Continue?')) return;
    setAiEditingAll(true);
    try {
      const res = await api.post('/interviews/ai-edit-all', { answers: answersToEdit });
      const newAnswers = { ...answers };
      res.data.results.forEach((r: { question_id: number; edited_text: string }) => { newAnswers[r.question_id] = r.edited_text; });
      setAnswers(newAnswers);
      const newSaved = { ...saved };
      answersToEdit.forEach(a => { newSaved[a.question_id] = false; });
      setSaved(newSaved);
      window.alert(answersToEdit.length + '問のAI編集が完了しました！内容を確認してSaveしてください。');
    } catch (e) { console.error(e); window.alert('AI editing failed. Please try again.'); }
    finally { setAiEditingAll(false); }
  };

  const handleSaveAndNext = async () => { await handleSave(); if (current < 14) setCurrent(current + 1); };

  const completedCount = Object.values(saved).filter(Boolean).length;
  const answeredCount  = Object.values(answers).filter((t: any) => t?.trim()).length;
  const progress = (completedCount / 15) * 100;

  return (
    <Layout title="💬 Interview">
      {fetchError && (
        <div style={{ background: '#FEE2DC', border: '2px solid #C0392B', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ color: '#C0392B', fontSize: '1rem', marginBottom: '12px' }}>⚠️ 回答データの取得に失敗しました。ページをReloadしてください。</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Reload</button>
        </div>
      )}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{completedCount} / 15 complete</span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'var(--cream-dark)', borderRadius: '20px', height: '8px' }}>
          <div style={{ background: 'linear-gradient(90deg,var(--accent),var(--accent-light))', borderRadius: '20px', height: '100%', width: progress + '%', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
          {QUESTIONS.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: current === i ? '2px solid var(--accent)' : '2px solid var(--cream-dark)', background: saved[i + 1] ? 'var(--accent)' : (current === i ? 'var(--cream-dark)' : 'var(--white)'), color: saved[i + 1] ? 'white' : (current === i ? 'var(--brown-dark)' : 'var(--text-light)'), fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{i + 1}</button>
          ))}
        </div>
        {answeredCount > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={handleAiEditAll} disabled={aiEditingAll} style={{ padding: '12px 32px', background: aiEditingAll ? '#ccc' : 'linear-gradient(135deg,#5B3A8A,#7B5EA7)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: aiEditingAll ? 'not-allowed' : 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
              {aiEditingAll ? '✨ Polishing...' : '✨ Polish all ' + answeredCount + ' answers'}
            </button>
          </div>
        )}
      </div>

      <div className="fade-in" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '40px', boxShadow: 'var(--shadow)', border: '1px solid var(--cream-dark)' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ background: 'var(--brown-dark)', color: 'var(--cream)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Question {current + 1} / 15</span>
          {saved[current + 1] && <span style={{ background: '#E8F5E9', color: '#388E3C', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginLeft: '8px' }}>✓ Save済み</span>}
        </div>
        <h3 style={{ fontFamily: "'Noto Serif JP',serif", fontSize: '1.4rem', color: 'var(--brown-dark)', margin: '20px 0 12px', lineHeight: 1.6 }}>{QUESTIONS[current]}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (isSpeaking) { ttsAudioRef.current?.pause(); ttsAudioRef.current = null; setIsSpeaking(false); } else { speakQuestion(QUESTIONS[current]); } }}
            style={{ padding: '8px 20px', background: isSpeaking ? 'linear-gradient(135deg,#e53935,#ef5350)' : 'linear-gradient(135deg,#388E3C,#66BB6A)', border: 'none', borderRadius: '50px', color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
            {isSpeaking ? '⏹ Stop audio' : '🔊 Read question'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            <input type="checkbox" checked={autoReadEnabled} onChange={e => setAutoReadEnabled(e.target.checked)} style={{ width: '16px', height: '16px' }} />
            Read each new question automatically
          </label>
        </div>
        <textarea
          value={answers[current + 1] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current + 1]: e.target.value }))}
          placeholder="Write freely here. Notes, fragments, and bullet points are all fine."
          style={{ width: '100%', minHeight: '200px', padding: '20px', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text)', background: 'var(--cream)', resize: 'vertical', outline: 'none', fontFamily: "'Noto Sans JP',sans-serif" }}
          onFocus={e => e.target.style.borderColor = 'var(--brown-light)'}
          onBlur={e => e.target.style.borderColor = 'var(--cream-dark)'} />
        {voiceSupported && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onMouseDown={handleVoiceStart} onMouseUp={handleVoiceStop} onTouchStart={handleVoiceStart} onTouchEnd={handleVoiceStop}
              style={{ padding: '16px 40px', background: isListening ? 'linear-gradient(135deg,#e53935,#ef5350)' : 'linear-gradient(135deg,#1976D2,#42A5F5)', border: 'none', borderRadius: '50px', color: 'white', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", userSelect: 'none' }}>
              {isListening ? '🔴 Speak now...' : '🎤 Hold to record'}
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px' }}>{isListening ? 'Release the button to stop recording.' : 'Hold the button and your speech will be transcribed automatically.'}</p>
          </div>
        )}
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button onClick={handleAiEdit} disabled={aiEditing || !answers[current + 1]?.trim()}
            style={{ padding: '10px 20px', background: aiEditing ? '#ccc' : 'linear-gradient(135deg,#7B5EA7,#9B7EC8)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.9rem', fontWeight: 500, cursor: aiEditing ? 'not-allowed' : 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
            {aiEditing ? '✨ Polishing...' : '✨ Polish this answer'}
          </button>
        </div>
        {saveError && <div style={{ background: '#FEE2DC', border: '1px solid #C0392B', borderRadius: '8px', padding: '10px 16px', marginTop: '12px', color: '#C0392B', fontSize: '0.9rem' }}>⚠️ {saveError}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={secBtn}>← Previous</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving || !answers[current + 1]?.trim()} style={saveBtn}>{saving ? 'Saving...' : 'Save'}</button>
            {current < 14
              ? <button onClick={handleSaveAndNext} disabled={saving} style={priBtn}>Saveして次へ →</button>
              : <button onClick={handleSave} disabled={saving} style={priBtn}>✓ Finish</button>}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const secBtn:  React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius-sm)', color: 'var(--text-light)', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" };
const saveBtn: React.CSSProperties = { padding: '12px 24px', background: 'transparent', border: '2px solid var(--brown)', borderRadius: 'var(--radius-sm)', color: 'var(--brown)', fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" };
const priBtn:  React.CSSProperties = { padding: '12px 28px', background: 'var(--brown-dark)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--cream)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" };
