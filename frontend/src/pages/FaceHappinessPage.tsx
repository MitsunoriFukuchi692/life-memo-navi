import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// face-api.js を動的インポート（CDNのモデルを使用）
declare const faceapi: any;

type HappinessResult = {
  score: number;
  label: string;
  comment: string;
  emoji: string;
  color: string;
  bg: string;
};

// 表情スコア → 幸福度5段階変換
// face-api.js が返す表情: neutral, happy, sad, angry, fearful, disgusted, surprised
function expressionToHappiness(expressions: Record<string, number>): HappinessResult {
  const happy     = expressions.happy     || 0;
  const neutral   = expressions.neutral   || 0;
  const surprised = expressions.surprised || 0;
  const sad       = expressions.sad       || 0;
  const angry     = expressions.angry     || 0;
  const fearful   = expressions.fearful   || 0;
  const disgusted = expressions.disgusted || 0;

  // ネガティブ感情の合計
  const negativeScore = sad + angry + fearful + disgusted;

  // スコア判定（緩やかな基準）
  // ・笑顔が強い(happy>0.5)        → 5
  // ・笑顔がある(happy>0.2)        → 4
  // ・neutral が支配的             → 3
  // ・surprised が強い             → 3
  // ・ネガティブが少しある          → 2
  // ・ネガティブが強い              → 1
  let score: number;
  if (happy > 0.5) {
    score = 5;
  } else if (happy > 0.2) {
    score = 4;
  } else if (neutral > 0.4 || surprised > 0.3) {
    score = 3;
  } else if (negativeScore > 0.5) {
    score = 1;
  } else if (negativeScore > 0.2) {
    score = 2;
  } else {
    // どれも低い＝判定曖昧な場合は普通扱い
    score = 3;
  }
  score = Math.max(1, Math.min(5, score));

  const config: Record<number, Omit<HappinessResult, 'score'>> = {
    5: { label: 'とても幸せ',   emoji: '😄', color: '#2e7d32', bg: '#e8f5e9',
         comment: `笑顔いっぱい！幸福度MAXです 😊` },
    4: { label: '幸せ',         emoji: '🙂', color: '#558b2f', bg: '#f1f8e9',
         comment: `良い表情ですね！気分が上向きです` },
    3: { label: 'ふつう',       emoji: '😐', color: '#f57f17', bg: '#fffde7',
         comment: `穏やかな表情です。リラックスしていますね` },
    2: { label: '少し元気なし', emoji: '😔', color: '#e65100', bg: '#fff3e0',
         comment: `少し疲れているかもしれません` },
    1: { label: '元気なし',     emoji: '😢', color: '#b71c1c', bg: '#ffebee',
         comment: `大丈夫ですか？ゆっくり休んでください` },
  };

  return { score, ...config[score] };
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

export default function FaceHappinessPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const navigate = useNavigate();
  const [modelLoaded, setModelLoaded]   = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraOn, setCameraOn]         = useState(false);
  const [analyzing, setAnalyzing]       = useState(false);
  const [results, setResults]           = useState<HappinessResult[]>([]);
  const [error, setError]               = useState('');
  const [shotCount, setShotCount]       = useState(0);

  // face-api.js スクリプトをCDNから動的ロード
  useEffect(() => {
    if ((window as any).faceapi) { setModelLoaded(false); loadModels(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js';
    script.onload = () => loadModels();
    script.onerror = () => setError('face-api.js の読み込みに失敗しました。ネットワークを確認してください。');
    document.head.appendChild(script);
  }, []);

  const loadModels = async () => {
    setModelLoading(true);
    try {
      const fa = (window as any).faceapi;
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        fa.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelLoaded(true);
    } catch (e: any) {
      setError('AIモデルの読み込みに失敗しました: ' + e.message);
    } finally {
      setModelLoading(false);
    }
  };

  // カメラ起動
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError('カメラの起動に失敗しました。ブラウザのカメラ許可を確認してください。');
    }
  };

  // カメラ停止
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  // 撮影して判定
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !modelLoaded) return;
    setAnalyzing(true);
    setError('');

    try {
      const fa = (window as any).faceapi;
      const options = new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });

      const detection = await fa
        .detectSingleFace(videoRef.current, options)
        .withFaceExpressions();

      if (!detection) {
        // 顔が検出されなかった場合
        setResults(prev => [...prev, {
          score: 0, label: '顔を検出できませんでした', emoji: '❓',
          color: '#546e7a', bg: '#eceff1',
          comment: 'カメラに顔を近づけて、明るい場所で試してください',
        }]);
        setShotCount(prev => prev + 1);
        return;
      }

      const result = expressionToHappiness(detection.expressions as Record<string, number>);
      setResults(prev => [...prev, result]);
      setShotCount(prev => prev + 1);

      // オーバーレイに検出枠を描画（0.5秒後に消える）
      if (overlayRef.current && videoRef.current) {
        const ov = overlayRef.current;
        ov.width  = videoRef.current.videoWidth;
        ov.height = videoRef.current.videoHeight;
        const ctx = ov.getContext('2d');
        if (ctx) {
          const box = detection.detection.box;
          ctx.strokeStyle = result.color;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          setTimeout(() => ctx.clearRect(0, 0, ov.width, ov.height), 800);
        }
      }
    } catch (e: any) {
      setError('判定中にエラーが発生しました: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  }, [modelLoaded]);

  // 平均スコア計算
  const validResults = results.filter(r => r.score > 0);
  const avgScore = validResults.length > 0
    ? Math.round((validResults.reduce((s, r) => s + r.score, 0) / validResults.length) * 10) / 10
    : null;

  const avgEmoji  = avgScore !== null ? (['', '😢', '😔', '😐', '🙂', '😄'][Math.round(avgScore)]) : null;
  const avgColor  = avgScore !== null ? (['', '#b71c1c','#e65100','#f57f17','#558b2f','#2e7d32'][Math.round(avgScore)]) : null;
  const avgBg     = avgScore !== null ? (['', '#ffebee','#fff3e0','#fffde7','#f1f8e9','#e8f5e9'][Math.round(avgScore)]) : null;
  const avgLabel  = avgScore !== null ? (['', '元気なし','少し元気なし','ふつう','幸せ','とても幸せ'][Math.round(avgScore)]) : null;

  const latestResult = results[results.length - 1];

  return (
    <div style={{ minHeight: '100vh', background: '#fdf6ec', padding: '40px 24px', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* 戻るボタン */}
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => navigate('/home')} style={{
            background: 'transparent', border: 'none',
            color: '#A07850', fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0',
          }}>
            ← ホームに戻る
          </button>
        </div>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>😊</div>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.8rem', color: '#6B4F3A', marginBottom: '8px' }}>
            顔幸福度チェック
          </h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>カメラで表情を撮影して、今の幸福度を5段階で判定します</p>
          <div style={{ display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', padding: '4px 16px', borderRadius: '20px', fontSize: '0.8rem', marginTop: '8px' }}>
            ✅ 完全無料・写真はサーバーに送信されません
          </div>
        </div>

        {/* モデル読み込み状態 */}
        {modelLoading && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ color: '#f57f17', fontSize: '0.95rem' }}>⏳ AIモデルを読み込み中です。しばらくお待ちください...</p>
          </div>
        )}
        {modelLoaded && !cameraOn && (
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ color: '#2e7d32', fontSize: '0.9rem' }}>✅ AIモデルの読み込み完了！カメラを起動できます。</p>
          </div>
        )}

        {/* カメラエリア */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div style={{ position: 'relative', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }}
              playsInline muted
            />
            {/* 顔検出枠オーバーレイ */}
            <canvas ref={overlayRef} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: cameraOn ? 'block' : 'none', transform: 'scaleX(-1)', pointerEvents: 'none',
            }} />
            {!cameraOn && (
              <div style={{ textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '4rem', marginBottom: '12px' }}>📷</div>
                <p style={{ fontSize: '0.95rem' }}>「カメラを起動」を押してください</p>
              </div>
            )}
            {analyzing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
                <p style={{ color: 'white', fontWeight: 600 }}>表情を解析中...</p>
              </div>
            )}
          </div>

          {/* 隠しキャンバス */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!cameraOn ? (
              <button onClick={startCamera} disabled={modelLoading} style={{
                padding: '14px 36px',
                background: modelLoading ? '#ccc' : 'linear-gradient(135deg, #6B4F3A, #A07850)',
                color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem',
                fontWeight: 700, cursor: modelLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(107,79,58,0.3)',
              }}>
                {modelLoading ? '⏳ 読み込み中...' : '📷 カメラを起動'}
              </button>
            ) : (
              <>
                <button onClick={captureAndAnalyze} disabled={analyzing || !modelLoaded} style={{
                  padding: '14px 36px',
                  background: analyzing ? '#ccc' : 'linear-gradient(135deg, #1976D2, #42A5F5)',
                  color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem',
                  fontWeight: 700, cursor: analyzing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                }}>
                  {analyzing ? '🔍 解析中...' : `📸 撮影して判定 (${shotCount}/5)`}
                </button>
                <button onClick={stopCamera} style={{
                  padding: '14px 24px', background: 'transparent',
                  border: '2px solid #ccc', borderRadius: '50px',
                  fontSize: '0.95rem', color: '#888', cursor: 'pointer',
                }}>
                  停止
                </button>
              </>
            )}
          </div>

          {error && (
            <p style={{ color: '#c0392b', textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>⚠️ {error}</p>
          )}
        </div>

        {/* 最新の判定結果 */}
        {latestResult && (
          <div style={{
            background: latestResult.bg, border: `2px solid ${latestResult.color}40`,
            borderRadius: '16px', padding: '28px 32px', textAlign: 'center', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{latestResult.emoji}</div>
            {latestResult.score > 0 && (
              <div style={{ fontSize: '2rem', fontWeight: 700, color: latestResult.color, marginBottom: '4px' }}>
                レベル {latestResult.score} / 5
              </div>
            )}
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: latestResult.color, marginBottom: '8px' }}>
              {latestResult.label}
            </div>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>{latestResult.comment}</p>
          </div>
        )}

        {/* 撮影履歴・平均スコア */}
        {validResults.length > 1 && avgScore !== null && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.1rem', color: '#6B4F3A', marginBottom: '20px' }}>
              📊 今回のセッション結果
            </h3>

            {/* 平均スコア */}
            <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: avgBg!, borderRadius: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>平均幸福度スコア</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: avgColor! }}>{avgScore}</div>
              <div style={{ fontSize: '1rem', color: avgColor! }}>{avgEmoji} {avgLabel}</div>
            </div>

            {/* 履歴バー */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'center', height: '80px' }}>
              {results.map((r, i) => {
                const h = r.score > 0 ? (r.score / 5) * 70 : 10;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: r.color, fontWeight: 600 }}>{r.score > 0 ? r.score : '?'}</div>
                    <div style={{ width: '32px', height: `${h}px`, background: r.color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>{i + 1}回目</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* リセット */}
        {results.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setResults([]); setShotCount(0); }} style={{
              padding: '10px 28px', background: 'transparent', border: '2px solid #ccc',
              borderRadius: '50px', fontSize: '0.9rem', color: '#888', cursor: 'pointer',
            }}>
              🔄 リセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
