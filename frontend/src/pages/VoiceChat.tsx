import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getQuestionHints,
  getEraHintsByBirthYear,
  ERA_HINTS,
} from '../data/eraHints';

// ============================================================
// 型定義
// ============================================================
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api').replace(/\/api$/, '');

// ============================================================
// フィールドごとの質問リスト
// ============================================================
const JIBUNSHI_QUESTIONS = [
  'あなたの生まれた時代はどんな時代でしたか？',
  '生まれた場所と、幼い頃の思い出は？',
  '家族について教えてください',
  '学生時代の思い出は？',
  '最初の職場での経験は？',
  '人生での大きな決断は？',
  '仕事でやりがいを感じたことは？',
  '人生で出会った大切な人は？',
  '趣味や好きなことは？',
  '人生での失敗や試練は？',
  'それらからどう学びましたか？',
  '今、大切にしていることは？',
  '家族や後の世代に伝えたいことは？',
  '人生で一番幸せだった時は？',
  '未来へのメッセージは？',
];

const KAISHAISHI_QUESTIONS = [
  '会社を創業しようと思ったきっかけは何ですか？',
  '創業当時、どのような事業からスタートしましたか？',
  '創業期に最も苦労したことは何でしたか？',
  '最初のお客様や取引先との出会いを教えてください。',
  '事業が軌道に乗ったと感じたのはいつ頃ですか？',
  '会社の成長を支えてくれた社員や仲間について教えてください。',
  '経営上の大きな転機や転換点はありましたか？',
  '業界や市場の変化にどのように対応してきましたか？',
  '会社として誇りに思う実績やエピソードを教えてください。',
  '経営で大切にしてきた理念や信条は何ですか？',
  '苦境を乗り越えた経験があれば教えてください。',
  '地域や社会との関わりで印象に残っていることはありますか？',
  '会社の文化や雰囲気をどのように作ってきましたか？',
  '後継者や次世代への思いはありますか？',
  'これから会社をどのようにしていきたいですか？',
];

const SHUKATSU_QUESTIONS = [
  '現在の健康状態について教えてください',
  '持病や常用している薬はありますか？',
  '緊急連絡先はどなたですか？',
  '介護が必要になった場合の希望は？',
  '医療・延命治療についての考えは？',
  '財産（不動産・預金など）の概要は？',
  '保険の加入状況を教えてください',
  '大切にしている品や処分してほしい物は？',
  'デジタル資産（ID・PWなど）の管理方法は？',
  '葬儀の形式や希望は？',
  'お墓や納骨の希望は？',
  '遺言書の有無や内容は？',
  '家族へのメッセージは？',
  '友人・知人へ伝えたいことは？',
  '最期まで大切にしたい生き方は？',
];

const JIBUNSHI_INTRO: Record<number, string> = {
  1: 'あなたが生まれた頃の時代についてお聞きします。その頃は日本がどんな時代だったか、ヒントをお伝えしますね。',
  2: '生まれ育った場所や幼い頃の記憶についてお聞きします。',
  3: 'ご家族のことを教えてください。兄弟姉妹やご両親との思い出はありますか？',
  4: '学生時代の思い出についてお聞きします。学校生活はどんな様子でしたか？',
  5: '初めて働いた頃のことをお聞きします。',
  6: '人生で大きな決断をした場面についてお聞きします。',
  7: 'お仕事でやりがいを感じた経験についてお聞きします。',
  8: '人生で大切な出会いについてお聞きします。',
  9: '趣味や楽しみにしてきたことをお聞きします。',
  10: '人生の中で乗り越えた試練についてお聞きします。',
  11: '失敗や試練から学んだことについてお聞きします。',
  12: '今、大切にしていることをお聞きします。',
  13: '後の世代に伝えたいことをお聞きします。',
  14: '人生で最も幸せだった時のことをお聞きします。',
  15: '未来へのメッセージをお聞きします。最後の質問です。',
};

function getQuestions(fieldType: string) {
  if (fieldType === 'kaishaishi') return KAISHAISHI_QUESTIONS;
  if (fieldType === 'shukatsu') return SHUKATSU_QUESTIONS;
  return JIBUNSHI_QUESTIONS;
}

function getFieldLabel(fieldType: string) {
  if (fieldType === 'kaishaishi') return '会社史';
  if (fieldType === 'shukatsu') return '終活ノート';
  return '自分史';
}

function getFieldEmoji(fieldType: string) {
  if (fieldType === 'kaishaishi') return '🏢';
  if (fieldType === 'shukatsu') return '📖';
  return '🌸';
}

// ============================================================
// TTS ユーティリティ（OpenAI TTS使用）
// ============================================================
function cleanTextForTTS(text: string): string {
  return text
    .replace(/Q\d+[.．、\s]*/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '')
    .trim();
}

function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsReady, setTtsReady] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fetchingRef = useRef(false); // fetch中フラグ（重複防止）

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      fetchingRef.current = false;
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    // 再生中・fetch中なら止めてリセット
    audioRef.current?.pause();
    audioRef.current = null;
    fetchingRef.current = false;

    const cleanText = cleanTextForTTS(text);
    if (!cleanText) return;

    fetchingRef.current = true;
    setIsSpeaking(true);
    fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    })
      .then(res => res.blob())
      .then(blob => {
        if (!fetchingRef.current) return; // キャンセル済みなら再生しない
        fetchingRef.current = false;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); onEnd?.(); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); onEnd?.(); };
        audio.play();
      })
      .catch(() => { fetchingRef.current = false; setIsSpeaking(false); });
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    fetchingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, ttsReady };
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function VoiceChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fieldType = searchParams.get('fieldType') || 'jibunshi';
  const QUESTIONS = getQuestions(fieldType);
  const fieldLabel = getFieldLabel(fieldType);
  const fieldEmoji = getFieldEmoji(fieldType);

  // フェーズ管理
  type Phase = 'intro' | 'birthYear' | 'hint' | 'listening' | 'confirm' | 'saving' | 'next' | 'complete';
  const [phase, setPhase] = useState<Phase>('intro');
  const [questionId, setQuestionId] = useState(1);

  // 生まれ年（自分史用）
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthYearInput, setBirthYearInput] = useState('');
  const [eraType, setEraType] = useState<'showa' | 'taisho' | 'heisei' | 'seireki'>('showa');
  const [birthYearError, setBirthYearError] = useState('');

  // 会話テキスト
  const [memoChanText, setMemoChanText] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ヒント
  const [currentHints, setCurrentHints] = useState<string[]>([]);
  const [eraHintText, setEraHintText] = useState('');
  const [shownHintIndex, setShownHintIndex] = useState(0);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);

  // ref
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { speak, stop, isSpeaking, ttsReady } = useTTS();

  // ユーザー情報
  const token = localStorage.getItem('token');
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = payload?.userId || payload?.id;

  // スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase, memoChanText]);

  // ============================================================
  // メモちゃん発話
  // ============================================================
  const memoChanSay = useCallback((text: string, onEnd?: () => void) => {
    setMemoChanText(text);
    if (autoReadEnabled && ttsReady) {
      speak(text, onEnd);
    } else {
      onEnd?.();
    }
  }, [autoReadEnabled, ttsReady, speak]);

  // ============================================================
  // イントロ
  // ============================================================
  useEffect(() => {
    if (phase === 'intro') {
      if (fieldType === 'kaishaishi') {
        const intro = `こんにちは！わたしはメモちゃんです。これから貴社の大切な会社史を、いっしょに記録していきましょう。15の質問に、思い出しながらお答えください。それではさっそく第1問からはじめますね！`;
        memoChanSay(intro, () => startQuestion(1));
      } else if (fieldType === 'shukatsu') {
        const intro = `こんにちは！わたしはメモちゃんです。これから大切なことを、いっしょに整理していきましょう。ゆっくり、思ったことをそのまま話してください。それではさっそく第1問からはじめますね！`;
        memoChanSay(intro, () => startQuestion(1));
      } else {
        // jibunshi：挨拶の後に生まれ年入力を促す
        const intro = `こんにちは！わたしはメモちゃんです。これからあなたの大切な人生の記録を、いっしょに残していきましょう。15の質問に、のんびり答えてくださいね。まず、あなたは何年生まれですか？昭和・大正・平成・西暦からお選びください。`;
        memoChanSay(intro, () => {
          setPhase('birthYear');
        });
      }
    }
  }, [phase]);

  // ============================================================
  // 生まれ年計算
  // ============================================================
  const calcBirthYear = () => {
    const n = parseInt(birthYearInput);
    if (isNaN(n)) return null;
    if (eraType === 'showa') return n + 1925;
    if (eraType === 'taisho') return n + 1911;
    if (eraType === 'heisei') return n + 1988;
    return n;
  };

  const handleBirthYearSubmit = () => {
    const year = calcBirthYear();
    if (!year || year < 1900 || year > 2020) {
      setBirthYearError('正しい年を入力してください');
      return;
    }
    setBirthYearError('');
    setBirthYear(year);
    // 時代ヒントを準備してヒントフェーズへ
    startQuestion(1, year);
  };

  // ============================================================
  // 質問開始 → ヒント表示
  // ============================================================
  const startQuestion = (qId: number, byBirthYear?: number) => {
    const usedBirthYear = byBirthYear ?? birthYear;
    const hints = getQuestionHints(fieldType, qId);

    // 自分史1問目のみ時代背景ヒントを追加
    let eraText = '';
    if (fieldType === 'jibunshi' && qId === 1 && usedBirthYear) {
      const decade = Math.floor(usedBirthYear / 10) * 10;
      const eraHint = ERA_HINTS[decade];
      if (eraHint) {
        eraText = `${eraHint.decade}のできごとをご紹介しますね。\n` +
          eraHint.topics.slice(0, 3).join('\n');
      }
      // 生まれた頃の時代ヒントを全問で使えるよう保持
      const allEraHints = getEraHintsByBirthYear(usedBirthYear);
      if (allEraHints.length > 0) {
        setEraHintText(allEraHints.map(h => h.topics.join('\n')).join('\n'));
      }
    }

    setCurrentHints(hints);
    setShownHintIndex(0);
    setQuestionId(qId);
    setUserAnswer('');
    setSaveError('');
    setPhase('hint');

    // メモちゃんのイントロ発話
    const introText = fieldType === 'jibunshi'
      ? (JIBUNSHI_INTRO[qId] || `第${qId}問です。`)
      : `第${qId}問です。`;

    const fullIntro = eraText
      ? `${introText}\n\n${eraText}\n\nいかがでしょうか？何か思い出しましたか？`
      : `${introText}\n\n${hints.slice(0, 2).join('\n')}\n\n準備ができたら、マイクボタンを押して話してください。`;

    memoChanSay(fullIntro);
  };

  // ============================================================
  // 音声入力
  // ============================================================
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('このブラウザは音声入力に対応していません。Chromeをお使いください。');
      return;
    }
    stop(); // 読み上げ中なら停止
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setUserAnswer(prev => prev + (prev ? '　' : '') + transcript);
    };
    recognition.onerror = () => setListening(false);
    setPhase('listening');
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setPhase('confirm');
    memoChanSay('ありがとうございます。今のお話、確認してください。よろしければ「保存する」を押してください。');
  };

  // ============================================================
  // 保存
  // ============================================================
  const saveAnswer = async () => {
    if (!userAnswer.trim()) return;
    setPhase('saving');
    memoChanSay('保存しています…少々お待ちください。');
    try {
      const res = await fetch(`${API_BASE}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          question_id: questionId,
          question_text: QUESTIONS[questionId - 1],
          answer_text: userAnswer.trim(),
          field_type: fieldType,
        }),
      });
      if (!res.ok) throw new Error('保存失敗');

      if (questionId >= 15) {
        setPhase('complete');
        memoChanSay(`全部答えてくれてありがとうございます！すてきな${fieldLabel}になりましたね。お疲れさまでした！`);
      } else {
        setPhase('next');
        memoChanSay(`保存しました！${questionId}問目が完了です。次の質問に進みますか？`);
      }
    } catch {
      setSaveError('保存に失敗しました。もう一度お試しください。');
      setPhase('confirm');
      memoChanSay('申し訳ありません、保存に失敗しました。もう一度お試しください。');
    }
  };

  // ============================================================
  // 次の質問へ
  // ============================================================
  const goNext = () => {
    const nextId = questionId + 1;
    startQuestion(nextId);
  };

  // ============================================================
  // ヒントをもう一つ表示
  // ============================================================
  const showNextHint = () => {
    const next = shownHintIndex + 1;
    if (next < currentHints.length) {
      setShownHintIndex(next);
      speak(currentHints[next]);
    }
  };

  // ============================================================
  // 進捗
  // ============================================================
  const progress = Math.round(((questionId - 1) / 15) * 100);

  // ============================================================
  // レンダリング
  // ============================================================
  return (
    <div style={s.root}>
      {/* ヘッダー */}
      <div style={s.header}>
        <button onClick={() => { stop(); navigate(-1); }} style={s.backBtn}>← 戻る</button>
        <div style={s.headerTitle}>{fieldEmoji} メモちゃんとおしゃべり</div>
        <div style={s.headerRight}>
          {phase !== 'intro' && phase !== 'birthYear' && (
            <>
              <span style={s.progressText}>Q{questionId}/15</span>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* メモちゃんエリア */}
      <div style={s.chatArea}>
        {/* キャラクター */}
        <div style={s.characterRow}>
          <div style={{ ...s.avatar, animation: (listening || isSpeaking) ? 'pulse 1s infinite' : 'none' }}>
            <span style={s.avatarEmoji}>{isSpeaking ? '💬' : listening ? '👂' : fieldEmoji}</span>
          </div>
          <div style={s.characterName}>メモちゃん</div>
        </div>

        {/* 吹き出し */}
        {memoChanText && (
          <div style={s.bubble}>
            <p style={s.bubbleText}>{memoChanText}</p>
            <div style={s.bubbleTail} />

            {/* 読み上げコントロール */}
            <div style={s.ttsRow}>
              <button
                onClick={() => isSpeaking ? stop() : speak(memoChanText)}
                style={{ ...s.ttsBtn, background: isSpeaking ? '#e53935' : '#388E3C' }}
              >
                {isSpeaking ? '⏹ 停止' : '🔊 もう一度聞く'}
              </button>
              <label style={s.autoReadLabel}>
                <input
                  type="checkbox"
                  checked={autoReadEnabled}
                  onChange={e => setAutoReadEnabled(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                自動で読み上げる
              </label>
            </div>
          </div>
        )}

        {/* ヒントカード（hint / listening / confirm フェーズ） */}
        {(phase === 'hint' || phase === 'listening' || phase === 'confirm') && currentHints.length > 0 && (
          <div style={s.hintCard}>
            <div style={s.hintTitle}>💡 思い出すヒント</div>
            {currentHints.slice(0, shownHintIndex + 1).map((h, i) => (
              <div key={i} style={s.hintItem}>{h}</div>
            ))}
            {shownHintIndex + 1 < currentHints.length && (
              <button onClick={showNextHint} style={s.moreHintBtn}>
                ＋ 別のヒントを見る
              </button>
            )}
          </div>
        )}

        {/* ============ フェーズ別UI ============ */}

        {/* イントロ */}
        {phase === 'intro' && (
          <div style={s.centerArea}>
            {fieldType === 'jibunshi' ? (
              <button style={s.startBtn} onClick={() => {
                stop();
                setPhase('birthYear');
                setTimeout(() => memoChanSay('あなたは何年生まれですか？昭和・大正・平成・西暦からお選びください。'), 200);
              }}>
                🎤 メモちゃんとおしゃべりをはじめる
              </button>
            ) : (
              <button style={s.startBtn} onClick={() => { stop(); startQuestion(1); }}>
                🎤 メモちゃんとおしゃべりをはじめる
              </button>
            )}
            <p style={s.hint}>ボタンを押してメモちゃんとお話しましょう</p>
          </div>
        )}

        {/* 生まれ年入力（自分史のみ） */}
        {phase === 'birthYear' && (
          <div style={s.birthYearArea}>
            <div style={s.eraSelector}>
              {(['showa', 'taisho', 'heisei', 'seireki'] as const).map(era => (
                <button
                  key={era}
                  style={{ ...s.eraBtn, ...(eraType === era ? s.eraBtnActive : {}) }}
                  onClick={() => { setEraType(era); setBirthYearInput(''); }}
                >
                  {era === 'showa' ? '昭和' : era === 'taisho' ? '大正' : era === 'heisei' ? '平成' : '西暦'}
                </button>
              ))}
            </div>
            <div style={s.birthInputRow}>
              <input
                type="number"
                value={birthYearInput}
                onChange={e => setBirthYearInput(e.target.value)}
                placeholder={eraType === 'seireki' ? '例：1950' : eraType === 'showa' ? '例：25' : eraType === 'taisho' ? '例：10' : '例：5'}
                style={s.birthInput}
                onKeyDown={e => e.key === 'Enter' && handleBirthYearSubmit()}
              />
              <span style={s.birthUnit}>年生まれ</span>
            </div>
            {birthYearInput && !isNaN(parseInt(birthYearInput)) && (
              <div style={s.birthPreview}>西暦 {calcBirthYear()} 年生まれ</div>
            )}
            {birthYearError && <p style={s.errorText}>{birthYearError}</p>}
            <button style={s.startBtn} onClick={handleBirthYearSubmit}>
              決定してはじめる →
            </button>
          </div>
        )}

        {/* ヒント表示 → 録音待ち */}
        {phase === 'hint' && (
          <div style={s.centerArea}>
            <p style={s.questionText}>Q{questionId}. {QUESTIONS[questionId - 1]}</p>
            <button style={s.micBtn} onClick={startListening}>
              🎤 話す
            </button>
            <p style={s.hint}>ボタンを押して、思ったことを自由に話してください</p>
            <button style={s.textModeBtn} onClick={() => {
              setPhase('confirm');
              memoChanSay('テキストで入力してください。書き終わったら「保存する」を押してください。');
            }}>
              ✏️ キーボードで入力する
            </button>
          </div>
        )}

        {/* 録音中 */}
        {phase === 'listening' && (
          <div style={s.centerArea}>
            <p style={s.questionText}>Q{questionId}. {QUESTIONS[questionId - 1]}</p>
            <div style={s.listeningIndicator}>
              <div style={s.listeningDot} />
              <span style={s.listeningText}>聞いています… 話し終わったらボタンを押してください</span>
            </div>
            <button style={s.stopBtn} onClick={stopListening}>
              ⏹ 話し終わった
            </button>
            {userAnswer && (
              <div style={s.liveTranscript}>
                <p style={s.liveTranscriptLabel}>📝 認識中のテキスト：</p>
                <p style={s.liveTranscriptText}>{userAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* 確認・編集 */}
        {phase === 'confirm' && (
          <div style={s.confirmArea}>
            <p style={s.questionText}>Q{questionId}. {QUESTIONS[questionId - 1]}</p>
            <p style={s.confirmLabel}>✏️ 内容を確認・修正できます</p>
            <textarea
              ref={textareaRef}
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="ここに入力してください…"
              style={s.textarea}
            />
            {saveError && <p style={s.errorText}>⚠️ {saveError}</p>}
            <div style={s.confirmBtns}>
              <button style={s.rerecordBtn} onClick={startListening}>
                🎤 もう一度話す
              </button>
              <button
                style={{ ...s.saveBtn, opacity: userAnswer.trim() ? 1 : 0.5 }}
                disabled={!userAnswer.trim()}
                onClick={saveAnswer}
              >
                💾 保存する
              </button>
            </div>
          </div>
        )}

        {/* 保存中 */}
        {phase === 'saving' && (
          <div style={s.centerArea}>
            <div style={s.savingSpinner}>⏳</div>
            <p style={s.hint}>保存中です…</p>
          </div>
        )}

        {/* 次の質問へ */}
        {phase === 'next' && (
          <div style={s.centerArea}>
            <p style={s.savedMsg}>✅ Q{questionId} 保存しました！</p>
            <button style={s.nextBtn} onClick={goNext}>
              次の質問へ → Q{questionId + 1}
            </button>
            <button style={s.skipBtn} onClick={() => navigate(-1)}>
              今日はここまで（あとで続ける）
            </button>
          </div>
        )}

        {/* 完了 */}
        {phase === 'complete' && (
          <div style={s.completeArea}>
            <div style={s.completeEmoji}>🎉</div>
            <h2 style={s.completeTitle}>全問完了！</h2>
            <p style={s.completeText}>
              すてきな{fieldLabel}が完成しました。<br />
              メモちゃんとのおしゃべり、ありがとうございました！
            </p>
            <button style={s.startBtn} onClick={() => navigate(-1)}>
              ダッシュボードに戻る
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// スタイル
// ============================================================
const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fff8f0 0%, #fdf6ec 50%, #f5f0ff 100%)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  header: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e8d8c4',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #c9a87c',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#7a5c3a',
    fontFamily: 'inherit',
  },
  headerTitle: {
    fontFamily: "'Noto Serif JP', serif",
    fontSize: '1.1rem',
    color: '#5a3a1a',
    fontWeight: 600,
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressText: {
    fontSize: '0.85rem',
    color: '#9a7a5a',
    fontWeight: 600,
  },
  progressBar: {
    width: '80px',
    height: '8px',
    background: '#e8d8c4',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #c9884a, #e8956d)',
    borderRadius: '20px',
    transition: 'width 0.5s ease',
  },
  chatArea: {
    flex: 1,
    maxWidth: '720px',
    margin: '0 auto',
    width: '100%',
    padding: '24px 20px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  characterRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fde8cc, #fcc97a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(200,140,60,0.25)',
  },
  avatarEmoji: {
    fontSize: '2.4rem',
    lineHeight: 1,
  },
  characterName: {
    fontSize: '0.85rem',
    color: '#9a7a5a',
    fontWeight: 600,
  },
  bubble: {
    background: 'white',
    borderRadius: '18px',
    padding: '20px 24px',
    boxShadow: '0 4px 20px rgba(180,130,60,0.12)',
    border: '1.5px solid #f0d8b8',
    position: 'relative',
  },
  bubbleText: {
    fontSize: '1.05rem',
    lineHeight: 1.85,
    color: '#3a2a1a',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  bubbleTail: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '12px solid white',
  },
  ttsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  ttsBtn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  autoReadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    color: '#9a7a5a',
  },
  hintCard: {
    background: 'linear-gradient(135deg, #fffbf0, #fff8e8)',
    border: '1.5px solid #f5d890',
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 2px 10px rgba(200,180,60,0.1)',
  },
  hintTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#7a5a10',
    marginBottom: '12px',
  },
  hintItem: {
    fontSize: '0.95rem',
    color: '#5a4010',
    lineHeight: 1.7,
    padding: '6px 0',
    borderBottom: '1px solid #f0d870',
  },
  moreHintBtn: {
    marginTop: '10px',
    background: 'transparent',
    border: '1px solid #c8a830',
    borderRadius: '20px',
    padding: '6px 16px',
    color: '#7a5a10',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  centerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '8px',
  },
  questionText: {
    fontFamily: "'Noto Serif JP', serif",
    fontSize: '1.15rem',
    color: '#5a3a1a',
    textAlign: 'center',
    lineHeight: 1.7,
    background: 'rgba(255,255,255,0.8)',
    padding: '14px 20px',
    borderRadius: '12px',
    width: '100%',
    margin: 0,
  },
  startBtn: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #c9773a, #e8956d)',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    fontSize: '1.15rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(200,120,60,0.35)',
    transition: 'all 0.2s',
  },
  micBtn: {
    padding: '24px 60px',
    background: 'linear-gradient(135deg, #1976D2, #42A5F5)',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    fontSize: '1.3rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(25,118,210,0.35)',
    transition: 'all 0.2s',
  },
  textModeBtn: {
    background: 'transparent',
    border: '1.5px solid #c9a87c',
    borderRadius: '20px',
    padding: '10px 24px',
    color: '#7a5c3a',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  stopBtn: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #e53935, #ef5350)',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    fontSize: '1.15rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 0 0 6px rgba(229,57,53,0.2)',
    animation: 'pulse 1.2s infinite',
  },
  listeningIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(229,57,53,0.08)',
    padding: '12px 20px',
    borderRadius: '12px',
  },
  listeningDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#e53935',
    animation: 'blink 1s infinite',
  },
  listeningText: {
    color: '#c62828',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  liveTranscript: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '14px 18px',
    width: '100%',
  },
  liveTranscriptLabel: {
    fontSize: '0.8rem',
    color: '#888',
    margin: '0 0 6px',
  },
  liveTranscriptText: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: 1.7,
    margin: 0,
  },
  confirmArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  confirmLabel: {
    fontSize: '0.9rem',
    color: '#7a5c3a',
    margin: 0,
  },
  textarea: {
    width: '100%',
    minHeight: '140px',
    padding: '16px',
    border: '2px solid #e8d0b0',
    borderRadius: '12px',
    fontSize: '1rem',
    lineHeight: 1.8,
    color: '#3a2a1a',
    background: '#fffdf8',
    resize: 'vertical',
    outline: 'none',
    fontFamily: "'Noto Sans JP', sans-serif",
    boxSizing: 'border-box',
  },
  confirmBtns: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  rerecordBtn: {
    flex: 1,
    padding: '14px',
    background: 'transparent',
    border: '2px solid #c9a87c',
    borderRadius: '12px',
    color: '#7a5c3a',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    flex: 2,
    padding: '14px',
    background: 'linear-gradient(135deg, #388E3C, #66BB6A)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(56,142,60,0.3)',
  },
  savingSpinner: {
    fontSize: '3rem',
    animation: 'pulse 1s infinite',
  },
  savedMsg: {
    fontSize: '1.1rem',
    color: '#388E3C',
    fontWeight: 600,
    margin: 0,
  },
  nextBtn: {
    padding: '18px 48px',
    background: 'linear-gradient(135deg, #c9773a, #e8956d)',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(200,120,60,0.35)',
  },
  skipBtn: {
    background: 'transparent',
    border: '1.5px solid #c9a87c',
    borderRadius: '20px',
    padding: '10px 24px',
    color: '#7a5c3a',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  completeArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    textAlign: 'center',
  },
  completeEmoji: { fontSize: '4rem' },
  completeTitle: {
    fontFamily: "'Noto Serif JP', serif",
    fontSize: '1.8rem',
    color: '#5a3a1a',
    margin: 0,
  },
  completeText: {
    fontSize: '1rem',
    color: '#7a5c3a',
    lineHeight: 1.8,
    margin: 0,
  },
  birthYearArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    background: 'white',
    borderRadius: '18px',
    padding: '28px 24px',
    boxShadow: '0 4px 20px rgba(180,130,60,0.1)',
  },
  eraSelector: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  eraBtn: {
    padding: '10px 20px',
    border: '2px solid #e0c890',
    borderRadius: '10px',
    background: 'white',
    color: '#7a5a30',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  eraBtnActive: {
    background: 'linear-gradient(135deg, #c9773a, #e8956d)',
    color: 'white',
    border: '2px solid #c9773a',
  },
  birthInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  birthInput: {
    padding: '14px 18px',
    border: '2px solid #e0c890',
    borderRadius: '10px',
    fontSize: '1.3rem',
    width: '130px',
    textAlign: 'center' as const,
    fontFamily: 'inherit',
    outline: 'none',
    color: '#3a2a1a',
  },
  birthUnit: {
    fontSize: '1.1rem',
    color: '#7a5a30',
    fontWeight: 600,
  },
  birthPreview: {
    background: '#fff8e8',
    border: '1px solid #e8d080',
    borderRadius: '8px',
    padding: '8px 20px',
    color: '#7a5a10',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  hint: {
    fontSize: '0.9rem',
    color: '#9a7a5a',
    margin: 0,
    textAlign: 'center' as const,
  },
  errorText: {
    color: '#c62828',
    fontSize: '0.9rem',
    margin: 0,
  },
};
