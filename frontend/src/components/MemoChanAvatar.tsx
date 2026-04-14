// ============================================================
// メモちゃんアバター（4種類のテイストから選択可能）
// ============================================================

export type AvatarStyle = 'manga' | 'simple' | 'wagara' | 'pop';

interface MemoChanAvatarProps {
  size?: number;
  mood?: 'normal' | 'talking' | 'thinking' | 'listening';
  avatarStyle?: AvatarStyle;
}

function MangaAvatar({ size, mood }: { size: number; mood: string }) {
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking';
  const isListening = mood === 'listening';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 8px rgba(180,80,40,0.18))' }}>
      <ellipse cx="50" cy="40" rx="30" ry="28" fill="#3d1a0a" />
      <ellipse cx="22" cy="50" rx="6" ry="10" fill="#3d1a0a" />
      <ellipse cx="78" cy="50" rx="6" ry="10" fill="#3d1a0a" />
      <ellipse cx="50" cy="46" rx="26" ry="24" fill="#ffe0c8" />
      <path d="M24 38 Q28 18 50 16 Q72 18 76 38 Q70 28 64 32 Q58 20 50 20 Q42 20 36 32 Q30 28 24 38 Z" fill="#3d1a0a" />
      <path d="M32 30 Q30 40 33 44" stroke="#3d1a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M68 30 Q70 40 67 44" stroke="#3d1a0a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50 17 Q49 30 50 36" stroke="#3d1a0a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="24" cy="46" rx="4" ry="5" fill="#ffd0b0" />
      <ellipse cx="76" cy="46" rx="4" ry="5" fill="#ffd0b0" />
      <ellipse cx="35" cy="54" rx="6" ry="4" fill="#ffb0b0" opacity="0.55" />
      <ellipse cx="65" cy="54" rx="6" ry="4" fill="#ffb0b0" opacity="0.55" />
      {isThinking ? (
        <>
          <path d="M36 44 Q40 42 44 44" stroke="#3d1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 44 Q60 42 64 44" stroke="#3d1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : isListening ? (
        <>
          <ellipse cx="40" cy="45" rx="6" ry="7" fill="#3d1a0a" />
          <ellipse cx="60" cy="45" rx="6" ry="7" fill="#3d1a0a" />
          <ellipse cx="42" cy="43" rx="2" ry="2.5" fill="white" />
          <ellipse cx="62" cy="43" rx="2" ry="2.5" fill="white" />
        </>
      ) : (
        <>
          <ellipse cx="40" cy="45" rx="6" ry="6.5" fill="white" />
          <ellipse cx="60" cy="45" rx="6" ry="6.5" fill="white" />
          <ellipse cx="40" cy="46" rx="4" ry="5" fill="#2a0a0a" />
          <ellipse cx="60" cy="46" rx="4" ry="5" fill="#2a0a0a" />
          <ellipse cx="40" cy="44" rx="3" ry="3.5" fill="#7b3a10" />
          <ellipse cx="60" cy="44" rx="3" ry="3.5" fill="#7b3a10" />
          <ellipse cx="42" cy="42.5" rx="1.5" ry="2" fill="white" />
          <ellipse cx="62" cy="42.5" rx="1.5" ry="2" fill="white" />
          <line x1="34" y1="40" x2="36" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="38" x2="40" y2="36.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="46" y1="40" x2="47" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="54" y1="40" x2="53" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="38" x2="60" y2="36.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="66" y1="40" x2="67" y2="38.5" stroke="#3d1a0a" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="50" cy="53" rx="1.5" ry="1" fill="#e8a080" opacity="0.7" />
      {isTalking ? (
        <>
          <path d="M42 60 Q50 68 58 60" stroke="#3d1a0a" strokeWidth="2" fill="#ff9090" strokeLinecap="round" />
          <path d="M44 61 Q50 66 56 61" fill="white" />
        </>
      ) : isThinking ? (
        <path d="M44 61 Q50 58 56 61" stroke="#3d1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <path d="M42 59 Q50 67 58 59" stroke="#3d1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M42 59 Q50 66 58 59" fill="#ffb0b0" opacity="0.4" />
        </>
      )}
      <circle cx="32" cy="28" r="5" fill="#ff85a2" />
      <circle cx="32" cy="28" r="3" fill="#ffb8cc" />
      <circle cx="32" cy="28" r="1.5" fill="#ff4d79" />
      <ellipse cx="32" cy="22" rx="2" ry="3" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="32" cy="34" rx="2" ry="3" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="26" cy="28" rx="3" ry="2" fill="#ff85a2" opacity="0.8" />
      <ellipse cx="38" cy="28" rx="3" ry="2" fill="#ff85a2" opacity="0.8" />
      <rect x="44" y="69" width="12" height="7" rx="4" fill="#ffe0c8" />
      <path d="M40 76 Q50 79 60 76 Q59 90 50 90 Q41 90 40 76 Z" fill="#ff85a2" />
      <path d="M50 78 L47 84 L50 82 L53 84 Z" fill="#ffb8cc" />
    </svg>
  );
}

function SimpleAvatar({ size, mood }: { size: number; mood: string }) {
  const isTalking = mood === 'talking';
  const isThinking = mood === 'thinking';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 12px rgba(80,140,220,0.22))' }}>
      <circle cx="50" cy="50" r="44" fill="#e8f4ff" />
      <ellipse cx="50" cy="82" rx="20" ry="12" fill="#5b9bd5" />
      <circle cx="50" cy="44" r="28" fill="#fff5e6" />
      <ellipse cx="50" cy="22" rx="22" ry="10" fill="#5b9bd5" />
      <rect x="28" y="22" width="44" height="10" fill="#5b9bd5" />
      <circle cx="22" cy="44" r="5" fill="#ffd5b8" />
      <circle cx="78" cy="44" r="5" fill="#ffd5b8" />
      {isThinking ? (
        <>
          <path d="M37 42 Q41 40 45 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M55 42 Q59 40 63 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="40" cy="44" r="5" fill="#333" />
          <circle cx="60" cy="44" r="5" fill="#333" />
          <circle cx="42" cy="42" r="1.8" fill="white" />
          <circle cx="62" cy="42" r="1.8" fill="white" />
        </>
      )}
      <ellipse cx="33" cy="52" rx="5" ry="3.5" fill="#ffaaaa" opacity="0.5" />
      <ellipse cx="67" cy="52" rx="5" ry="3.5" fill="#ffaaaa" opacity="0.5" />
      {isTalking ? (
        <ellipse cx="50" cy="58" rx="7" ry="5" fill="#ff9090" />
      ) : (
        <path d="M43 57 Q50 64 57 57" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      <text x="68" y="26" fontSize="12" fill="#ffd700">&#9733;</text>
    </svg>
  );
}

function WagaraAvatar({ size, mood }: { size: number; mood: string }) {
  const isTalking = mood === 'talking';
  const isThinking = mood === 'thinking';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 12px rgba(160,80,120,0.22))' }}>
      <circle cx="50" cy="50" r="44" fill="#fff5f8" />
      <path d="M30 80 Q35 65 50 62 Q65 65 70 80 Q60 90 50 90 Q40 90 30 80Z" fill="#c0392b" />
      <rect x="36" y="72" width="28" height="7" rx="3" fill="#f39c12" />
      <rect x="44" y="66" width="12" height="8" rx="4" fill="#ffe0c8" />
      <ellipse cx="50" cy="44" rx="26" ry="26" fill="#fff0e6" />
      <ellipse cx="50" cy="22" rx="20" ry="10" fill="#1a0a00" />
      <ellipse cx="50" cy="28" rx="26" ry="8" fill="#1a0a00" />
      <ellipse cx="24" cy="40" rx="5" ry="12" fill="#1a0a00" />
      <ellipse cx="76" cy="40" rx="5" ry="12" fill="#1a0a00" />
      <line x1="62" y1="18" x2="62" y2="30" stroke="#c0392b" strokeWidth="2" />
      <circle cx="62" cy="17" r="4" fill="#e74c3c" />
      <circle cx="62" cy="17" r="2" fill="#f1948a" />
      <ellipse cx="24" cy="46" rx="4" ry="5" fill="#ffd5b8" />
      <ellipse cx="76" cy="46" rx="4" ry="5" fill="#ffd5b8" />
      <ellipse cx="35" cy="52" rx="5" ry="3.5" fill="#e91e8c" opacity="0.25" />
      <ellipse cx="65" cy="52" rx="5" ry="3.5" fill="#e91e8c" opacity="0.25" />
      {isThinking ? (
        <>
          <path d="M36 43 Q40 41 44 43" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M56 43 Q60 41 64 43" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M34 44 Q40 40 46 44" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M54 44 Q60 40 66 44" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="45" rx="4" ry="3.5" fill="#1a0a00" />
          <ellipse cx="60" cy="45" rx="4" ry="3.5" fill="#1a0a00" />
          <ellipse cx="41" cy="44" rx="1.2" ry="1.5" fill="white" />
          <ellipse cx="61" cy="44" rx="1.2" ry="1.5" fill="white" />
        </>
      )}
      {isTalking ? (
        <ellipse cx="50" cy="57" rx="5" ry="4" fill="#e74c3c" opacity="0.8" />
      ) : (
        <path d="M45 57 Q50 62 55 57" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

function PopAvatar({ size, mood }: { size: number; mood: string }) {
  const isTalking = mood === 'talking';
  const isThinking = mood === 'thinking';
  const isListening = mood === 'listening';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 12px rgba(255,160,0,0.28))' }}>
      <circle cx="50" cy="50" r="44" fill="#fff9e6" />
      <path d="M28 88 Q35 68 50 65 Q65 68 72 88" fill="#ff6b35" />
      <rect x="44" y="66" width="12" height="7" rx="4" fill="#ffe0c8" />
      <circle cx="50" cy="44" r="28" fill="#ffe8cc" />
      <ellipse cx="50" cy="20" rx="24" ry="12" fill="#ff6b35" />
      <ellipse cx="50" cy="26" rx="28" ry="8" fill="#ff6b35" />
      <path d="M50 14 Q54 6 52 2" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="2" r="3" fill="#ffd700" />
      <ellipse cx="22" cy="44" rx="6" ry="12" fill="#ff6b35" />
      <ellipse cx="78" cy="44" rx="6" ry="12" fill="#ff6b35" />
      <circle cx="22" cy="44" r="5" fill="#ffd5b8" />
      <circle cx="78" cy="44" r="5" fill="#ffd5b8" />
      <ellipse cx="33" cy="53" rx="6" ry="4" fill="#ff6b6b" opacity="0.5" />
      <ellipse cx="67" cy="53" rx="6" ry="4" fill="#ff6b6b" opacity="0.5" />
      {isThinking ? (
        <>
          <path d="M36 43 Q40 40 44 43" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M56 43 Q60 40 64 43" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : isListening ? (
        <>
          <ellipse cx="40" cy="44" rx="7" ry="8" fill="#333" />
          <ellipse cx="60" cy="44" rx="7" ry="8" fill="#333" />
          <ellipse cx="43" cy="41" rx="2.5" ry="3" fill="white" />
          <ellipse cx="63" cy="41" rx="2.5" ry="3" fill="white" />
        </>
      ) : (
        <>
          <ellipse cx="40" cy="44" rx="6" ry="7" fill="#333" />
          <ellipse cx="60" cy="44" rx="6" ry="7" fill="#333" />
          <ellipse cx="43" cy="41" rx="2" ry="2.5" fill="white" />
          <ellipse cx="63" cy="41" rx="2" ry="2.5" fill="white" />
          <line x1="34" y1="39" x2="37" y2="36" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="37" x2="40" y2="34" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="39" x2="48" y2="36" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="39" x2="52" y2="36" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="37" x2="60" y2="34" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="66" y1="39" x2="63" y2="36" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {isTalking ? (
        <>
          <ellipse cx="50" cy="59" rx="8" ry="6" fill="#ff4444" />
          <path d="M43 59 Q50 64 57 59" fill="white" />
        </>
      ) : isThinking ? (
        <path d="M44 59 Q50 55 56 59" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M41 58 Q50 68 59 58" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function MemoChanAvatar({ size = 80, mood = 'normal', avatarStyle = 'manga' }: MemoChanAvatarProps) {
  switch (avatarStyle) {
    case 'simple':  return <SimpleAvatar size={size} mood={mood} />;
    case 'wagara':  return <WagaraAvatar size={size} mood={mood} />;
    case 'pop':     return <PopAvatar size={size} mood={mood} />;
    case 'manga':
    default:        return <MangaAvatar size={size} mood={mood} />;
  }
}
