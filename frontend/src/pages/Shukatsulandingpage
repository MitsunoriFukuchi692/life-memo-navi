import { useNavigate } from 'react-router-dom';

export default function ShukatsuLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        :root {
          --cream: #FAF6F0; --cream-dark: #F0E8D8;
          --brown-light: #C4A882; --brown: #8B7355;
          --brown-dark: #5C4033; --brown-deeper: #3D2B1F;
          --purple: #6B3FA0; --purple-light: #9B59B6;
          --purple-pale: #F5EEF8; --purple-mid: #D7BDE2;
          --green: #27AE60; --orange: #E67E22;
          --text: #2C2C2C; --text-light: #7A6A5A;
          --white: #FFFFFF;
          --shadow: 0 4px 24px rgba(92,64,51,0.10);
          --shadow-lg: 0 12px 48px rgba(92,64,51,0.18);
        }
        .sl * { margin:0; padding:0; box-sizing:border-box; }
        .sl { font-family:'Noto Sans JP',sans-serif; background:var(--cream); color:var(--text); overflow-x:hidden; }

        /* ナビ */
        .sl-nav {
          position:fixed; top:0; left:0; right:0; z-index:100;
          background:rgba(250,246,240,0.95); backdrop-filter:blur(12px);
          border-bottom:1px solid var(--cream-dark);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 5%; height:64px;
        }
        .sl-nav-logo {
          font-family:'Noto Serif JP',serif; font-size:1.1rem; font-weight:600;
          color:var(--purple); cursor:pointer; display:flex; align-items:center; gap:8px;
        }
        .sl-nav-btn {
          background:var(--purple); color:white;
          padding:10px 24px; border-radius:24px; font-size:0.9rem;
          border:none; cursor:pointer; font-family:inherit; font-weight:500;
          transition:all 0.2s;
        }
        .sl-nav-btn:hover { background:var(--brown-deeper); transform:translateY(-1px); }

        /* ヒーロー */
        .sl-hero {
          min-height:100vh; display:flex; align-items:center;
          padding:100px 5% 80px; position:relative; overflow:hidden;
          background:linear-gradient(135deg, #FAF6F0 0%, #F5EEF8 50%, #FAF6F0 100%);
        }
        .sl-hero::before {
          content:''; position:absolute; top:0; right:0; width:50%; height:100%;
          background:radial-gradient(ellipse at 70% 40%, #D7BDE2 0%, transparent 60%);
          z-index:0;
        }
        .sl-hero-content { position:relative; z-index:1; max-width:580px; }
        .sl-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:var(--purple-pale); border:1px solid var(--purple-mid);
          border-radius:24px; padding:6px 16px;
          font-size:0.8rem; color:var(--purple); margin-bottom:28px; font-weight:500;
        }
        .sl-hero h1 {
          font-family:'Noto Serif JP',serif;
          font-size:clamp(1.8rem,4vw,2.8rem);
          line-height:1.5; color:var(--brown-dark); margin-bottom:20px; font-weight:700;
        }
        .sl-hero h1 em { font-style:normal; color:var(--purple); border-bottom:3px solid var(--purple-mid); }
        .sl-hero p { font-size:1rem; line-height:1.9; color:var(--text-light); margin-bottom:40px; }
        .sl-btns { display:flex; gap:16px; flex-wrap:wrap; }
        .sl-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          background:var(--purple); color:white;
          padding:16px 36px; border-radius:8px; font-size:1rem; font-weight:600;
          border:none; cursor:pointer; font-family:inherit;
          box-shadow:0 8px 24px rgba(107,63,160,0.3); transition:all 0.25s;
        }
        .sl-btn-primary:hover { background:var(--brown-deeper); transform:translateY(-2px); }
        .sl-btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          background:transparent; color:var(--purple);
          padding:16px 24px; border-radius:8px; font-size:0.95rem; font-weight:500;
          border:2px solid var(--purple-mid); cursor:pointer; font-family:inherit; transition:all 0.25s;
        }
        .sl-btn-secondary:hover { border-color:var(--purple); background:var(--purple-pale); }

        /* ヒーロービジュアル */
        .sl-hero-visual {
          position:absolute; right:5%; top:50%; transform:translateY(-50%);
          width:min(420px,40vw); z-index:1;
        }
        .sl-card {
          background:white; border-radius:20px; padding:28px;
          box-shadow:var(--shadow-lg); border:1px solid var(--cream-dark);
        }
        .sl-card-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .sl-card-icon { font-size:1.8rem; }
        .sl-card-title { font-family:'Noto Serif JP',serif; font-size:1rem; color:var(--purple); font-weight:600; }
        .sl-cat-item {
          display:flex; align-items:center; gap:12px;
          padding:12px 0; border-bottom:1px solid var(--cream-dark);
        }
        .sl-cat-item:last-child { border-bottom:none; }
        .sl-cat-emoji { font-size:1.4rem; width:36px; text-align:center; }
        .sl-cat-text { flex:1; }
        .sl-cat-name { font-size:0.9rem; font-weight:600; color:var(--brown-dark); }
        .sl-cat-desc { font-size:0.75rem; color:var(--text-light); margin-top:2px; }
        .sl-cat-check { color:var(--green); font-size:1.1rem; }

        /* 統計 */
        .sl-stats {
          background:var(--purple); padding:56px 5%;
          display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
          gap:32px; text-align:center;
        }
        .sl-stat-num {
          font-family:'Noto Serif JP',serif; font-size:2.4rem;
          font-weight:700; color:white; line-height:1; margin-bottom:8px;
        }
        .sl-stat-label { color:var(--purple-mid); font-size:0.85rem; }

        /* セクション共通 */
        .sl-section { padding:90px 5%; }
        .sl-section-label { font-size:0.76rem; letter-spacing:0.15em; color:var(--purple); text-transform:uppercase; margin-bottom:10px; font-weight:500; }
        .sl-section-title { font-family:'Noto Serif JP',serif; font-size:clamp(1.5rem,3vw,2.1rem); color:var(--brown-dark); line-height:1.5; margin-bottom:14px; font-weight:700; }
        .sl-section-sub { font-size:0.95rem; color:var(--text-light); line-height:1.9; max-width:540px; }
        .sl-section-header { margin-bottom:52px; }

        /* 課題 */
        .sl-worries { background:var(--cream-dark); }
        .sl-worry-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; }
        .sl-worry-card {
          background:white; border-radius:16px; padding:28px;
          border-left:4px solid var(--purple-mid);
        }
        .sl-worry-icon { font-size:1.8rem; margin-bottom:14px; }
        .sl-worry-card h3 { font-family:'Noto Serif JP',serif; font-size:1rem; color:var(--brown-dark); margin-bottom:10px; font-weight:600; }
        .sl-worry-card p { font-size:0.88rem; color:var(--text-light); line-height:1.8; }

        /* 4カテゴリ */
        .sl-cats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
        .sl-cat-card {
          background:white; border-radius:20px; padding:32px;
          box-shadow:var(--shadow); border:1px solid var(--cream-dark);
          transition:all 0.3s; position:relative; overflow:hidden;
        }
        .sl-cat-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:5px;
          transition:transform 0.3s; transform-origin:left;
        }
        .sl-cat-card.c1::before { background:linear-gradient(90deg,#4A90D9,#27AE60); }
        .sl-cat-card.c2::before { background:linear-gradient(90deg,#27AE60,#F39C12); }
        .sl-cat-card.c3::before { background:linear-gradient(90deg,#8E44AD,#E91E63); }
        .sl-cat-card.c4::before { background:linear-gradient(90deg,#E67E22,#E74C3C); }
        .sl-cat-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); }
        .sl-cat-card:hover::before { transform:scaleX(1); }
        .sl-cat-card::before { transform:scaleX(0.3); }
        .sl-cat-big-icon { font-size:2.8rem; margin-bottom:16px; }
        .sl-cat-card h3 { font-family:'Noto Serif JP',serif; font-size:1.15rem; color:var(--brown-dark); margin-bottom:12px; font-weight:700; }
        .sl-cat-card p { font-size:0.88rem; color:var(--text-light); line-height:1.8; margin-bottom:16px; }
        .sl-cat-items { list-style:none; }
        .sl-cat-items li { font-size:0.82rem; color:var(--text-light); padding:4px 0; display:flex; align-items:center; gap:6px; }
        .sl-cat-items li::before { content:'✓'; color:var(--green); font-weight:700; font-size:0.9rem; }

        /* AI対話 */
        .sl-ai { background:linear-gradient(135deg, #F5EEF8, #FAF6F0); }
        .sl-ai-inner { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .sl-chat-demo {
          background:white; border-radius:20px; padding:24px;
          box-shadow:var(--shadow-lg); border:1px solid var(--cream-dark);
        }
        .sl-chat-header {
          display:flex; align-items:center; gap:10px;
          padding-bottom:16px; border-bottom:1px solid var(--cream-dark); margin-bottom:20px;
        }
        .sl-chat-avatar { width:36px; height:36px; border-radius:50%; background:var(--purple-pale); display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
        .sl-chat-name { font-size:0.9rem; font-weight:600; color:var(--purple); }
        .sl-chat-msg { display:flex; gap:10px; margin-bottom:14px; }
        .sl-chat-msg.user { flex-direction:row-reverse; }
        .sl-chat-bubble {
          max-width:80%; padding:10px 14px; border-radius:14px;
          font-size:0.85rem; line-height:1.7;
        }
        .sl-chat-bubble.ai { background:var(--purple-pale); color:var(--brown-dark); border:1px solid var(--purple-mid); }
        .sl-chat-bubble.user { background:var(--purple); color:white; }
        .sl-ai-points { list-style:none; }
        .sl-ai-point { display:flex; gap:16px; margin-bottom:28px; }
        .sl-ai-point-icon { width:48px; height:48px; border-radius:12px; background:var(--purple-pale); display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; }
        .sl-ai-point-title { font-size:1rem; font-weight:600; color:var(--brown-dark); margin-bottom:6px; }
        .sl-ai-point-text { font-size:0.88rem; color:var(--text-light); line-height:1.7; }

        /* 使い方ステップ */
        .sl-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:32px; position:relative; }
        .sl-steps::before {
          content:''; position:absolute; top:32px; left:10%; right:10%; height:2px;
          background:var(--purple-mid); z-index:0;
        }
        .sl-step { text-align:center; position:relative; z-index:1; }
        .sl-step-num {
          width:64px; height:64px; border-radius:50%;
          background:var(--purple); color:white;
          font-family:'Noto Serif JP',serif; font-size:1.4rem; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 20px; box-shadow:0 4px 16px rgba(107,63,160,0.3);
        }
        .sl-step h3 { font-family:'Noto Serif JP',serif; font-size:1rem; color:var(--brown-dark); margin-bottom:10px; font-weight:600; }
        .sl-step p { font-size:0.85rem; color:var(--text-light); line-height:1.8; }

        /* 声 */
        .sl-voices { background:var(--cream-dark); }
        .sl-voices-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .sl-voice-card {
          background:white; border-radius:16px; padding:28px;
          box-shadow:var(--shadow); position:relative;
        }
        .sl-voice-card::before { content:'"'; font-size:4rem; color:var(--purple-mid); position:absolute; top:10px; left:20px; font-family:serif; line-height:1; }
        .sl-voice-text { font-size:0.9rem; color:var(--text-light); line-height:1.9; margin-bottom:16px; padding-top:24px; }
        .sl-voice-author { font-size:0.82rem; color:var(--purple); font-weight:600; }

        /* 料金 */
        .sl-pricing { background:white; }
        .sl-price-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; max-width:900px; margin:0 auto; }
        .sl-price-card {
          border-radius:20px; padding:36px; border:2px solid var(--cream-dark);
          position:relative; transition:all 0.3s;
        }
        .sl-price-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); }
        .sl-price-card.featured { border-color:var(--purple); background:var(--purple-pale); }
        .sl-price-badge {
          position:absolute; top:-14px; left:50%; transform:translateX(-50%);
          background:var(--purple); color:white;
          padding:6px 20px; border-radius:20px; font-size:0.8rem; font-weight:600;
          white-space:nowrap;
        }
        .sl-price-name { font-size:0.9rem; color:var(--text-light); margin-bottom:8px; }
        .sl-price-num { font-family:'Noto Serif JP',serif; font-size:2.6rem; font-weight:700; color:var(--purple); margin-bottom:4px; }
        .sl-price-trial { font-size:0.82rem; color:var(--green); font-weight:600; margin-bottom:8px; }
        .sl-price-desc { font-size:0.82rem; color:var(--text-light); margin-bottom:20px; }
        .sl-price-feats { list-style:none; margin-bottom:28px; }
        .sl-price-feats li { font-size:0.88rem; color:var(--text-light); padding:6px 0; display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--cream-dark); }
        .sl-price-feats li::before { content:'✓'; color:var(--green); font-weight:700; }

        /* CTA */
        .sl-cta {
          background:linear-gradient(135deg, var(--purple), #4A235A);
          padding:90px 5%; text-align:center; color:white;
        }
        .sl-cta h2 { font-family:'Noto Serif JP',serif; font-size:clamp(1.5rem,3vw,2.2rem); margin-bottom:20px; font-weight:700; }
        .sl-cta p { font-size:1rem; opacity:0.85; line-height:1.9; margin-bottom:40px; }
        .sl-cta-btns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
        .sl-btn-light {
          background:white; color:var(--purple);
          padding:16px 36px; border-radius:8px; font-size:1rem; font-weight:700;
          border:none; cursor:pointer; font-family:inherit; transition:all 0.25s;
          box-shadow:0 4px 16px rgba(0,0,0,0.2);
        }
        .sl-btn-light:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
        .sl-btn-ghost {
          background:transparent; color:white;
          padding:16px 28px; border-radius:8px; font-size:0.95rem; font-weight:500;
          border:2px solid rgba(255,255,255,0.5); cursor:pointer; font-family:inherit; transition:all 0.25s;
        }
        .sl-btn-ghost:hover { border-color:white; background:rgba(255,255,255,0.1); }

        /* フッター */
        .sl-footer { background:var(--brown-deeper); color:var(--cream); padding:48px 5% 24px; }
        .sl-footer-inner { display:grid; grid-template-columns:2fr 1fr 1fr; gap:40px; margin-bottom:40px; }
        .sl-footer-logo { font-family:'Noto Serif JP',serif; font-size:1.1rem; color:var(--purple-mid); margin-bottom:12px; }
        .sl-footer p { font-size:0.85rem; color:rgba(250,246,240,0.6); line-height:1.8; }
        .sl-footer-links h4 { font-size:0.85rem; color:var(--brown-light); margin-bottom:14px; }
        .sl-footer-links a { display:block; font-size:0.82rem; color:rgba(250,246,240,0.6); text-decoration:none; margin-bottom:8px; }
        .sl-footer-links a:hover { color:var(--cream); }
        .sl-footer-bottom { border-top:1px solid rgba(255,255,255,0.1); padding-top:20px; font-size:0.78rem; color:rgba(250,246,240,0.4); text-align:center; }

        @media(max-width:768px) {
          .sl-hero-visual { display:none; }
          .sl-ai-inner { grid-template-columns:1fr; }
          .sl-steps::before { display:none; }
          .sl-footer-inner { grid-template-columns:1fr; gap:24px; }
        }
      `}</style>

      <div className="sl">

        {/* ナビ */}
        <nav className="sl-nav">
          <div className="sl-nav-logo" onClick={() => navigate('/')}>
            📖 終活ノート by Life Memo Navi
          </div>
          <button className="sl-nav-btn" onClick={() => navigate('/register')}>
            無料で始める →
          </button>
        </nav>

        {/* ヒーロー */}
        <section className="sl-hero">
          <div className="sl-hero-content">
            <div className="sl-badge">🌸 AIが優しく寄り添う終活サポート</div>
            <h1>
              大切なことを、<br />
              <em>AIと話しながら</em><br />
              書き残しましょう
            </h1>
            <p>
              医療・介護の希望、財産・相続の情報、葬儀のご希望、<br />
              家族へのメッセージ——。<br />
              「メモちゃん」が優しく質問しながら、<br />
              あなたの大切な意思を丁寧に記録します。
            </p>
            <div className="sl-btns">
              <button className="sl-btn-primary" onClick={() => navigate('/register')}>
                🌸 無料で始める（14日間お試し）
              </button>
              <button className="sl-btn-secondary" onClick={() => navigate('/login')}>
                ログインはこちら
              </button>
            </div>
          </div>

          {/* ヒーローカード */}
          <div className="sl-hero-visual">
            <div className="sl-card">
              <div className="sl-card-header">
                <div className="sl-card-icon">📖</div>
                <div className="sl-card-title">終活ノート — 4つのカテゴリ</div>
              </div>
              {[
                { emoji: '🏥', name: '医療・介護の希望', desc: '延命治療・介護・告知', done: true },
                { emoji: '💰', name: '財産・相続・保険', desc: '通帳・保険・遺言書', done: true },
                { emoji: '🌸', name: '葬儀・お墓の希望', desc: '葬儀の形式・宗教・納骨', done: false },
                { emoji: '💌', name: '家族へのメッセージ', desc: '感謝・想い・お願い', done: false },
              ].map((cat, i) => (
                <div key={i} className="sl-cat-item">
                  <div className="sl-cat-emoji">{cat.emoji}</div>
                  <div className="sl-cat-text">
                    <div className="sl-cat-name">{cat.name}</div>
                    <div className="sl-cat-desc">{cat.desc}</div>
                  </div>
                  <div className="sl-cat-check">{cat.done ? '✅' : '○'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 統計 */}
        <div className="sl-stats">
          {[
            { num: '4', unit: 'つ', label: '終活カテゴリ完全対応' },
            { num: '14', unit: '日', label: '無料トライアル期間' },
            { num: '24', unit: 'h', label: 'いつでも記録・編集可能' },
            { num: '100', unit: '%', label: 'AIによる自動整理' },
          ].map((s, i) => (
            <div key={i}>
              <div className="sl-stat-num">{s.num}<span style={{ fontSize: '1.2rem' }}>{s.unit}</span></div>
              <div className="sl-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* こんな不安はありませんか */}
        <section className="sl-section sl-worries">
          <div className="sl-section-header">
            <div className="sl-section-label">Worries</div>
            <h2 className="sl-section-title">こんなお悩みはありませんか？</h2>
          </div>
          <div className="sl-worry-grid">
            {[
              { icon: '😔', title: '家族に伝えられていない', text: '医療の希望や財産のことを、なかなか家族に話し出せない。もし急に倒れたら、と不安に思っている。' },
              { icon: '📝', title: '何から書けばいいか分からない', text: '終活ノートを買ってみたが、白紙のページを前に何を書けばいいか分からず、そのまま放置してしまっている。' },
              { icon: '💭', title: '気持ちを言葉にするのが難しい', text: '家族への感謝や想いはあるけれど、文章にまとめるのが苦手。書こうとすると手が止まってしまう。' },
              { icon: '🔒', title: 'プライバシーが心配', text: '大切な財産情報や個人的な想いを、デジタルで記録することへの不安がある。安全に保管できるか心配。' },
            ].map((w, i) => (
              <div key={i} className="sl-worry-card">
                <div className="sl-worry-icon">{w.icon}</div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4カテゴリ詳細 */}
        <section className="sl-section">
          <div className="sl-section-header">
            <div className="sl-section-label">Categories</div>
            <h2 className="sl-section-title">4つのカテゴリで<br />大切なことを整理</h2>
            <p className="sl-section-sub">AIメモちゃんが各カテゴリを丁寧にインタビュー。話すだけで記録が完成します。</p>
          </div>
          <div className="sl-cats-grid">
            {[
              {
                cls: 'c1', emoji: '🏥', title: '医療・介護の希望',
                desc: '延命治療や介護について、あなたの意思をしっかり残しましょう。',
                items: ['延命治療への希望', '介護が必要になった時の希望', '告知の希望', '臓器提供・献体の意思']
              },
              {
                cls: 'c2', emoji: '💰', title: '財産・相続・保険情報',
                desc: '大切な書類の場所や相続について、家族が困らないよう整理します。',
                items: ['銀行口座・通帳の保管場所', '生命保険・医療保険の情報', '不動産・土地の有無', '遺言書の有無・相続の希望']
              },
              {
                cls: 'c3', emoji: '🌸', title: '葬儀・お墓の希望',
                desc: '葬儀の形式やお墓について、ご家族への負担を減らすために。',
                items: ['葬儀の規模・形式の希望', '宗教・宗派について', 'お墓・納骨の希望', '好きな花・音楽など']
              },
              {
                cls: 'c4', emoji: '💌', title: '家族へのメッセージ',
                desc: '感謝の気持ちや伝えたいことを、言葉にして残しましょう。',
                items: ['一番伝えたい方へのメッセージ', '感謝の気持ち', '伝えておきたいこと', 'その他の大切な方へ']
              },
            ].map((cat, i) => (
              <div key={i} className={`sl-cat-card ${cat.cls}`}>
                <div className="sl-cat-big-icon">{cat.emoji}</div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <ul className="sl-cat-items">
                  {cat.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AI対話の特徴 */}
        <section className="sl-section sl-ai">
          <div className="sl-ai-inner">
            <div>
              <div className="sl-section-label">AI Interview</div>
              <h2 className="sl-section-title">AIが優しく<br />質問してくれるから<br />書けなくても大丈夫</h2>
              <ul className="sl-ai-points" style={{ marginTop: 32 }}>
                {[
                  { icon: '🤖', title: 'メモちゃんが丁寧に質問', text: 'AIキャラクター「メモちゃん」が、孫のような親しみやすい口調で1つずつ優しく質問します。' },
                  { icon: '🎤', title: '音声入力にも対応', text: 'キーボードが苦手でも大丈夫。マイクボタンを押して話すだけで、自動的に文字になります。' },
                  { icon: '💾', title: 'いつでも途中保存・再開', text: '一度に全部終わらせなくてOK。途中で保存して、気が向いた時に続きから始められます。' },
                  { icon: '📄', title: 'PDFで印刷・共有', text: '記録が完成したらPDFに出力。印刷してご家族に渡したり、大切に保管できます。' },
                ].map((p, i) => (
                  <li key={i} className="sl-ai-point">
                    <div className="sl-ai-point-icon">{p.icon}</div>
                    <div>
                      <div className="sl-ai-point-title">{p.title}</div>
                      <div className="sl-ai-point-text">{p.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* チャットデモ */}
            <div className="sl-chat-demo">
              <div className="sl-chat-header">
                <div className="sl-chat-avatar">🤖</div>
                <div>
                  <div className="sl-chat-name">メモちゃん</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>終活サポートAI</div>
                </div>
              </div>
              <div className="sl-chat-msg">
                <div className="sl-chat-avatar">🤖</div>
                <div className="sl-chat-bubble ai">
                  はじめまして！メモちゃんといいます🌸<br />
                  延命治療についてお気持ちを聞かせてください。「自然な形で過ごしたい」など、どんなお気持ちでも教えてください💊
                </div>
              </div>
              <div className="sl-chat-msg user">
                <div className="sl-chat-bubble user">
                  できるだけ自然な形で、家族に囲まれて過ごしたいです。
                </div>
              </div>
              <div className="sl-chat-msg">
                <div className="sl-chat-avatar">🤖</div>
                <div className="sl-chat-bubble ai">
                  そのお気持ち、とても大切ですね😊<br />
                  では、介護が必要になった時は、どこで過ごしたいとお考えですか？
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 使い方 */}
        <section className="sl-section">
          <div className="sl-section-header" style={{ textAlign: 'center' }}>
            <div className="sl-section-label">How to start</div>
            <h2 className="sl-section-title">かんたん3ステップで<br />はじめられます</h2>
          </div>
          <div className="sl-steps">
            {[
              { n: '1', title: '無料登録する', text: 'メールアドレスとお名前を登録するだけ。120学会会員の方は団体コードを入力すると14日間無料でお試しいただけます。' },
              { n: '2', title: 'AIと対話する', text: 'メモちゃんの質問に答えていくだけ。音声入力も使えるので、話すだけで記録が完成します。' },
              { n: '3', title: 'PDFで保存・共有', text: '完成した終活ノートをPDFで出力。印刷してご家族に渡したり、大切に保管しましょう。' },
            ].map((s, i) => (
              <div key={i} className="sl-step">
                <div className="sl-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 声 */}
        <section className="sl-section sl-voices">
          <div className="sl-section-header">
            <div className="sl-section-label">Voices</div>
            <h2 className="sl-section-title">ご利用いただいた方の声</h2>
          </div>
          <div className="sl-voices-grid">
            {[
              { text: '終活ノートを買ったまま放置していましたが、AIが質問してくれるので気づいたら全部書けていました。家族に渡せてホッとしています。', author: '72歳・女性（浜松市）' },
              { text: 'メモちゃんが孫のような口調で話してくれるので、重くならずに話せました。家族への想いも、初めて言葉にできた気がします。', author: '68歳・男性（静岡市）' },
              { text: '音声入力が使えるので、文字を打つのが苦手な私でも続けられました。大切なことを整理できて、気持ちが軽くなりました。', author: '75歳・女性（名古屋市）' },
            ].map((v, i) => (
              <div key={i} className="sl-voice-card">
                <div className="sl-voice-text">{v.text}</div>
                <div className="sl-voice-author">— {v.author}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 料金 */}
        <section className="sl-section sl-pricing">
          <div className="sl-section-header" style={{ textAlign: 'center' }}>
            <div className="sl-section-label">Pricing</div>
            <h2 className="sl-section-title">料金プラン</h2>
            <p className="sl-section-sub" style={{ margin: '0 auto' }}>120学会会員の方は特別料金でご利用いただけます。</p>
          </div>
          <div className="sl-price-cards">
            <div className="sl-price-card featured">
              <div className="sl-price-badge">🌸 120学会会員様向け</div>
              <div className="sl-price-name">学会会員プラン</div>
              <div className="sl-price-num">¥220<span style={{ fontSize: '1rem', fontWeight: 400 }}>/月</span></div>
              <div className="sl-price-trial">✓ 14日間無料トライアル付き</div>
              <div className="sl-price-desc">団体コード「120-4967」で適用</div>
              <ul className="sl-price-feats">
                {['終活ノート全機能', 'AI対話・音声入力', 'PDF出力', '自分史・会社史も使える', '14日間無料お試し'].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button className="sl-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/register')}>
                14日間無料で試す →
              </button>
            </div>
            <div className="sl-price-card">
              <div className="sl-price-name">通常プラン</div>
              <div className="sl-price-num">¥380<span style={{ fontSize: '1rem', fontWeight: 400 }}>/月</span></div>
              <div className="sl-price-trial" style={{ color: 'var(--orange)' }}>✓ 初回1ヶ月無料</div>
              <div className="sl-price-desc">どなたでもご利用いただけます</div>
              <ul className="sl-price-feats">
                {['終活ノート全機能', 'AI対話・音声入力', 'PDF出力', '自分史・会社史も使える', '初回1ヶ月無料'].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button className="sl-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/register')}>
                1ヶ月無料で試す →
              </button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="sl-cta">
          <h2>大切な想いを、<br />今日から残しましょう</h2>
          <p>
            AIメモちゃんが、あなたのペースで<br />
            優しく寄り添いながら記録をお手伝いします。
          </p>
          <div className="sl-cta-btns">
            <button className="sl-btn-light" onClick={() => navigate('/register')}>
              🌸 無料で始める（14日間お試し）
            </button>
            <button className="sl-btn-ghost" onClick={() => navigate('/')}>
              Life Memo Naviについて詳しく見る →
            </button>
          </div>
        </section>

        {/* フッター */}
        <footer className="sl-footer">
          <div className="sl-footer-inner">
            <div>
              <div className="sl-footer-logo">📖 終活ノート by Life Memo Navi</div>
              <p>AIと対話しながら、大切なことを書き残すサービスです。<br />ロボ・スタディ株式会社が提供しています。</p>
            </div>
            <div className="sl-footer-links">
              <h4>メニュー</h4>
              <a href="#" onClick={() => navigate('/register')}>無料で始める</a>
              <a href="#" onClick={() => navigate('/login')}>ログイン</a>
              <a href="#" onClick={() => navigate('/')}>Life Memo Navi トップ</a>
            </div>
            <div className="sl-footer-links">
              <h4>会社情報</h4>
              <a href="https://robostudy.jp" target="_blank" rel="noreferrer">ロボ・スタディ株式会社</a>
              <a href="/privacy">プライバシーポリシー</a>
              <a href="mailto:mitsunorif@robostudy.jp">お問い合わせ</a>
            </div>
          </div>
          <div className="sl-footer-bottom">
            <p>© 2026 ロボ・スタディ株式会社 All rights reserved. 〒432-8021 浜松市中区佐鳴台</p>
          </div>
        </footer>

      </div>
    </>
  );
}
