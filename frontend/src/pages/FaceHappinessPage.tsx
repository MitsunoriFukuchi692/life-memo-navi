import { useRef, useState, useCallback } from 'react';
import api from '../api';

type HappinessResult = {
  score: number;
  label: string;
  comment: string;
};

const SCORE_CONFIG: Record<number, { emoji: string; color: string; bg: string; label: string }> = {
  5: { emoji: '😄', color: '#2e7d32', bg: '#e8f5e9', label: 'とても幸せ' },
  4: { emoji: '🙂', color: '#558b2f', bg: '#f1f8e9', label: '幸せ' },
  3: { emoji: '😐', color: '#f57f17', bg: '#fffde7', label: 'ふつう' },
  2: { emoji: '😔', color: '#e65100', bg: '#fff3e0', label: '少し元気なし' },
  1: { emoji: '😢', color: '#b71c1c', bg: '#ffebee', label: '元気なし' },
  0: { emoji: '❓', color: '#546e7a', bg: '#eceff1', label: '判定不可' },
};

export default function FaceHappinessPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<HappinessResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [shotCount, setShotCount] = useState(0);

  const API_BASE = (import.meta.env.VITE_API_URL || 'https://life-memo-navi-backend.onrender.com/api');

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
    } catch (e: any) {
      setError('カメラの起動に失敗しました。ブラウザのカメラ許可を確認してください。');
    }
  };

  // カメラ停止
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setPreviewUrl(null);
  };

  // 撮影して判定
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    setError('');

    // キャンバスに映像を描画
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // プレビュー用URL（表示だけ、サーバー保存なし）
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewUrl(dataUrl);
    setCapturing(false);
    setAnalyzing(true);

    try {
      const res = await api.post('/face-happiness', { image: dataUrl });
      const result: HappinessResult = res.data;
      setResults(prev => [...prev, result]);
      setShotCount(prev => prev + 1);
    } catch (e: any) {
      setError('判定に失敗しました。もう一度お試しください。');
    } finally {
      setAnalyzing(false);
      // プレビューは3秒後に消す（写真を残さない）
      setTimeout(() => setPreviewUrl(null), 3000);
    }
  }, []);

  // 平均スコア計算
  const validResults = results.filter(r => r.score > 0);
  const avgScore = validResults.length > 0
    ? Math.round((validResults.reduce((s, r) => s + r.score, 0) / validResults.length) * 10) / 10
    : null;
  const avgConfig = avgScore !== null ? SCORE_CONFIG[Math.round(avgScore)] : null;

  const latestResult = results[results.length - 1];
  const latestConfig = latestResult ? SCORE_CONFIG[latestResult.score] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #fdf6ec)', padding: '40px 24px', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>😊</div>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.8rem', color: '#6B4F3A', marginBottom: '8px' }}>
            顔幸福度チェック
          </h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>
            カメラで表情を撮影して、今の幸福度を5段階で判定します
          </p>
          <div style={{ display: 'inline-block', background: '#fff3e0', color: '#e65100', padding: '4px 16px', borderRadius: '20px', fontSize: '0.8rem', marginTop: '8px' }}>
            📷 写真はサーバーに保存されません
          </div>
        </div>

        {/* カメラエリア */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          {/* カメラ映像 */}
          <div style={{ position: 'relative', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }}
              playsInline
              muted
            />
            {!cameraOn && (
              <div style={{ textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '4rem', marginBottom: '12px' }}>📷</div>
                <p style={{ fontSize: '0.95rem' }}>「カメラを起動」を押してください</p>
              </div>
            )}
            {/* 撮影フラッシュ演出 */}
            {capturing && (
              <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.8, borderRadius: '12px' }} />
            )}
            {/* 判定中オーバーレイ */}
            {analyzing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤖</div>
                <p style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>AIが表情を分析中...</p>
              </div>
            )}
          </div>

          {/* 隠しキャンバス */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!cameraOn ? (
              <button onClick={startCamera} style={{
                padding: '14px 36px', background: 'linear-gradient(135deg, #6B4F3A, #A07850)',
                color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem',
                fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(107,79,58,0.3)',
              }}>
                📷 カメラを起動
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndAnalyze}
                  disabled={analyzing || capturing}
                  style={{
                    padding: '14px 36px',
                    background: analyzing || capturing
                      ? '#ccc'
                      : 'linear-gradient(135deg, #1976D2, #42A5F5)',
                    color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem',
                    fontWeight: 700, cursor: analyzing || capturing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
                  }}>
                  {analyzing ? '🤖 分析中...' : capturing ? '📸 撮影中...' : `📸 撮影して判定 (${shotCount}/5)`}
                </button>
                <button onClick={stopCamera} style={{
                  padding: '14px 24px', background: 'transparent',
                  border: '2px solid #ccc', borderRadius: '50px', fontSize: '0.95rem',
                  color: '#888', cursor: 'pointer',
                }}>
                  停止
                </button>
              </>
            )}
          </div>

          {error && (
            <p style={{ color: '#c0392b', textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* 最新の判定結果 */}
        {latestResult && latestConfig && (
          <div className="fade-in" style={{
            background: latestConfig.bg,
            border: `2px solid ${latestConfig.color}40`,
            borderRadius: '16px', padding: '28px 32px',
            textAlign: 'center', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{latestConfig.emoji}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: latestConfig.color, marginBottom: '4px' }}>
              レベル {latestResult.score} / 5
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: latestConfig.color, marginBottom: '8px' }}>
              {latestResult.label || latestConfig.label}
            </div>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>{latestResult.comment}</p>
          </div>
        )}

        {/* 撮影履歴・平均スコア */}
        {results.length > 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: '1.1rem', color: '#6B4F3A', marginBottom: '20px' }}>
              📊 今回のセッション結果
            </h3>

            {/* 平均スコア */}
            {avgScore !== null && avgConfig && (
              <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: avgConfig.bg, borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>平均幸福度スコア</div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: avgConfig.color }}>{avgScore}</div>
                <div style={{ fontSize: '1rem', color: avgConfig.color }}>{avgConfig.emoji} {avgConfig.label}</div>
              </div>
            )}

            {/* 履歴バー */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'center', height: '80px' }}>
              {results.map((r, i) => {
                const cfg = SCORE_CONFIG[r.score];
                const height = r.score > 0 ? (r.score / 5) * 70 : 10;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 600 }}>{r.score > 0 ? r.score : '?'}</div>
                    <div style={{
                      width: '32px', height: `${height}px`,
                      background: cfg.color, borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
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
              padding: '10px 28px', background: 'transparent',
              border: '2px solid #ccc', borderRadius: '50px',
              fontSize: '0.9rem', color: '#888', cursor: 'pointer',
            }}>
              🔄 リセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
