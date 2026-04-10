// ============================================================
// メモちゃんアバター（漫画風・女の子）
// ============================================================

interface MemoChanAvatarProps {
  size?: number;
  mood?: 'normal' | 'talking' | 'thinking' | 'listening';
}

export default function MemoChanAvatar({ size = 80, mood = 'normal' }: MemoChanAvatarProps) {
  // 表情によって目・口を変える
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking';
  const isListening = mood === 'listening';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 8px rgba(180,80,40,0.18))' }}
    >
      {/* ---- 髪（後ろ・ショートボブ） ---- */}
      {/* 後ろ髪（丸みのあるボブ） */}
      <ellipse cx="50" cy="40" rx="30" ry="28" fill="#3d1a0a" />
      {/* 左右の髪が少し広がる（ボブの膨らみ） */}
      <ellipse cx="22" cy="50" rx="6" ry="10" fill="#3d1a0a" />
      <ellipse cx="78" cy="50" rx="6" ry="10" fill="#3d1a0a" />

      {/* ---- 顔（肌） ---- */}
      <ellipse cx="50" cy="46" rx="26" ry="24" fill="#ffe0c8" />

      {/* ---- 前髪 ---- */}
      <path
        d="M24 38 Q28 18 50 16 Q72 18 76 38
           Q70 28 64 32 Q58 20 50 20 Q42 20 36 32 Q30 28 24 38 Z"
        fill="#3d1a0a"
      />
      {/* 前髪・前に垂れるふさ */}
      <path d="M32 30 Q30 40 33 44" stroke="#3d1a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M68 30 Q70 40 67 44" stroke="#3d1a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50 17 Q49 30 50 36" stroke="#3d1a0a" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ---- 耳 ---- */}
      <ellipse cx="24" cy="46" rx="4" ry="5" fill="#ffd0b0" />
      <ellipse cx="76" cy="46" rx="4" ry="5" fill="#ffd0b0" />

      {/* ---- ほっぺ（チーク） ---- */}
      <ellipse cx="35" cy="54" rx="6" ry="4" fill="#ffb0b0" opacity="0.55" />
      <ellipse cx="65" cy="54" rx="6" ry="4" fill="#ffb0b0" opacity="0.55" />

      {/* ---- 目 ---- */}
      {isThinking ? (
        // 考え中：半目
        <>
          <path d="M36 44 Q40 42 44 44" stroke="#3d1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 44 Q60 42 64 44" stroke="#3d1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : isListening ? (
        // 聞いている：目を丸く大きく
        <>
          <ellipse cx="40" cy="45" rx="6" ry="7" fill="#3d1a0a" />
          <ellipse cx="60" cy="45" rx="6" ry="7" fill="#3d1a0a" />
          <ellipse cx="42" cy="43" rx="2" ry="2.5" fill="white" />
          <ellipse cx="62" cy="43" rx="2" ry="2.5" fill="white" />
        </>
      ) : (
        // 通常・話し中：ぱっちり目（漫画風）
        <>
          {/* 白目 */}
          <ellipse cx="40" cy="45" rx="6" ry="6.5" fill="white" />
          <ellipse cx="60" cy="45" rx="6" ry="6.5" fill="white" />
          {/* 黒目 */}
          <ellipse cx="40" cy="46" rx="4" ry="5" fill="#2a0a0a" />
          <ellipse cx="60" cy="46" rx="4" ry="5" fill="#2a0a0a" />
          {/* 茶色のハイライト */}
          <ellipse cx="40" cy="44" rx="3" ry="3.5" fill="#7b3a10" />
          <ellipse cx="60" cy="44" rx="3" ry="3.5" fill="#7b3a10" />
          {/* キラキラハイライト */}
          <ellipse cx="42" cy="42.5" rx="1.5" ry="2" fill="white" />
          <ellipse cx="62" cy="42.5" rx="1.5" ry="2" fill="white" />
          <ellipse cx="38.5" cy="48" rx="0.8" ry="0.8" fill="white" opacity="0.7" />
          <ellipse cx="58.5" cy="48" rx="0.8" ry="0.8" fill="white" opacity="0.7" />
          {/* まつ毛 */}
          <line x1="34" y1="40" x2="36" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="37" y1="38.5" x2="38" y2="37" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="38" x2="40" y2="36.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="43" y1="38.5" x2="44" y2="37" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="46" y1="40" x2="47" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="54" y1="40" x2="53" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="57" y1="38.5" x2="56" y2="37" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="38" x2="60" y2="36.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="63" y1="38.5" x2="64" y2="37" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="66" y1="40" x2="67" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {/* ---- 鼻 ---- */}
      <ellipse cx="50" cy="53" rx="1.5" ry="1" fill="#e8a080" opacity="0.7" />

      {/* ---- 口 ---- */}
      {isTalking ? (
        // 話し中：口を開けた笑顔
        <>
          <path d="M42 60 Q50 68 58 60" stroke="#3d1a0a" strokeWidth="2" fill="#ff9090" strokeLinecap="round" />
          <path d="M42 60 Q50 68 58 60" fill="#ff9090" />
          {/* 歯 */}
          <path d="M44 61 Q50 66 56 61" fill="white" />
        </>
      ) : isThinking ? (
        // 考え中：へにゃっと口
        <path d="M44 61 Q50 58 56 61" stroke="#3d1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        // 通常：にっこり笑顔
        <>
          <path d="M42 59 Q50 67 58 59" stroke="#3d1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M42 59 Q50 66 58 59" fill="#ffb0b0" opacity="0.4" />
        </>
      )}

      {/* ---- ヘアアクセサリー（左にピンク桜ピン） ---- */}
      <circle cx="32" cy="28" r="5" fill="#ff85a2" />
      <circle cx="32" cy="28" r="3" fill="#ffb8cc" />
      <circle cx="32" cy="28" r="1.5" fill="#ff4d79" />
      {/* 花びら */}
      <ellipse cx="32" cy="22" rx="2" ry="3" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="32" cy="34" rx="2" ry="3" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="26" cy="28" rx="3" ry="2" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="38" cy="28" rx="3" ry="2" fill="#ff85a2" opacity="0.8" />

      {/* ---- 首・体（ちょこっと） ---- */}
      <rect x="44" y="69" width="12" height="7" rx="4" fill="#ffe0c8" />
      {/* 服（小さめ・胸元だけ） */}
      <path d="M40 76 Q50 79 60 76 Q59 90 50 90 Q41 90 40 76 Z" fill="#ff85a2" />
      {/* リボン */}
      <path d="M50 78 L47 84 L50 82 L53 84 Z" fill="#ffb8cc" />
    </svg>
  );
}
