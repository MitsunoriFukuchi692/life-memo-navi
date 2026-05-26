import { useNavigate } from 'react-router-dom';

// 通常プランのカテゴリー
const standardFieldsJa = [
  { key: 'jibunshi', label: '自分史', emoji: '📖', desc: '人生の歩みを質問に答えながら記録します', color: '#C8694A' },
  { key: 'kaishashi', label: '会社史', emoji: '🏢', desc: '創業の物語、節目、価値観を会社の記録として残します', color: '#6B9B6B' },
];

const standardFieldsEn = [
  { key: 'jibunshi', label: 'Life Story', emoji: '📖', desc: 'Record the story of a persons life in a guided format', color: '#C8694A' },
  { key: 'kaishashi', label: 'Company History', emoji: '🏢', desc: 'Preserve the founding story, milestones, and values of a company', color: '#6B9B6B' },
];

// 出版社プランのカテゴリー（自分史のみ）
const publisherFieldsJa = [
  { key: 'jibunshi', label: '自分史', emoji: '📖', desc: '人生の歩みを質問に答えながら記録します', color: '#C8694A' },
];

const publisherFieldsEn = [
  { key: 'jibunshi', label: 'Life Story', emoji: '📖', desc: 'Record the story of a persons life in a guided format', color: '#C8694A' },
];

export default function FieldSelectPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isEnglish = localStorage.getItem('lm_lang') === 'en';
  const isPublisher = user.plan === 'publisher';
  const standardFields = isEnglish ? standardFieldsEn : standardFieldsJa;
  const publisherFields = isEnglish ? publisherFieldsEn : publisherFieldsJa;
  const fields = isPublisher ? publisherFields : standardFields;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', flexDirection: 'column', display: 'flex' }}>
      {/* ヘッダー */}
      <header style={{
        background: 'var(--brown-dark)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <h1 style={{ fontFamily: "'Noto Serif JP', serif", color: 'var(--cream)', fontSize: '1.2rem', fontWeight: 600 }}>
          {isEnglish ? (isPublisher ? 'Life Story App' : 'Life Memo Navi') : 'ライフメモナビ'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--brown-light)', fontSize: '0.9rem' }}>{user.name}</span>

          {/* 設定ボタン（通常プランのみ） */}
          {!isPublisher && (
            <button onClick={() => navigate('/settings')} title="Settings" style={{
              background: 'transparent', border: '1px solid var(--brown-light)',
              color: 'var(--brown-light)', padding: '6px 12px', borderRadius: '20px',
              fontSize: '1rem', cursor: 'pointer', lineHeight: 1,
            }}>
              ⚙️
            </button>
          )}

          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--brown-light)',
            color: 'var(--brown-light)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem',
            cursor: 'pointer',
          }}>{isEnglish ? 'logout' : 'ログアウト'}</button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '8px' }}>{isEnglish ? 'Welcome' : 'ようこそ'}</p>
          <h2 style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: '2rem', color: 'var(--brown-dark)', marginBottom: '16px',
          }}>
            {user.name}
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', lineHeight: 1.8 }}>
            {isPublisher
              ? (isEnglish ? 'Start your life story' : '自分史の記録を始めましょう')
              : (isEnglish ? 'Choose what you want to preserve' : '記録したいものを選んでください')}
          </p>
        </div>

        {/* カテゴリーカード */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPublisher ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          maxWidth: isPublisher ? '400px' : '900px',
          width: '100%',
        }}>
          {fields.map(field => (
            <div
              key={field.key}
              onClick={() => navigate(`/field/${field.key}`)}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius)',
                padding: '40px 28px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--cream-dark)',
                cursor: 'pointer',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                (e.currentTarget as HTMLDivElement).style.borderColor = field.color;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cream-dark)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{field.emoji}</div>
              <h3 style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: '1.4rem', color: 'var(--brown-dark)', marginBottom: '10px',
              }}>
                {field.label}
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {field.desc}
              </p>
              <div style={{
                display: 'inline-block', marginTop: '20px',
                background: `${field.color}20`, color: field.color,
                padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500,
              }}>
                {isEnglish ? 'Open →' : '開く →'}
              </div>
            </div>
          ))}
        </div>

        {/* 出版社プラン：Mood Checkボタン */}
        {isPublisher && (
          <div
            onClick={() => navigate('/face-test')}
            style={{
              marginTop: '32px',
              maxWidth: '400px',
              width: '100%',
              background: 'linear-gradient(135deg, #fff8f0, #fdeede)',
              border: '2px solid #f0c070',
              borderRadius: 'var(--radius)',
              padding: '28px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>😊</div>
            <h3 style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: '1.3rem', color: '#a06020', marginBottom: '8px',
            }}>
              {isEnglish ? 'Mood Check' : '表情チェック'}
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {isEnglish ? 'Use the camera to check today`s expression on a five-step scale.' : 'カメラで今日の表情を5段階で確認します。'}
            </p>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #c9773a, #e8956d)',
              color: 'white', padding: '10px 28px',
              borderRadius: '50px', fontWeight: 600, fontSize: '0.95rem',
            }}>
              {isEnglish ? '😊 Check →' : '😊 チェック →'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
