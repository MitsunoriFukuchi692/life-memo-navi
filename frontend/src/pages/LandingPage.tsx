import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  // すでにログイン済みなら /home へリダイレクト
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, []);

  return (
    <>
      <style>{`
        :root {
          --cream: #FAF6F0; --cream-dark: #F0E8D8;
          --brown-light: #C4A882; --brown: #8B7355;
          --brown-dark: #5C4033; --brown-deeper: #3D2B1F;
          --accent-warm: #D4763A; --green: #6B9B6B;
          --text: #2C2C2C; --text-light: #7A6A5A;
          --white: #FFFFFF;
          --shadow: 0 4px 24px rgba(92,64,51,0.10);
          --shadow-lg: 0 12px 48px rgba(92,64,51,0.18);
        }
        .lp * { margin:0; padding:0; box-sizing:border-box; }
        .lp { font-family:'Noto Sans JP',sans-serif; background:var(--cream); color:var(--text); overflow-x:hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');

        /* ナビ */
        .lp-nav {
          position:fixed; top:0; left:0; right:0; z-index:100;
          background:rgba(250,246,240,0.92); backdrop-filter:blur(12px);
          border-bottom:1px solid var(--cream-dark);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 5%; height:64px;
        }
        .lp-nav-logo {
          font-family:'Noto Serif JP',serif; font-size:1.15rem; font-weight:600;
          color:var(--brown-dark); text-decoration:none;
          display:flex; align-items:center; gap:10px; cursor:pointer;
        }
        .lp-nav-links { display:flex; gap:28px; list-style:none; }
        .lp-nav-links a { color:var(--brown); font-size:0.88rem; text-decoration:none; }
        .lp-nav-cta {
          background:var(--brown-dark); color:var(--cream) !important;
          padding:8px 22px; border-radius:24px; font-weight:500 !important;
        }

        /* ヒーロー */
        .lp-hero {
          min-height:100vh; display:flex; align-items:center;
          padding:100px 5% 80px; position:relative; overflow:hidden;
        }
        .lp-hero::before {
          content:''; position:absolute; top:0; right:-10%; width:65%; height:100%;
          background:radial-gradient(ellipse at 60% 40%,#E8D5B8 0%,transparent 65%),
                     radial-gradient(ellipse at 80% 80%,#D4C4A8 0%,transparent 50%);
          z-index:0;
        }
        .lp-hero-content { position:relative; z-index:1; max-width:560px; animation:lpFadeUp 1s ease both; }
        .lp-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:var(--cream-dark); border:1px solid var(--brown-light);
          border-radius:24px; padding:6px 16px;
          font-size:0.8rem; color:var(--brown); margin-bottom:28px;
        }
        .lp-hero h1 {
          font-family:'Noto Serif JP',serif; font-size:clamp(1.9rem,4.5vw,3rem);
          line-height:1.45; color:var(--brown-dark); margin-bottom:20px; font-weight:700;
        }
        .lp-hero h1 em { font-style:normal; color:var(--accent-warm); border-bottom:3px solid var(--accent-warm); }
        .lp-hero p { font-size:1rem; line-height:1.9; color:var(--text-light); margin-bottom:40px; }
        .lp-btns { display:flex; gap:16px; flex-wrap:wrap; }
        .lp-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          background:var(--brown-dark); color:var(--cream);
          padding:15px 32px; border-radius:8px; font-size:1rem; font-weight:500;
          text-decoration:none; border:none; cursor:pointer; font-family:inherit;
          box-shadow:var(--shadow-lg); transition:all 0.25s;
        }
        .lp-btn-primary:hover { background:var(--brown-deeper); transform:translateY(-2px); }
        .lp-btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          background:transparent; color:var(--brown-dark);
          padding:15px 24px; border-radius:8px; font-size:0.95rem; font-weight:500;
          text-decoration:none; border:2px solid var(--brown-light); cursor:pointer;
          font-family:inherit; transition:all 0.25s;
        }
        .lp-btn-secondary:hover { border-color:var(--brown-dark); background:var(--cream-dark); }

        /* ヒーローカード */
        .lp-hero-visual {
          position:absolute; right:5%; top:50%; transform:translateY(-50%);
          width:min(440px,42vw); z-index:1; animation:lpFadeIn 1.2s ease both 0.3s;
        }
        .lp-card {
          background:var(--white); border-radius:20px; padding:32px;
          box-shadow:var(--shadow-lg); border:1px solid var(--cream-dark);
        }
        .lp-card-title { font-family:'Noto Serif JP',serif; font-size:0.95rem; color:var(--brown); margin-bottom:18px; }
        .lp-prog-item { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .lp-prog-icon { width:34px; height:34px; background:var(--cream-dark); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.95rem; flex-shrink:0; }
        .lp-prog-bar-wrap { flex:1; background:var(--cream-dark); border-radius:4px; height:8px; overflow:hidden; }
        .lp-prog-bar { height:100%; border-radius:4px; background:var(--brown-light); }
        .lp-prog-label { font-size:0.78rem; color:var(--text-light); min-width:52px; }
        .lp-card-footer { margin-top:20px; padding-top:18px; border-top:1px solid var(--cream-dark); display:flex; justify-content:space-between; align-items:center; }
        .lp-card-footer-text { font-size:0.78rem; color:var(--text-light); }
        .lp-card-btn { background:var(--brown-dark); color:var(--cream); border:none; padding:8px 18px; border-radius:6px; font-size:0.82rem; cursor:pointer; font-family:inherit; }

        /* 数字 */
        .lp-stats {
          background:var(--brown-dark); padding:56px 5%;
          display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:32px; text-align:center;
        }
        .lp-stat-num { font-family:'Noto Serif JP',serif; font-size:2.6rem; font-weight:700; color:var(--cream); line-height:1; margin-bottom:8px; }
        .lp-stat-num span { font-size:1.2rem; }
        .lp-stat-label { color:var(--brown-light); font-size:0.88rem; }

        /* セクション共通 */
        .lp-section { padding:90px 5%; }
        .lp-section-label { font-size:0.76rem; letter-spacing:0.15em; color:var(--accent-warm); text-transform:uppercase; margin-bottom:10px; font-weight:500; }
        .lp-section-title { font-family:'Noto Serif JP',serif; font-size:clamp(1.5rem,3vw,2.2rem); color:var(--brown-dark); line-height:1.5; margin-bottom:14px; font-weight:700; }
        .lp-section-sub { font-size:0.95rem; color:var(--text-light); line-height:1.9; max-width:540px; }
        .lp-section-header { margin-bottom:52px; }

        /* 課題 */
        .lp-problems { background:var(--cream-dark); }
        .lp-prob-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; }
        .lp-prob-card { background:var(--white); border-radius:16px; padding:28px; border-left:4px solid var(--brown-light); }
        .lp-prob-icon { font-size:1.8rem; margin-bottom:14px; }
        .lp-prob-card h3 { font-family:'Noto Serif JP',serif; font-size:1rem; color:var(--brown-dark); margin-bottom:10px; font-weight:600; }
        .lp-prob-card p { font-size:0.88rem; color:var(--text-light); line-height:1.8; }

        /* 機能 */
        .lp-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:28px; }
        .lp-feat-card {
          background:var(--white); border-radius:20px; padding:36px 32px;
          box-shadow:var(--shadow); border:1px solid var(--cream-dark);
          transition:all 0.3s; position:relative; overflow:hidden;
        }
        .lp-feat-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:4px;
          background:linear-gradient(90deg,var(--brown-light),var(--accent-warm));
          transform:scaleX(0); transform-origin:left; transition:transform 0.3s;
        }
        .lp-feat-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); }
        .lp-feat-card:hover::before { transform:scaleX(1); }
        .lp-feat-emoji { font-size:2.4rem; margin-bottom:18px; }
        .lp-feat-card h3 { font-family:'Noto Serif JP',serif; font-size:1.1rem; color:var(--brown-dark); margin-bottom:10px; font-weight:600; }
        .lp-feat-card p { font-size:0.88rem; color:var(--text-light); line-height:1.9; }

        /* 使い方 */
        .lp-how { background:var(--cream-dark); }
        .lp-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:0; position:relative; }
        .lp-steps::before { content:''; position:absolute; top:34px; left:10%; right:10%; height:2px; background:var(--brown-light); opacity:0.4; }
        .lp-step { text-align:center; padding:0 16px; position:relative; z-index:1; }
        .lp-step-num { width:68px; height:68px; background:var(--brown-dark); color:var(--cream); border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Noto Serif JP',serif; font-size:1.5rem; font-weight:700; margin:0 auto 20px; border:4px solid var(--cream-dark); }
        .lp-step h3 { font-family:'Noto Serif JP',serif; font-size:0.95rem; color:var(--brown-dark); margin-bottom:8px; font-weight:600; }
        .lp-step p { font-size:0.83rem; color:var(--text-light); line-height:1.8; }

        /* 分野 */
        .lp-fields-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:20px; }
        .lp-field-card { border-radius:20px; padding:36px 28px; text-align:center; transition:all 0.3s; }
        .lp-field-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); }
        .lp-field-card.f1 { background:linear-gradient(135deg,#FDF4EE,#F5E6D8); border:1px solid #E8C8A8; }
        .lp-field-card.f2 { background:linear-gradient(135deg,#EEF5EE,#D8E8D8); border:1px solid #A8C8A8; }
        .lp-field-card.f3 { background:linear-gradient(135deg,#EEF0F8,#D8DCF0); border:1px solid #A8B0D8; }
        .lp-field-card.f4 { background:linear-gradient(135deg,#F5F0E8,#E8DCC8); border:1px solid #C8B888; }
        .lp-field-emoji { font-size:2.8rem; margin-bottom:14px; }
        .lp-field-card h3 { font-family:'Noto Serif JP',serif; font-size:1.2rem; color:var(--brown-dark); margin-bottom:8px; font-weight:700; }
        .lp-field-card p { font-size:0.85rem; color:var(--text-light); line-height:1.8; }

        /* 声 */
        .lp-voices { background:var(--brown-dark); }
        .lp-voices .lp-section-title { color:var(--cream); }
        .lp-voices .lp-section-label { color:var(--brown-light); }
        .lp-voices .lp-section-sub { color:var(--brown-light); }
        .lp-voices-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; }
        .lp-voice-card { background:rgba(255,255,255,0.07); border:1px solid rgba(196,168,130,0.3); border-radius:16px; padding:28px; }
        .lp-voice-text { font-family:'Noto Serif JP',serif; font-size:0.95rem; color:var(--cream); line-height:1.9; margin-bottom:16px; font-style:italic; }
        .lp-voice-author { color:var(--brown-light); font-size:0.82rem; }

        /* 料金 */

/* トップ料金（ヒーロー直下） */
.lp-top-pricing{
  margin-top:28px;
  background:rgba(255,255,255,0.75);
  border:1px solid var(--cream-dark);
  border-radius:18px;
  padding:18px 18px 14px;
  box-shadow:var(--shadow);
  backdrop-filter:blur(6px);
}
.lp-top-pricing-head{ display:flex; flex-direction:column; gap:4px; margin-bottom:14px; }
.lp-top-pricing-kicker{ font-size:0.78rem; color:var(--brown); letter-spacing:0.02em; }
.lp-top-pricing-title{ font-family:'Noto Serif JP',serif; font-size:1.05rem; color:var(--brown-dark); }
.lp-top-pricing-title strong{ color:var(--accent-warm); }
.lp-top-pricing-cards{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.lp-top-price-card{
  text-decoration:none;
  background:var(--white);
  border:1px solid var(--cream-dark);
  border-radius:14px;
  padding:14px 12px;
  color:var(--text);
  transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  position:relative;
  min-height:108px;
}
.lp-top-price-card:hover{ transform:translateY(-2px); box-shadow:var(--shadow); border-color:var(--brown-light); }
.lp-top-price-card.featured{ border:2px solid var(--brown-dark); box-shadow:var(--shadow-lg); }
.lp-top-price-badge{
  position:absolute; top:-10px; left:14px;
  background:var(--accent-warm); color:var(--white);
  font-size:0.72rem; padding:3px 10px; border-radius:999px;
}
.lp-top-price-name{ font-size:0.82rem; color:var(--brown); margin-bottom:6px; }
.lp-top-price-num{ font-family:'Noto Serif JP',serif; font-size:1.35rem; color:var(--brown-dark); font-weight:700; line-height:1.15; }
.lp-top-price-num span{ font-size:0.85rem; font-weight:500; color:var(--text-light); }
.lp-top-price-was{ display:block; font-family:'Noto Sans JP',sans-serif; font-size:0.72rem; color:var(--text-light); text-decoration:line-through; margin-bottom:4px; }
.lp-top-price-note{ font-size:0.74rem; color:var(--text-light); margin-top:8px; }
.lp-top-pricing-foot{ margin-top:10px; text-align:right; }
.lp-top-pricing-foot a{ color:var(--brown-dark); font-size:0.84rem; text-decoration:none; border-bottom:1px solid var(--brown-light); }
.lp-top-pricing-foot a:hover{ border-bottom-color:var(--brown-dark); }

@media (max-width: 820px){
  .lp-top-pricing-cards{ grid-template-columns:1fr; }
  .lp-top-price-card{ min-height:auto; }
}

        .lp-pricing { background:var(--cream-dark); }
        .lp-pricing-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:28px; max-width:780px; margin:0 auto; }
        .lp-price-card { background:var(--white); border-radius:20px; padding:36px; border:2px solid var(--cream-dark); text-align:center; transition:all 0.3s; }
        .lp-price-card.featured { border-color:var(--brown-dark); box-shadow:var(--shadow-lg); position:relative; }
        .lp-price-badge { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:var(--accent-warm); color:var(--white); padding:4px 18px; border-radius:20px; font-size:0.76rem; font-weight:500; white-space:nowrap; }
        .lp-price-name { font-family:'Noto Serif JP',serif; font-size:1.1rem; color:var(--brown); margin-bottom:8px; }
        .lp-price-num { font-family:'Noto Serif JP',serif; font-size:2.8rem; color:var(--brown-dark); font-weight:700; line-height:1; margin:14px 0 4px; }
        .lp-price-desc { font-size:0.83rem; color:var(--text-light); margin-bottom:20px; }
        .lp-price-feats { list-style:none; text-align:left; margin-bottom:28px; }
        .lp-price-feats li { font-size:0.88rem; color:var(--text); padding:7px 0; border-bottom:1px solid var(--cream-dark); display:flex; align-items:center; gap:8px; }
        .lp-price-feats li::before { content:'✓'; color:var(--green); font-weight:700; }

        /* CTA */
        .lp-cta {
          text-align:center;
          background:linear-gradient(135deg,var(--brown-dark) 0%,var(--brown-deeper) 100%);
          padding:100px 5%; position:relative; overflow:hidden;
        }
        .lp-cta::before { content:''; position:absolute; top:-50%; left:-10%; width:120%; height:200%; background:radial-gradient(ellipse at 30% 50%,rgba(196,168,130,0.15) 0%,transparent 60%); }
        .lp-cta * { position:relative; z-index:1; }
        .lp-cta .lp-section-label { color:var(--brown-light); }
        .lp-cta .lp-section-title { color:var(--cream); max-width:560px; margin:0 auto 14px; }
        .lp-cta p { color:var(--brown-light); margin-bottom:40px; font-size:0.95rem; line-height:1.9; }
        .lp-cta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
        .lp-btn-light { display:inline-flex; align-items:center; gap:8px; background:var(--cream); color:var(--brown-dark); padding:15px 32px; border-radius:8px; font-size:1rem; font-weight:600; text-decoration:none; border:none; cursor:pointer; font-family:inherit; transition:all 0.25s; }
        .lp-btn-light:hover { background:var(--white); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.2); }
        .lp-btn-ghost { display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--cream); padding:15px 24px; border-radius:8px; font-size:0.95rem; font-weight:500; text-decoration:none; border:2px solid rgba(196,168,130,0.5); cursor:pointer; font-family:inherit; transition:all 0.25s; }
        .lp-btn-ghost:hover { border-color:var(--cream); }

        /* フッター */
        .lp-footer { background:var(--brown-deeper); padding:52px 5% 36px; }
        .lp-footer-inner { display:flex; justify-content:space-between; align-items:flex-start; gap:36px; flex-wrap:wrap; margin-bottom:36px; }
        .lp-footer-brand p { font-size:0.83rem; color:var(--brown-light); line-height:1.8; max-width:260px; margin-top:10px; }
        .lp-footer-logo { font-family:'Noto Serif JP',serif; font-size:1.05rem; color:var(--cream); font-weight:600; }
        .lp-footer-links h4 { color:var(--cream); font-size:0.88rem; margin-bottom:14px; font-family:'Noto Serif JP',serif; }
        .lp-footer-links a { display:block; color:var(--brown-light); font-size:0.83rem; text-decoration:none; margin-bottom:8px; transition:color 0.2s; }
        .lp-footer-links a:hover { color:var(--cream); }
        .lp-footer-bottom { border-top:1px solid rgba(196,168,130,0.2); padding-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
        .lp-footer-bottom p { font-size:0.76rem; color:var(--brown-light); }

        @keyframes lpFadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpFadeIn { from{opacity:0;transform:translateY(16px) translateX(16px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }

        @media(max-width:768px){
          .lp-nav-links{display:none;}
          .lp-hero{padding:100px 5% 480px;min-height:auto;}
          .lp-hero-visual{position:absolute;right:5%;top:auto;bottom:32px;transform:none;width:90vw;}
          @keyframes lpFadeIn{from{opacity:0}to{opacity:1}}
          .lp-steps::before{display:none;}
          .lp-steps{gap:28px;}
          .lp-footer-inner{flex-direction:column;}
          .lp-footer-bottom{flex-direction:column;text-align:center;}
        }
      `}</style>

      <div className="lp">
        {/* ナビ */}
        <nav className="lp-nav">
          <div className="lp-nav-logo">📖 ライフ・メモナビ</div>
          <ul className="lp-nav-links">
            <li><a href="#lp-features">機能</a></li>
            <li><a href="#lp-how">使い方</a></li>
            <li><a href="#lp-fields">記録の種類</a></li>
            <li><a href="#lp-pricing">料金</a></li>
            <li><a href="/register" className="lp-nav-cta">無料で始める</a></li>
          </ul>
        </nav>

        {/* ヒーロー */}
        <section className="lp-hero">
          <div className="lp-hero-content">
            <div className="lp-badge">🎁 1カ月無料トライアル実施中</div>
            <h1>あなたの人生、<br /><em>ちゃんと残しませんか</em></h1>
            <p>インタビュー形式で、あなたの大切な思い出や人生の歩みを<br />AIがやさしくサポートしながら記録。<br />自分史・会社史・終活ノートを美しいPDFで残せます。</p>
            <div className="lp-btns">
              <a href="/register" className="lp-btn-primary">✦ 無料で記録を始める</a>
              <a href="#lp-how" className="lp-btn-secondary">使い方を見る →</a>
            </div>


            {/* トップに料金（要望対応） */}
            <div className="lp-top-pricing" aria-label="料金プラン（トップ）">
              <div className="lp-top-pricing-head">
                <div className="lp-top-pricing-kicker">ご利用料金</div>
                <div className="lp-top-pricing-title">まずは <strong>1カ月無料</strong>でお試し</div>
              </div>
              <div className="lp-top-pricing-cards">
                <a className="lp-top-price-card" href="https://memo.robostudy.jp/register" target="_blank" rel="noreferrer">
                  <div className="lp-top-price-name">月払い</div>
                  <div className="lp-top-price-num">380円<span>/月</span></div>
                  <div className="lp-top-price-note">※1カ月無料後に課金開始</div>
                </a>
                <a className="lp-top-price-card featured" href="https://buy.stripe.com/14A00kg7J7XD0jMd2C4F208" target="_blank" rel="noreferrer">
                  <div className="lp-top-price-badge">おすすめ</div>
                  <div className="lp-top-price-name">まとめ払い</div>
                  <div className="lp-top-price-num">990円<span>/3ヶ月</span></div>
                  <div className="lp-top-price-note">月あたり330円（50円おトク）</div>
                </a>
                <a className="lp-top-price-card" href="mailto:mitsunorif@robostudy.jp?subject=%E3%83%A9%E3%82%A4%E3%83%95%E3%83%A1%E3%83%A2%E3%83%8A%E3%83%93%20%E4%B8%80%E6%8B%AC%E8%B3%BC%E5%85%A5%E5%B8%8C%E6%9C%9B&body=%E3%81%8A%E5%90%8D%E5%89%8D%EF%BC%9A%0D%0A%E3%83%A1%E3%83%BC%E3%83%AB%EF%BC%9A%0D%0A%E9%80%A3%E7%B5%A1%E5%85%88%EF%BC%88%E9%9B%BB%E8%A9%B1%EF%BC%89%EF%BC%9A%0D%0A%E3%80%90%E4%B8%80%E6%8B%AC%E8%B3%BC%E5%85%A5%208%2C800%E5%86%86%E3%80%91%E3%82%92%E5%B8%8C%E6%9C%9B%E3%81%97%E3%81%BE%E3%81%99%E3%80%82%0D%0A">
                  <div className="lp-top-price-name">一括購入（カード不要）</div>
                  <div className="lp-top-price-num">
                    8,800円
                  </div>
                  <div className="lp-top-price-note">永久利用・サポート込み（銀行振込）</div>
                </a>
              </div>
              <div className="lp-top-pricing-foot">
                <a href="#lp-pricing">料金の詳細を見る →</a>
              </div>
            </div></div>
          <div className="lp-hero-visual">
            <div className="lp-card">
              <div className="lp-card-title">📖 自分史の記録 — 進捗</div>
              {[
                { icon: '👶', label: '幼少期・生い立ち', w: '100%', color: 'var(--green)', txt: '完了', txtColor: 'var(--green)' },
                { icon: '🎓', label: '学生時代', w: '100%', color: 'var(--green)', txt: '完了', txtColor: 'var(--green)' },
                { icon: '💼', label: '仕事・キャリア', w: '70%', color: 'var(--brown-light)', txt: '7/10問', txtColor: 'var(--text-light)' },
                { icon: '🌸', label: '家族・思い出', w: '20%', color: 'var(--brown-light)', txt: '3/15問', txtColor: 'var(--text-light)' },
              ].map((item, i) => (
                <div key={i} className="lp-prog-item">
                  <div className="lp-prog-icon">{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--brown)', marginBottom: '5px' }}>{item.label}</div>
                    <div className="lp-prog-bar-wrap">
                      <div className="lp-prog-bar" style={{ width: item.w, background: item.color }}></div>
                    </div>
                  </div>
                  <div className="lp-prog-label" style={{ color: item.txtColor }}>{item.txt}</div>
                </div>
              ))}
              <div className="lp-card-footer">
                <div className="lp-card-footer-text">📄 PDF出力可能</div>
                <button className="lp-card-btn" onClick={() => window.open('/sample.pdf', '_blank')}>PDFを作成する</button>
              </div>
            </div>
          </div>
        </section>

        {/* 数字 */}
        <div className="lp-stats">
          {[
            { num: '30', unit: '日', label: '無料トライアル期間' },
            { num: '15', unit: '問', label: '丁寧なインタビュー設問' },
            { num: '4', unit: '種類', label: '記録できるカテゴリ' },
            { num: 'AI', unit: '搭載', label: '文章をやさしくサポート' },
          ].map((s, i) => (
            <div key={i}>
              <div className="lp-stat-num">{s.num}<span>{s.unit}</span></div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 課題 */}
        <section className="lp-section lp-problems">
          <div className="lp-section-header">
            <div className="lp-section-label">こんなお悩みありませんか？</div>
            <h2 className="lp-section-title">「残しておきたい」気持ち、<br />後回しにしていませんか</h2>
          </div>
          <div className="lp-prob-grid">
            {[
              { icon: '😔', title: '何から書けばいいか分からない', text: 'いざ自分の人生を振り返ろうとしても、どこから手をつければいいのか分からず、気がつけば後回しになっていませんか。' },
              { icon: '✍️', title: '文章を書くのが苦手', text: '「文章力がないから…」と尻込みしてしまう方でも、大丈夫。AIが話し言葉を自然な文章に整えてくれます。' },
              { icon: '📦', title: '記録が散らばったまま', text: 'アルバム、メモ、日記帳……あちこちに散らばった思い出を、ひとつにまとめて整理したいと思っていませんか。' },
              { icon: '👨‍👩‍👧', title: '子や孫に残してあげたい', text: '自分が経験してきたこと、大切にしてきた想い。いつか家族に伝えたいけど、形にする機会がなかった方に。' },
            ].map((p, i) => (
              <div key={i} className="lp-prob-card">
                <div className="lp-prob-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 機能 */}
        <section className="lp-section" id="lp-features">
          <div className="lp-section-header">
            <div className="lp-section-label">Features</div>
            <h2 className="lp-section-title">ライフ・メモナビでできること</h2>
            <p className="lp-section-sub">難しい操作は一切なし。インタビューに答えるだけで、あなたの人生が一冊の本になります。</p>
          </div>
          <div className="lp-feat-grid">
            {[
              { emoji: '🤖', title: 'AIインタビューサポート', text: '「あなたが生まれた時代は？」など15の質問に答えるだけ。AIが文章を自然に整えてくれます。' },
              { emoji: '📅', title: '人生年表の作成', text: '大切な出来事を年表形式で登録。写真と一緒に思い出を可視化することで、人生の流れが一目でわかります。' },
              { emoji: '📸', title: '思い出の写真を保存', text: '大切な写真をアップロードしてコメントを添えるだけ。記録の中に思い出の一場面を刻みます。' },
              { emoji: '📄', title: '美しいPDF出力', text: '記録した内容をいつでも美しいPDFとして出力できます。印刷して手元に置いたり、家族に送ることも。' },
              { emoji: '🔒', title: '安心のセキュリティ', text: 'すべての記録は暗号化されて保存。大切な個人情報とライフストーリーを安全にお守りします。' },
              { emoji: '📱', title: 'スマホ・PCどちらでも', text: 'パソコンでもスマートフォンでも、いつでもどこからでも記録できます。続きはいつでも再開可能。' },
            ].map((f, i) => (
              <div key={i} className="lp-feat-card">
                <div className="lp-feat-emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 使い方 */}
        <section className="lp-section lp-how" id="lp-how">
          <div className="lp-section-header">
            <div className="lp-section-label">How it works</div>
            <h2 className="lp-section-title">かんたん3ステップで<br />はじめられます</h2>
          </div>
          <div className="lp-steps">
            {[
              { n: '1', title: '無料登録する', text: 'メールアドレスとお名前を登録するだけ。30日間、すべての機能を無料でお試しいただけます。' },
              { n: '2', title: 'インタビューに答える', text: '15の質問に、思い出すままにお答えください。箇条書きでも大丈夫。AIが文章を整えます。' },
              { n: '3', title: 'PDFで保存・共有', text: '完成した記録をPDFで出力して、印刷したり家族に送ったりして、大切に残しましょう。' },
            ].map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 分野 */}
        <section className="lp-section" id="lp-fields">
          <div className="lp-section-header">
            <div className="lp-section-label">Record types</div>
            <h2 className="lp-section-title">4つの記録カテゴリ</h2>
            <p className="lp-section-sub">目的に合わせて、記録したい分野を選べます。複数のカテゴリを同時に使うことも可能です。</p>
          </div>
          <div className="lp-fields-grid">
            {[
              { cls: 'f1', emoji: '📖', title: '自分史', text: '生い立ちから現在まで、あなたの人生の物語を記録。次の世代へ受け継ぐ、かけがえのない一冊に。' },
              { cls: 'f2', emoji: '🏢', title: '会社史', text: '会社の創業から現在までの歩みを記録。創業の想いや苦労を後継者や社員に伝えましょう。' },
              { cls: 'f3', emoji: '🕊️', title: '終活ノート', text: '医療・財産・葬儀の希望など、大切なことを整理。家族への想いを丁寧に残せます。' },
              { cls: 'f4', emoji: '📝', title: 'その他の記録', text: '旅の記録、趣味の歩み、コミュニティの歴史など。自由に記録・整理したい方に。' },
            ].map((f, i) => (
              <div key={i} className={`lp-field-card ${f.cls}`}>
                <div className="lp-field-emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 声 */}
        <section className="lp-section lp-voices">
          <div className="lp-section-header">
            <div className="lp-section-label">Voices</div>
            <h2 className="lp-section-title">ご利用いただいた方の声</h2>
          </div>
          <div className="lp-voices-grid">
            {[
              { text: '質問に答えていくだけで、気づいたら自分の人生が一冊の本になっていました。孫に読んでもらいたくて、印刷して渡しました。', author: '70代・女性（浜松市）' },
              { text: '文章を書くのが苦手でも、AIが上手く整えてくれるので安心でした。会社の創業50年の記念に会社史を作りました。', author: '65歳・経営者（静岡県）' },
              { text: '終活ノートとして使っています。家族への想いをちゃんと形にできた気がして、気持ちが楽になりました。ありがとうございます。', author: '72歳・男性（愛知県）' },
            ].map((v, i) => (
              <div key={i} className="lp-voice-card">
                <div className="lp-voice-text">{v.text}</div>
                <div className="lp-voice-author">{v.author}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 料金 */}
        <section className="lp-section lp-pricing" id="lp-pricing">
          <div className="lp-section-header" style={{ textAlign: 'center' }}>
            <div className="lp-section-label">Pricing</div>
            <h2 className="lp-section-title">シンプルな料金プラン</h2>
            <p className="lp-section-sub" style={{ margin: '0 auto' }}>まずは30日間、すべての機能を無料でお試しいただけます。</p>
          </div>

          <div className="lp-pricing-cards">
            <div className="lp-price-card">
              <div className="lp-price-name">月払い</div>
              <div className="lp-price-num">¥380<span style={{ fontSize: '1rem', fontWeight: 400 }}>/月</span></div>
              <div className="lp-price-desc">※初回1カ月無料（無料期間後に課金開始）</div>
              <ul className="lp-price-feats">
                {['全機能が使い放題', '自分史・会社史・終活ノート対応', 'PDF出力', '写真アップロード', 'サポート付き'].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="https://memo.robostudy.jp/register" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} target="_blank" rel="noreferrer">1カ月無料で試す →</a>
            </div>

            <div className="lp-price-card featured">
              <div className="lp-price-badge">おすすめ</div>
              <div className="lp-price-name">まとめ払い</div>
              <div className="lp-price-num">¥990<span style={{ fontSize: '1rem', fontWeight: 400 }}>/3ヶ月</span></div>
              <div className="lp-price-desc">月あたり330円（50円おトク）／税込</div>
              <ul className="lp-price-feats">
                {['全機能が使い放題', 'データはそのまま引き継ぎ', 'PDF出力', '写真アップロード', 'サポート付き'].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="https://buy.stripe.com/14A00kg7J7XD0jMd2C4F208" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} target="_blank" rel="noreferrer">3か月で申し込む →</a>
            </div>

            <div className="lp-price-card">
              <div className="lp-price-name">一括購入（カード不要）</div>
              <div className="lp-price-num" style={{ fontSize: '2.2rem' }}>¥8,800</div>
              <div className="lp-price-desc">発売記念価格</div>
              <ul className="lp-price-feats">
                {['永久利用', 'サポート込み', '銀行振込（カード不要）', 'ご家族への記録にもおすすめ', '不明点はメールで相談OK'].map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <a href="mailto:mitsunorif@robostudy.jp?subject=%E3%83%A9%E3%82%A4%E3%83%95%E3%83%A1%E3%83%A2%E3%83%8A%E3%83%93%20%E4%B8%80%E6%8B%AC%E8%B3%BC%E5%85%A5%E5%B8%8C%E6%9C%9B&body=%E3%81%8A%E5%90%8D%E5%89%8D%EF%BC%9A%0D%0A%E3%83%A1%E3%83%BC%E3%83%AB%EF%BC%9A%0D%0A%E9%80%A3%E7%B5%A1%E5%85%88%EF%BC%88%E9%9B%BB%E8%A9%B1%EF%BC%89%EF%BC%9A%0D%0A%E3%80%90%E4%B8%80%E6%8B%AC%E8%B3%BC%E5%85%A5%208%2C800%E5%86%86%E3%80%91%E3%82%92%E5%B8%8C%E6%9C%9B%E3%81%97%E3%81%BE%E3%81%99%E3%80%82%0D%0A" className="lp-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>一括購入を相談する →</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-section-label">今すぐ始めましょう</div>
          <h2 className="lp-section-title">人生の記録は、<br />早く始めるほど豊かになります</h2>
          <p>初回1カ月、すべての機能を無料でお試しいただけます。<br />月払い／3か月まとめ払い／銀行振込（カード不要）の3つから選べます。</p>
          <div className="lp-cta-btns">
            <a href="https://memo.robostudy.jp/register" className="lp-btn-light" target="_blank" rel="noreferrer">✦ 1カ月無料で試す</a>
            <a href="https://buy.stripe.com/14A00kg7J7XD0jMd2C4F208" className="lp-btn-ghost" target="_blank" rel="noreferrer">3か月まとめ払いを見る →</a>
          </div>
        </section>

        {/* フッター */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">📖 ライフ・メモナビ</div>
              <p>人生の大切な記録を、やさしく・美しく残すためのサービスです。ロボ・スタディ株式会社が提供しています。</p>
            </div>
            <div className="lp-footer-links">
              <h4>サービス</h4>
              <a href="#lp-features">機能について</a>
              <a href="#lp-how">使い方</a>
              <a href="#lp-fields">記録の種類</a>
              <a href="#lp-pricing">料金プラン</a>
            </div>
            <div className="lp-footer-links">
              <h4>会社情報</h4>
              <a href="https://robostudy.jp" target="_blank" rel="noreferrer">ロボ・スタディ株式会社</a>
              <a href="/privacy">プライバシーポリシー</a>
              <a href="mailto:mitsunorif@robostudy.jp">お問い合わせ</a>
              <a href="/register">新規登録</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 ロボ・スタディ株式会社 All rights reserved.</p>
            <p>〒432-8021 浜松市中区佐鳴台</p>
          </div>
        </footer>
      </div>
    </>
  );
}
