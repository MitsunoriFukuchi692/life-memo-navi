import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  reaction: string;
  question: string;
  category: string;
  isDeepDive: boolean;
}

interface HistoryItem {
  category: string;
  question: string;
  answer: string;
}

const TypingText = ({ text, onDone }: { text: string; onDone?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + text[idx]);
        setIdx((i) => i + 1);
      }, 35);
      return () => clearTimeout(t);
    } else {
      onDone?.();
    }
  }, [idx, text]);

  return <span>{displayed}<span style={styles.cursor}>|</span></span>;
};

export default function AIInterview() {
  const [phase, setPhase] = useState<'intro' | 'question' | 'thinking' | 'answered' | 'complete'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentReaction, setCurrentReaction] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const MAX_QUESTIONS = 8;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchAIResponse = async (userAnswer?: string) => {
    setPhase('thinking');
    setError('');
    try {
      const body = userAnswer
        ? { messages, userAnswer, isFirst: false }
        : { isFirst: true };

      const res = await fetch(`${API_BASE}/api/ai-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('通信エラー');
      const data: AIResponse = await res.json();

      // メッセージ履歴を更新
      if (userAnswer) {
        const newMessages: Message[] = [
          ...messages,
          { role: 'user', content: userAnswer },
          { role: 'assistant', content: data.question },
        ];
        setMessages(newMessages);
      } else {
        setMessages([{ role: 'assistant', content: data.question }]);
      }

      setCurrentReaction(data.reaction);
      setCurrentQuestion(data.question);
      setCurrentCategory(data.category);
      setPhase('question');
      setTyping(true);
    } catch (e) {
      setError('AIとの通信に失敗しました。もう一度お試しください。');
      setPhase(questionCount === 0 ? 'intro' : 'question');
    }
  };

  const handleStart = () => {
    fetchAIResponse();
  };

  const handleAnswer = () => {
    if (!answer.trim()) return;

    // 履歴に保存
    setHistory((h) => [
      ...h,
      { category: currentCategory, question: currentQuestion, answer },
    ]);
    setQuestionCount((c) => c + 1);
    setPhase('answered');
  };

  const handleNext = () => {
    if (questionCount >= MAX_QUESTIONS) {
      setPhase('complete');
    } else {
      const prevAnswer = answer;
      setAnswer('');
      fetchAIResponse(prevAnswer);
    }
  };

  const handleComplete = () => {
    setPhase('complete');
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('このブラウザは音声入力に対応していません。Chromeをお使いください。');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAnswer((a) => a + (a ? '　' : '') + transcript);
    };
    recognition.start();
  };

  const progressPercent = Math.round((questionCount / MAX_QUESTIONS) * 100);

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>📖 ライフ・メモナビ</div>
        <div style={styles.headerRight}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
          <div style={styles.progressText}>{questionCount} / {MAX_QUESTIONS} 問</div>
        </div>
      </div>

      <div style={styles.body}>

        {/* Character + Bubble */}
        <div style={styles.characterArea}>
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatar, ...(phase === 'thinking' ? { animation: 'pulse 1s infinite' } : {}) }}>
              <span style={styles.avatarEmoji}>{phase === 'thinking' ? '💭' : '🌸'}</span>
            </div>
            <div style={styles.characterName}>メモちゃん</div>
          </div>

          <div style={styles.bubbleWrap}>
            <div style={styles.bubble}>
              {phase === 'intro' && (
                <p style={styles.bubbleText}>
                  こんにちは！わたしはメモちゃんです🌸<br />
                  あなたの大切な思い出を、いっしょに残しましょう。<br />
                  質問に答えるだけで大丈夫ですよ。
                </p>
              )}
              {phase === 'thinking' && (
                <p style={styles.bubbleText}>
                  <span style={styles.thinkingDots}>考えています</span>
                </p>
              )}
              {(phase === 'question' || phase === 'answered') && (
                <div>
                  {currentReaction && (
                    <p style={styles.reactionText}>
                      {currentReaction}
                    </p>
                  )}
                  <p style={styles.bubbleText}>
                    {typing
                      ? <TypingText text={currentQuestion} onDone={() => setTyping(false)} />
                      : currentQuestion
                    }
                  </p>
                </div>
              )}
              {phase === 'complete' && (
                <p style={styles.bubbleText}>
                  たくさん話してくれてありがとう🎉<br />
                  すてきな思い出がたくさん集まりましたね。<br />
                  記事にまとめますね！
                </p>
              )}
              <div style={styles.bubbleTail} />
            </div>
            {currentCategory && phase !== 'intro' && phase !== 'complete' && (
              <div style={styles.categoryBadge}>{currentCategory}</div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Intro */}
        {phase === 'intro' && (
          <div style={styles.centerArea}>
            <button style={styles.startBtn} onClick={handleStart} className="hoverBtn">
              🎤　インタビューをはじめる
            </button>
            <p style={styles.hint}>ボタンを押して、メモちゃんとお話しましょう</p>
          </div>
        )}

        {/* Thinking */}
        {phase === 'thinking' && (
          <div style={styles.centerArea}>
            <p style={styles.hint}>メモちゃんが次の質問を考えています…</p>
          </div>
        )}

        {/* Question */}
        {phase === 'question' && (
          <div style={styles.answerArea} className="fadeIn">
            <label style={styles.label}>あなたの答えを教えてください</label>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="ここに入力してください…"
              rows={5}
            />
            <div style={styles.btnRow}>
              <button
                style={{ ...styles.voiceBtn, ...(listening ? styles.voiceBtnActive : {}) }}
                onClick={toggleListening}
              >
                {listening ? '🔴 録音中...' : '🎤 声で入力'}
              </button>
              <button
                style={{ ...styles.sendBtn, ...(!answer.trim() ? styles.sendBtnDisabled : {}) }}
                onClick={handleAnswer}
                disabled={!answer.trim()}
              >
                保存する ✓
              </button>
            </div>
            {questionCount >= MAX_QUESTIONS - 1 && (
              <button style={styles.completeBtn} onClick={handleComplete}>
                まとめを見る →
              </button>
            )}
          </div>
        )}

        {/* Answered */}
        {phase === 'answered' && (
          <div style={styles.answeredArea} className="fadeIn">
            <div style={styles.answeredCard}>
              <div style={styles.answeredLabel}>✍️ あなたの答え</div>
              <p style={styles.answeredText}>{history[history.length - 1]?.answer}</p>
            </div>
            <button style={styles.nextBtn} onClick={handleNext} className="hoverBtn">
              {questionCount >= MAX_QUESTIONS ? '🎉 まとめを見る' : '次の質問へ →'}
            </button>
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <div style={styles.completeArea} className="fadeIn">
            <div style={styles.completeCard}>
              <h2 style={styles.completeTitle}>📚 あなたの思い出エピソード</h2>
              {history.map((h, i) => (
                <div key={i} style={styles.episodeItem}>
                  <div style={styles.episodeBadge}>{h.category}</div>
                  <p style={styles.episodeQ}>{h.question}</p>
                  <p style={styles.episodeA}>{h.answer}</p>
                </div>
              ))}
              <button style={styles.articleBtn}>✨ 記事として保存する</button>
            </div>
          </div>
        )}

        {history.length > 0 && phase !== 'complete' && (
          <div style={styles.historyHint}>
            💬 {history.length}件の思い出を記録しました
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #fdf6ec 0%, #fef9f3 50%, #fff8f0 100%)',
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    color: '#3d2c1e',
  },
  header: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderBottom: '2px solid #f0d5b8',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#c06030', letterSpacing: '0.05em' },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  progressBar: { width: '160px', height: '8px', background: '#f0d5b8', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #e8804a, #c05828)', borderRadius: '10px', transition: 'width 0.5s ease' },
  progressText: { fontSize: '13px', color: '#a07050' },
  body: { maxWidth: '700px', margin: '0 auto', padding: '32px 20px 60px' },
  characterArea: { display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' },
  avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 },
  avatar: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #ffe0c8, #ffc4a0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(200,100,50,0.2)', border: '3px solid #fff',
  },
  avatarEmoji: { fontSize: '34px' },
  characterName: { fontSize: '13px', color: '#c06030', fontWeight: 'bold' },
  bubbleWrap: { flex: 1, position: 'relative' },
  bubble: {
    background: '#fff', borderRadius: '4px 20px 20px 20px',
    padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1.5px solid #f0d5b8', position: 'relative',
  },
  reactionText: { fontSize: '16px', color: '#a07050', marginBottom: '10px', fontStyle: 'italic' },
  bubbleText: { fontSize: '20px', lineHeight: '1.8', margin: 0, color: '#3d2c1e' },
  bubbleTail: {
    position: 'absolute', left: '-10px', top: '20px',
    width: 0, height: 0,
    borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
    borderRight: '10px solid #f0d5b8',
  },
  categoryBadge: {
    display: 'inline-block', marginTop: '10px',
    background: '#ffebd8', color: '#c06030',
    padding: '3px 12px', borderRadius: '20px',
    fontSize: '13px', fontWeight: 'bold',
  },
  centerArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' },
  startBtn: {
    background: 'linear-gradient(135deg, #e8804a, #c05828)',
    color: '#fff', border: 'none', borderRadius: '50px',
    padding: '20px 56px', fontSize: '22px', fontWeight: 'bold',
    cursor: 'pointer', boxShadow: '0 6px 24px rgba(200,90,40,0.35)',
    letterSpacing: '0.08em',
  },
  hint: { color: '#a07050', fontSize: '15px' },
  thinkingDots: { color: '#a07050' },
  answerArea: { display: 'flex', flexDirection: 'column', gap: '14px' },
  label: { fontSize: '16px', color: '#a07050', fontWeight: 'bold' },
  textarea: {
    width: '100%', border: '2px solid #f0d5b8', borderRadius: '16px',
    padding: '18px', fontSize: '19px', lineHeight: '1.9',
    background: '#fffdf9', color: '#3d2c1e', resize: 'vertical',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  btnRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  voiceBtn: {
    flex: 1, background: '#fff', border: '2px solid #f0d5b8',
    borderRadius: '50px', padding: '16px 24px', fontSize: '18px',
    cursor: 'pointer', color: '#c06030', fontWeight: 'bold',
  },
  voiceBtnActive: { background: '#fff0e8', borderColor: '#e8804a' },
  sendBtn: {
    flex: 2, background: 'linear-gradient(135deg, #e8804a, #c05828)',
    color: '#fff', border: 'none', borderRadius: '50px',
    padding: '16px 32px', fontSize: '20px', fontWeight: 'bold',
    cursor: 'pointer', boxShadow: '0 4px 16px rgba(200,90,40,0.3)',
  },
  sendBtnDisabled: { background: '#ddd', boxShadow: 'none', cursor: 'not-allowed' },
  completeBtn: {
    background: 'transparent', border: '2px solid #e8804a',
    color: '#c06030', borderRadius: '50px', padding: '12px 28px',
    fontSize: '17px', cursor: 'pointer', alignSelf: 'flex-end',
  },
  errorBox: {
    background: '#fff0f0', border: '1px solid #ffaaaa',
    borderRadius: '12px', padding: '14px 20px',
    color: '#c04040', fontSize: '16px', marginBottom: '16px',
  },
  answeredArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
  answeredCard: {
    background: '#fff', border: '2px solid #d4e8c8',
    borderRadius: '16px', padding: '20px 24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  answeredLabel: { fontSize: '14px', color: '#6a9e5a', fontWeight: 'bold', marginBottom: '10px' },
  answeredText: { fontSize: '18px', lineHeight: '1.8', margin: 0, color: '#3d2c1e' },
  nextBtn: {
    background: 'linear-gradient(135deg, #6ab04c, #4a8e3a)',
    color: '#fff', border: 'none', borderRadius: '50px',
    padding: '18px 40px', fontSize: '20px', fontWeight: 'bold',
    cursor: 'pointer', boxShadow: '0 4px 16px rgba(80,150,60,0.3)',
    alignSelf: 'center',
  },
  completeArea: { display: 'flex', flexDirection: 'column' },
  completeCard: {
    background: '#fff', borderRadius: '20px', padding: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '2px solid #f0d5b8',
  },
  completeTitle: { fontSize: '22px', color: '#c06030', marginBottom: '24px', borderBottom: '2px dashed #f0d5b8', paddingBottom: '16px' },
  episodeItem: { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f5e8d8' },
  episodeBadge: { display: 'inline-block', background: '#ffebd8', color: '#c06030', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' },
  episodeQ: { fontSize: '14px', color: '#a07050', margin: '0 0 6px' },
  episodeA: { fontSize: '17px', lineHeight: '1.8', color: '#3d2c1e', margin: 0 },
  articleBtn: {
    width: '100%', background: 'linear-gradient(135deg, #e8804a, #c05828)',
    color: '#fff', border: 'none', borderRadius: '50px',
    padding: '18px', fontSize: '20px', fontWeight: 'bold',
    cursor: 'pointer', marginTop: '16px',
  },
  historyHint: { textAlign: 'center', color: '#a07050', fontSize: '14px', marginTop: '20px', padding: '10px', background: '#ffebd8', borderRadius: '50px' },
  cursor: { animation: 'blink 0.8s steps(1) infinite' },
};

const css = `
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes thinking { 0%{opacity:0.3} 50%{opacity:1} 100%{opacity:0.3} }
  .fadeIn { animation: fadeIn 0.4s ease forwards; }
  .hoverBtn:hover { transform: scale(1.04); filter: brightness(1.05); }
  textarea:focus { border-color: #e8804a !important; }
`;
