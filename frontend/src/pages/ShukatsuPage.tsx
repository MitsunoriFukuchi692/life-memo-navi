import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================
// カテゴリ定義
// ============================================================
const CATEGORIES = [
  {
    key: 'medical',
    label: '医療・介護の希望',
    icon: '🏥',
    color: '#4A90D9',
    bg: '#EBF4FF',
    desc: '延命治療・介護・告知の希望',
  },
  {
    key: 'assets',
    label: '財産・相続・保険',
    icon: '💰',
    color: '#27AE60',
    bg: '#EAFAF1',
    desc: '通帳・保険・不動産・遺言',
  },
  {
    key: 'funeral',
    label: '葬儀・お墓の希望',
    icon: '🌸',
    color: '#8E44AD',
    bg: '#F5EEF8',
    desc: '葬儀の形式・宗教・納骨',
  },
  {
    key: 'message',
    label: '家族へのメッセージ',
    icon: '💌',
    color: '#E67E22',
    bg: '#FEF9E7',
    desc: '感謝・想い・お願い',
  },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QAPair {
  question: string;
  answer: string;
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function ShukatsuPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [finished, setFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id ? String(user.id) : null;
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSavedCategories();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 音声入力トグル
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザは音声入力に対応していません。Chrome推奨です。");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const fetchSavedCategories = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/shukatsu/notes/${userId}`, { headers });
      const categories = Object.keys(res.data.notes || {});
      setSavedCategories(categories);
    } catch {}
  };

  // カテゴリ選択→AIに最初のメッセージを取得
  const startCategory = async (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setMessages([]);
    setQaPairs([]);
    setInput('');
    setFinished(false);
    setCurrentQuestion('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/shukatsu/chat`,
        { category: categoryKey, messages: [], isFirst: true },
        { headers }
      );
      const aiMsg = res.data.question;
      setCurrentQuestion(aiMsg);
      setMessages([{ role: 'assistant', content: aiMsg }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setLoading(false);
    }
  };

  // メッセージ送信
  const sendMessage = async () => {
    if (!input.trim() || loading || finished) return;

    const userAnswer = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userAnswer }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Q&Aペアを記録
    const newQaPairs = [...qaPairs, { question: currentQuestion, answer: userAnswer }];
    setQaPairs(newQaPairs);

    try {
      const res = await axios.post(`${API_URL}/shukatsu/chat`,
        {
          category: selectedCategory,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userAnswer,
          isFirst: false,
        },
        { headers }
      );

      const { reaction, question, moveToNext } = res.data;
      const aiContent = reaction ? `${reaction}\n\n${question}` : question;

      setMessages([...newMessages, { role: 'assistant', content: aiContent }]);
      setCurrentQuestion(question);

      if (moveToNext) {
        setFinished(true);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setLoading(false);
    }
  };

  // 保存
  const saveNotes = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/shukatsu/save`,
        { userId, category: selectedCategory, qa_pairs: qaPairs },
        { headers }
      );
      setSaveMsg('✅ 保存しました！');
      await fetchSavedCategories();
      setTimeout(() => {
        setSaveMsg('');
        setSelectedCategory(null);
      }, 1500);
    } catch {
      setSaveMsg('❌ 保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const categoryInfo = CATEGORIES.find(c => c.key === selectedCategory);

  // ============================================================
  // カテゴリ選択画面
  // ============================================================
  if (!selectedCategory) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>

          {/* ヘッダー */}
          <div style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← 戻る</button>
            <h1 style={styles.title}>📖 終活ノート</h1>
            <p style={styles.subtitle}>AIと対話しながら、大切なことを書き残しましょう</p>
          </div>

          {/* 進捗バー */}
          <div style={styles.progressCard}>
            <p style={styles.progressLabel}>入力済みカテゴリ</p>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${(savedCategories.length / 4) * 100}%`
              }} />
            </div>
            <p style={styles.progressText}>{savedCategories.length} / 4 カテゴリ完了</p>
          </div>

          {/* カテゴリカード */}
          <div style={styles.grid}>
            {CATEGORIES.map(cat => {
              const isDone = savedCategories.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => startCategory(cat.key)}
                  style={{
                    ...styles.card,
                    background: isDone ? cat.color : cat.bg,
                    border: `2px solid ${cat.color}`,
                  }}
                >
                  {isDone && <span style={styles.doneBadge}>✅ 入力済み</span>}
                  <span style={styles.cardIcon}>{cat.icon}</span>
                  <span style={{
                    ...styles.cardLabel,
                    color: isDone ? 'white' : cat.color,
                  }}>{cat.label}</span>
                  <span style={{
                    ...styles.cardDesc,
                    color: isDone ? 'rgba(255,255,255,0.85)' : '#666',
                  }}>{cat.desc}</span>
                </button>
              );
            })}
          </div>

          <p style={styles.note}>
            ※ 各カテゴリをタップするとAIとの対話が始まります。<br />
            いつでも中断・再開できます。
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // チャット画面
  // ============================================================
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* チャットヘッダー */}
        <div style={{
          ...styles.chatHeader,
          background: categoryInfo?.color || '#4A90D9',
        }}>
          <button onClick={() => setSelectedCategory(null)} style={styles.chatBackBtn}>
            ← 戻る
          </button>
          <div>
            <p style={styles.chatHeaderIcon}>{categoryInfo?.icon}</p>
            <p style={styles.chatHeaderLabel}>{categoryInfo?.label}</p>
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* メッセージ一覧 */}
        <div style={styles.chatArea}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              ...styles.msgRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'assistant' && (
                <div style={styles.avatar}>🤖</div>
              )}
              <div style={{
                ...styles.bubble,
                background: msg.role === 'user'
                  ? (categoryInfo?.color || '#4A90D9')
                  : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                marginLeft: msg.role === 'user' ? 'auto' : 0,
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
              <div style={styles.avatar}>🤖</div>
              <div style={{ ...styles.bubble, background: 'white', border: '1px solid #e0e0e0' }}>
                <span style={styles.typing}>考えています</span>
                <span style={styles.dot1}>●</span>
                <span style={styles.dot2}>●</span>
                <span style={styles.dot3}>●</span>
              </div>
            </div>
          )}

          {/* 終了メッセージ */}
          {finished && !loading && (
            <div style={styles.finishCard}>
              <p style={styles.finishText}>
                🎉 このカテゴリの入力が完了しました！<br />
                内容を保存しますか？
              </p>
              <button onClick={saveNotes} style={{
                ...styles.saveBtn,
                background: categoryInfo?.color || '#4A90D9',
              }}>
                💾 保存する
              </button>
              {saveMsg && <p style={styles.saveMsg}>{saveMsg}</p>}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        {!finished && (
          <div style={styles.inputArea}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="ここに入力してください（Enterで送信）"
              disabled={loading}
              style={styles.textarea}
            />
            <button
              onClick={toggleListening}
              disabled={loading}
              style={{
                ...styles.micBtn,
                background: isListening ? '#e74c3c' : '#f0f0f0',
                color: isListening ? 'white' : '#555',
              }}
              title={isListening ? '音声入力停止' : '音声で入力'}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                background: (!loading && input.trim())
                  ? (categoryInfo?.color || '#4A90D9')
                  : '#ccc',
              }}
            >
              送信
            </button>
          </div>
        )}

        {/* 途中保存ボタン */}
        {!finished && qaPairs.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <button onClick={saveNotes} style={styles.midSaveBtn}>
              💾 途中で保存する
            </button>
            {saveMsg && <p style={styles.saveMsg}>{saveMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// スタイル定義
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F8F9FA',
    fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    paddingBottom: 40,
  },
  header: {
    padding: '24px 20px 16px',
    textAlign: 'center',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    margin: 0,
  },
  progressCard: {
    margin: '0 16px 20px',
    background: 'white',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  progressLabel: {
    fontSize: 13,
    color: '#888',
    margin: '0 0 8px',
  },
  progressBar: {
    height: 8,
    background: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4A90D9, #27AE60)',
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontSize: 13,
    color: '#555',
    margin: 0,
    textAlign: 'right',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '0 16px',
    marginBottom: 16,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 12px',
    borderRadius: 16,
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.15s ease',
    textAlign: 'center',
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 11,
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: '2px 6px',
    color: 'white',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    padding: '0 20px',
    lineHeight: 1.8,
  },
  // チャット
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    color: 'white',
  },
  chatBackBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    width: 60,
  },
  chatHeaderIcon: {
    fontSize: 28,
    margin: '0 0 2px',
    textAlign: 'center',
  },
  chatHeaderLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    margin: 0,
    textAlign: 'center',
  },
  chatArea: {
    minHeight: 400,
    maxHeight: '60vh',
    overflowY: 'auto',
    padding: '16px',
    background: '#F0F4F8',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  bubble: {
    maxWidth: '78%',
    padding: '12px 16px',
    borderRadius: 16,
    fontSize: 16,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  typing: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  dot1: { animation: 'blink 1.2s infinite 0s', fontSize: 8, color: '#aaa' },
  dot2: { animation: 'blink 1.2s infinite 0.2s', fontSize: 8, color: '#aaa' },
  dot3: { animation: 'blink 1.2s infinite 0.4s', fontSize: 8, color: '#aaa' },
  finishCard: {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  finishText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 1.8,
    marginBottom: 16,
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  saveMsg: {
    marginTop: 10,
    fontSize: 15,
    color: '#27AE60',
    textAlign: 'center',
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    background: 'white',
    borderTop: '1px solid #eee',
  },
  textarea: {
    flex: 1,
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #ddd',
    fontSize: 16,
    resize: 'none',
    height: 60,
    fontFamily: 'inherit',
  },
  micBtn: {
    padding: '0 14px',
    borderRadius: 10,
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  sendBtn: {
    padding: '0 20px',
    borderRadius: 10,
    border: 'none',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  midSaveBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #ccc',
    background: 'white',
    color: '#555',
    fontSize: 15,
    cursor: 'pointer',
  },
};
