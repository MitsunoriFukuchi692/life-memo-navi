import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com';

const JIBUNSHI_QUESTIONS = [
  "あなたの生まれた時代はどんな時代でしたか？",
  "生まれた場所と、幼い頃の思い出は？",
  "家族について教えてください",
  "学生時代の思い出は？",
  "最初の職場での経験は？",
  "人生での大きな決断は？",
  "仕事でやりがいを感じたことは？",
  "人生で出会った大切な人は？",
  "趣味や好きなことは？",
  "人生での失敗や試練は？",
  "それらからどう学びましたか？",
  "今、大切にしていることは？",
  "家族や後世代に伝えたいことは？",
  "人生で一番幸せだった時は？",
  "未来へのメッセージは？"
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  reaction: string;
  question: string;
  questionId: number;
  questionText: string;
  isDeepDive: boolean;
  moveToNext: boolean;
}

// question_idごとに回答を蓄積する
interface AnswerMap {
  [questionId: number]: string[];
}

const TypingText = ({ text, onDone }: { text: string; onDone?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => { setDisplayed(''); setIdx(0); }, [text]);
  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + text[idx]);
        setIdx((i) => i + 1);
      }, 30);
      return () => clearTimeout(t);
    } else { onDone?.(); }
  }, [idx, text]);

  return <span>{displayed}<span style={styles.cursor}>|</span></span>;
};

const showaToSeireki = (n: number) => n + 1925;
const taishoToSeireki = (n: number) => n + 1911;
const heiseiToSeireki = (n: number) => n + 1988;

export default function AIInterview() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'loading' | 'intro' | 'resume' | 'birthYear' | 'question' | 'thinking' | 'answered' | 'complete'>('loading');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthYearInput, setBirthYearInput] = useState('');
  const [eraType, setEraType] = useState<'showa' | 'taisho' | 'heisei' | 'seireki'>('showa');
  const [birthYearError, setBirthYearError] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentReaction, setCurrentReaction] = useState('');
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [answer, setAnswer] = useState('');
  const [answerMap, setAnswerMap] = useState<AnswerMap>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [resumeQuestionId, setResumeQuestionId] = useState(1);
  const [previousAnswer, setPreviousAnswer] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 起動時：既存の回答を読み込んで途中再開チェック
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setPhase('intro'); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload?.userId || payload?.id;
        if (!userId) { setPhase('intro'); return; }

        const res = await fetch(`${API_BASE}/interviews/${userId}?field_type=jibunshi`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setPhase('intro'); return; }
        const rows = await res.json();

        if (!rows || rows.length === 0) {
          setPhase('intro');
          return;
        }

        // 既存回答をanswerMapに復元
        const loaded: AnswerMap = {};
        let maxQId = 0;
        for (const row of rows) {
          if (row.answer_text) {
            loaded[row.question_id] = [row.answer_text];
            if (row.question_id > maxQId) maxQId = row.question_id;
          }
        }
        setAnswerMap(loaded);

        // 次に答えるべき質問IDを特定
        const nextQId = Math.min(maxQId + 1, 15);
        setResumeQuestionId(nextQId);
        setPreviousAnswer(loaded[maxQId]?.[0] || '');
        setCurrentQuestionId(nextQId);

        if (maxQId >= 15) {
          setPhase('complete');
        } else {
          setPhase('resume');
        }
      } catch {
        setPhase('intro');
      }
    };
    loadExisting();
  }, []);

  // 回答を即時自動保存
  const autoSave = async (qId: number, answerText: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userId = payload?.userId || payload?.id;
      if (!userId) return;

      await fetch(`${API_BASE}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          question_id: qId,
          question_text: JIBUNSHI_QUESTIONS[qId - 1],
          answer_text: answerText,
          field_type: 'jibunshi',
        }),
      });
    } catch (e) {
      console.error('自動保存エラー:', e);
    }
  };

  const calcBirthYear = (): number | null => {
    const num = parseInt(birthYearInput);
    if (isNaN(num)) return null;
    switch (eraType) {
      case 'showa': return showaToSeireki(num);
      case 'taisho': return taishoToSeireki(num);
      case 'heisei': return heiseiToSeireki(num);
      default: return num;
    }
  };

  const handleBirthYearSubmit = () => {
    const year = calcBirthYear();
    if (!year || year < 1900 || year > 2010) {
      setBirthYearError('正しい年を入力してください');
      return;
    }
    setBirthYearError('');
    setBirthYear(year);
    fetchAIResponse(undefined, 1, year);
  };

  const fetchAIResponse = async (userAnswer?: string, qId?: number, byYear?: number) => {
    setPhase('thinking');
    setError('');
    const useQId = qId ?? currentQuestionId;
    const useBirthYear = byYear ?? birthYear;

    try {
      const body = userAnswer
        ? { messages, userAnswer, isFirst: false, questionId: useQId, birthYear: useBirthYear }
        : { isFirst: true, questionId: 1, birthYear: useBirthYear };

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
      setCurrentQuestionId(data.questionId);
      setPhase('question');
      setTyping(true);
    } catch (e) {
      setError('AIとの通信に失敗しました。もう一度お試しください。');
      setPhase(currentQuestionId === 1 && !userAnswer ? 'birthYear' : 'question');
    }
  };

  const handleStart = () => setPhase('birthYear');

  const handleAnswer = () => {
    if (!answer.trim()) return;
    const combined = [...(answerMap[currentQuestionId] || []), answer].join('\n\n');
    setAnswerMap((prev) => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), answer],
    }));
    // 自動保存
    autoSave(currentQuestionId, combined);
    setPhase('answered');
  };

  const handleNext = () => {
    const prevAnswer = answer;
    setAnswer('');
    if (currentQuestionId >= 15) {
      setPhase('complete');
    } else {
      fetchAIResponse(prevAnswer, currentQuestionId);
    }
  };

  const handleComplete = () => setPhase('complete');

  // 自分史に保存（question_idごとの回答をまとめて転記）
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userId = payload?.userId || payload?.id;
      if (!userId) throw new Error('ログインが必要です');

      for (let qId = 1; qId <= 15; qId++) {
        const answers = answerMap[qId];
        if (!answers || answers.length === 0) continue;
        const combinedAnswer = answers.join('\n\n');
        await fetch(`${API_BASE}/api/interviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            question_id: qId,
            question_text: JIBUNSHI_QUESTIONS[qId - 1],
            answer_text: combinedAnswer,
            field_type: 'jibunshi',
          }),
        });
      }
      navigate('/interview');
    } catch (e: any) {
      setSaveError(e.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('このブラウザは音声入力に対応していません。Chromeをお使いください。');
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const t = event.results[0][0].transcript;
      setAnswer((a) => a + (a ? '　' : '') + t);
    };
    recognition.start();
  };

  const progressPercent = Math.round((currentQuestionId - 1) / 15 * 100);
  const birthYearDisplay = birthYear
    ? (birthYear >= 1989 ? `平成${birthYear - 1988}` : birthYear >= 1926 ? `昭和${birthYear - 1925}` : `大正${birthYear - 1911}`) + `年（${birthYear}年）生まれ`
    : '';

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>📖 ライフ・メモナビ</div>
        <div style={styles.headerRight}>
          {birthYear && <div style={styles.birthTag}>🎂 {birthYearDisplay}</div>}
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
          <div style={styles.progressText}>
            {phase === 'complete' ? '完了🎉' : `第${currentQuestionId}問 / 15問`}
          </div>
        </div>
      </div>

      <div style={styles.body}>

        {/* キャラクター＋吹き出し */}
        <div style={styles.characterArea}>
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatar, ...(phase === 'thinking' ? { animation: 'pulse 1s infinite' } : {}) }}>
              <span style={styles.avatarEmoji}>{phase === 'thinking' ? '💭' : '🌸'}</span>
            </div>
            <div style={styles.characterName}>メモちゃん</div>
          </div>
          <div style={styles.bubbleWrap}>
            <div style={styles.bubble}>
              {phase === 'loading' && (
                <p style={styles.bubbleText}>読み込んでいます…</p>
              )}
              {phase === 'intro' && (
                <p style={styles.bubbleText}>
                  こんにちは！わたしはメモちゃんです🌸<br />
                  あなたの大切な人生の記録を、いっしょに残しましょう。<br />
                  質問に答えるだけで自分史ができあがりますよ。
                </p>
              )}
              {phase === 'resume' && (
                <p style={styles.bubbleText}>
                  おかえりなさい😊🌸<br />
                  前回の続きから再開しましょう！<br />
                  <span style={{ fontSize: '16px', color: '#a07050' }}>
                    Q{resumeQuestionId}「{JIBUNSHI_QUESTIONS[resumeQuestionId - 1]}」からですね。
                  </span>
                </p>
              )}
              {phase === 'birthYear' && (
                <p style={styles.bubbleText}>
                  あなたは何年生まれですか？😊<br />
                  <span style={{ fontSize: '16px', color: '#a07050' }}>
                    生まれた時代に合わせて、その頃の出来事をヒントにお話しますね♪
                  </span>
                </p>
              )}
              {phase === 'thinking' && (
                <p style={styles.bubbleText}><span style={styles.thinkingDots}>考えています…</span></p>
              )}
              {(phase === 'question' || phase === 'answered') && (
                <div>
                  {currentReaction && <p style={styles.reactionText}>{currentReaction}</p>}
                  <p style={styles.bubbleText}>
                    {typing
                      ? <TypingText text={currentQuestion} onDone={() => setTyping(false)} />
                      : currentQuestion}
                  </p>
                </div>
              )}
              {phase === 'complete' && (
                <p style={styles.bubbleText}>
                  全部答えてくれてありがとう🎉<br />
                  すてきな自分史になりましたね！<br />
                  下のボタンで自分史に保存しましょう。
                </p>
              )}
              <div style={styles.bubbleTail} />
            </div>
            {phase !== 'intro' && phase !== 'resume' && phase !== 'birthYear' && phase !== 'complete' && phase !== 'thinking' && phase !== 'loading' && (
              <div style={styles.questionBadge}>
                Q{currentQuestionId}. {JIBUNSHI_QUESTIONS[currentQuestionId - 1]}
              </div>
            )}
          </div>
        </div>

        {/* エラー */}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {/* ローディング */}
        {phase === 'loading' && (
          <div style={styles.centerArea}>
            <p style={styles.hint}>データを読み込んでいます…</p>
          </div>
        )}

        {/* 再開確認 */}
        {phase === 'resume' && (
          <div style={styles.resumeArea} className="fadeIn">
            {previousAnswer && (
              <div style={styles.resumePrevCard}>
                <div style={styles.resumePrevLabel}>📝 前回のQ{resumeQuestionId - 1}の答え</div>
                <p style={styles.resumePrevText}>{previousAnswer}</p>
              </div>
            )}
            <div style={styles.resumeBtnRow}>
              <button
                style={styles.startBtn}
                onClick={() => fetchAIResponse(undefined, resumeQuestionId, birthYear ?? undefined)}
                className="hoverBtn"
              >
                続きからはじめる →
              </button>
              <button
                style={styles.restartBtn}
                onClick={() => { setAnswerMap({}); setCurrentQuestionId(1); setPhase('birthYear'); }}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        )}

        {/* イントロ */}
        {phase === 'intro' && (
          <div style={styles.centerArea}>
            <button style={styles.startBtn} onClick={handleStart} className="hoverBtn">
              🎤　インタビューをはじめる
            </button>
            <p style={styles.hint}>ボタンを押して、メモちゃんとお話しましょう</p>
          </div>
        )}

        {/* 生まれ年入力 */}
        {phase === 'birthYear' && (
          <div style={styles.birthYearArea} className="fadeIn">
            <div style={styles.eraSelector}>
              {(['showa', 'taisho', 'heisei', 'seireki'] as const).map((era) => (
                <button
                  key={era}
                  style={{ ...styles.eraBtn, ...(eraType === era ? styles.eraBtnActive : {}) }}
                  onClick={() => { setEraType(era); setBirthYearInput(''); }}
                >
                  {era === 'showa' ? '昭和' : era === 'taisho' ? '大正' : era === 'heisei' ? '平成' : '西暦'}
                </button>
              ))}
            </div>
            <div style={styles.birthYearInputRow}>
              <input
                type="number"
                style={styles.birthYearInput}
                value={birthYearInput}
                onChange={(e) => setBirthYearInput(e.target.value)}
                placeholder={eraType === 'seireki' ? '例：1945' : eraType === 'showa' ? '例：20' : eraType === 'taisho' ? '例：10' : '例：5'}
                onKeyDown={(e) => e.key === 'Enter' && handleBirthYearSubmit()}
              />
              <span style={styles.birthYearUnit}>年</span>
            </div>
            {birthYearInput && !isNaN(parseInt(birthYearInput)) && (
              <div style={styles.birthYearPreview}>西暦 {calcBirthYear()}年生まれ</div>
            )}
            {birthYearError && <p style={styles.birthYearErrorText}>{birthYearError}</p>}
            <button
              style={{ ...styles.startBtn, fontSize: '20px', padding: '16px 48px' }}
              onClick={handleBirthYearSubmit}
              className="hoverBtn"
            >
              インタビューをスタート 🌸
            </button>
            <button style={styles.skipBtn} onClick={() => { setBirthYear(null); fetchAIResponse(undefined, 1, undefined); }}>
              生まれ年をとばしてはじめる
            </button>
          </div>
        )}

        {/* 考え中 */}
        {phase === 'thinking' && (
          <div style={styles.centerArea}>
            <p style={styles.hint}>メモちゃんが次の質問を考えています…</p>
          </div>
        )}

        {/* 回答入力 */}
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
            {currentQuestionId >= 14 && (
              <button style={styles.completeBtn} onClick={handleComplete}>
                まとめを見る →
              </button>
            )}
          </div>
        )}

        {/* 答えた後 */}
        {phase === 'answered' && (
          <div style={styles.answeredArea} className="fadeIn">
            <div style={styles.answeredCard}>
              <div style={styles.answeredLabel}>✍️ あなたの答え</div>
              <p style={styles.answeredText}>{answer}</p>
            </div>
            <button style={styles.nextBtn} onClick={handleNext} className="hoverBtn">
              {currentQuestionId >= 15 ? '🎉 まとめを見る' : '次の質問へ →'}
            </button>
          </div>
        )}

        {/* 完了 */}
        {phase === 'complete' && (
          <div style={styles.completeArea} className="fadeIn">
            <div style={styles.completeCard}>
              <h2 style={styles.completeTitle}>📚 あなたの自分史まとめ</h2>
              {JIBUNSHI_QUESTIONS.map((q, i) => {
                const qId = i + 1;
                const answers = answerMap[qId];
                if (!answers || answers.length === 0) return null;
                return (
                  <div key={qId} style={styles.episodeItem}>
                    <div style={styles.episodeBadge}>Q{qId}</div>
                    <p style={styles.episodeQ}>{q}</p>
                    <p style={styles.episodeA}>{answers.join('\n\n')}</p>
                  </div>
                );
              })}
              <button style={styles.articleBtn} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '✨ 自分史に保存する'}
              </button>
              {saveError && (
                <p style={{ color: '#c04040', fontSize: '15px', textAlign: 'center', marginTop: '8px' }}>{saveError}</p>
              )}
            </div>
          </div>
        )}

        {Object.keys(answerMap).length > 0 && phase !== 'complete' && (
          <div style={styles.historyHint}>
            💬 {Object.keys(answerMap).length}テーマの思い出を記録しました
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: 'linear-gradient(145deg, #fdf6ec 0%, #fef9f3 50%, #fff8f0 100%)', fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif", color: '#3d2c1e' },
  header: { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderBottom: '2px solid #f0d5b8', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#c06030' },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  birthTag: { fontSize: '13px', color: '#c06030', fontWeight: 'bold', background: '#ffebd8', padding: '2px 10px', borderRadius: '20px' },
  progressBar: { width: '160px', height: '8px', background: '#f0d5b8', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #e8804a, #c05828)', borderRadius: '10px', transition: 'width 0.5s ease' },
  progressText: { fontSize: '13px', color: '#a07050' },
  body: { maxWidth: '700px', margin: '0 auto', padding: '32px 20px 60px' },
  characterArea: { display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' },
  avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffe0c8, #ffc4a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(200,100,50,0.2)', border: '3px solid #fff' },
  avatarEmoji: { fontSize: '34px' },
  characterName: { fontSize: '13px', color: '#c06030', fontWeight: 'bold' },
  bubbleWrap: { flex: 1 },
  bubble: { background: '#fff', borderRadius: '4px 20px 20px 20px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1.5px solid #f0d5b8', position: 'relative' },
  reactionText: { fontSize: '16px', color: '#a07050', marginBottom: '10px', fontStyle: 'italic' },
  bubbleText: { fontSize: '20px', lineHeight: '1.8', margin: 0, color: '#3d2c1e' },
  bubbleTail: { position: 'absolute', left: '-10px', top: '20px', width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid #f0d5b8' },
  questionBadge: { marginTop: '10px', background: '#ffebd8', color: '#c06030', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.6' },
  thinkingDots: { color: '#a07050' },
  centerArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' },
  startBtn: { background: 'linear-gradient(135deg, #e8804a, #c05828)', color: '#fff', border: 'none', borderRadius: '50px', padding: '20px 56px', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 24px rgba(200,90,40,0.35)' },
  hint: { color: '#a07050', fontSize: '15px' },
  birthYearArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' },
  eraSelector: { display: 'flex', gap: '8px' },
  eraBtn: { padding: '10px 20px', borderRadius: '30px', fontSize: '18px', border: '2px solid #f0d5b8', background: '#fff', cursor: 'pointer', color: '#a07050', fontWeight: 'bold' },
  eraBtnActive: { background: 'linear-gradient(135deg, #e8804a, #c05828)', color: '#fff', border: '2px solid #c05828' },
  birthYearInputRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  birthYearInput: { width: '140px', padding: '14px 18px', fontSize: '28px', border: '2px solid #f0d5b8', borderRadius: '16px', textAlign: 'center', color: '#3d2c1e', outline: 'none', background: '#fffdf9' },
  birthYearUnit: { fontSize: '24px', color: '#3d2c1e', fontWeight: 'bold' },
  birthYearPreview: { fontSize: '16px', color: '#c06030', fontWeight: 'bold', background: '#ffebd8', padding: '6px 20px', borderRadius: '20px' },
  birthYearErrorText: { color: '#c04040', fontSize: '15px', margin: 0 },
  skipBtn: { background: 'transparent', border: 'none', color: '#a07050', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' },
  answerArea: { display: 'flex', flexDirection: 'column', gap: '14px' },
  label: { fontSize: '16px', color: '#a07050', fontWeight: 'bold' },
  textarea: { width: '100%', border: '2px solid #f0d5b8', borderRadius: '16px', padding: '18px', fontSize: '19px', lineHeight: '1.9', background: '#fffdf9', color: '#3d2c1e', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  voiceBtn: { flex: 1, background: '#fff', border: '2px solid #f0d5b8', borderRadius: '50px', padding: '16px 24px', fontSize: '18px', cursor: 'pointer', color: '#c06030', fontWeight: 'bold' },
  voiceBtnActive: { background: '#fff0e8', borderColor: '#e8804a' },
  sendBtn: { flex: 2, background: 'linear-gradient(135deg, #e8804a, #c05828)', color: '#fff', border: 'none', borderRadius: '50px', padding: '16px 32px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(200,90,40,0.3)' },
  sendBtnDisabled: { background: '#ddd', boxShadow: 'none', cursor: 'not-allowed' },
  completeBtn: { background: 'transparent', border: '2px solid #e8804a', color: '#c06030', borderRadius: '50px', padding: '12px 28px', fontSize: '17px', cursor: 'pointer', alignSelf: 'flex-end' },
  errorBox: { background: '#fff0f0', border: '1px solid #ffaaaa', borderRadius: '12px', padding: '14px 20px', color: '#c04040', fontSize: '16px', marginBottom: '16px' },
  answeredArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
  answeredCard: { background: '#fff', border: '2px solid #d4e8c8', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
  answeredLabel: { fontSize: '14px', color: '#6a9e5a', fontWeight: 'bold', marginBottom: '10px' },
  answeredText: { fontSize: '18px', lineHeight: '1.8', margin: 0, color: '#3d2c1e', whiteSpace: 'pre-wrap' },
  nextBtn: { background: 'linear-gradient(135deg, #6ab04c, #4a8e3a)', color: '#fff', border: 'none', borderRadius: '50px', padding: '18px 40px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(80,150,60,0.3)', alignSelf: 'center' },
  completeArea: { display: 'flex', flexDirection: 'column' },
  completeCard: { background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '2px solid #f0d5b8' },
  completeTitle: { fontSize: '22px', color: '#c06030', marginBottom: '24px', borderBottom: '2px dashed #f0d5b8', paddingBottom: '16px' },
  episodeItem: { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f5e8d8' },
  episodeBadge: { display: 'inline-block', background: '#ffebd8', color: '#c06030', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' },
  episodeQ: { fontSize: '14px', color: '#a07050', margin: '0 0 6px' },
  episodeA: { fontSize: '17px', lineHeight: '1.8', color: '#3d2c1e', margin: 0, whiteSpace: 'pre-wrap' },
  articleBtn: { width: '100%', background: 'linear-gradient(135deg, #e8804a, #c05828)', color: '#fff', border: 'none', borderRadius: '50px', padding: '18px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' },
  historyHint: { textAlign: 'center', color: '#a07050', fontSize: '14px', marginTop: '20px', padding: '10px', background: '#ffebd8', borderRadius: '50px' },
  cursor: { animation: 'blink 0.8s steps(1) infinite' },
  resumeArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' },
  resumePrevCard: { width: '100%', background: '#fff', border: '2px solid #d4e8c8', borderRadius: '16px', padding: '16px 20px' },
  resumePrevLabel: { fontSize: '13px', color: '#6a9e5a', fontWeight: 'bold', marginBottom: '8px' },
  resumePrevText: { fontSize: '17px', lineHeight: '1.8', color: '#3d2c1e', margin: 0, whiteSpace: 'pre-wrap' as const },
  resumeBtnRow: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  restartBtn: { background: 'transparent', border: '2px solid #f0d5b8', color: '#a07050', borderRadius: '50px', padding: '12px 28px', fontSize: '16px', cursor: 'pointer' },
};

const css = `
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .fadeIn { animation: fadeIn 0.4s ease forwards; }
  .hoverBtn:hover { transform: scale(1.04); filter: brightness(1.05); }
  textarea:focus { border-color: #e8804a !important; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
`;
