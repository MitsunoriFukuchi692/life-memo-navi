import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage({ forceLang }: { forceLang?: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (forceLang === 'en') localStorage.setItem('lm_lang', 'en');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  return (
    <div style={styles.page}>
      <header style={styles.nav}>
        <button style={styles.logo} onClick={() => navigate('/')}>Life Memo Navi</button>
        <nav style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#use-cases" style={styles.navLink}>Use cases</a>
          <a href="#pricing" style={styles.navLink}>Pricing</a>
          <button style={styles.navButton} onClick={() => navigate('/login?lang=en')}>Log in</button>
        </nav>
      </header>

      <main>
        <section style={styles.hero}>
          <div style={styles.heroText}>
            <p style={styles.kicker}>Guided AI interviews for lasting records</p>
            <h1 style={styles.h1}>Life Memo Navi</h1>
            <p style={styles.lead}>
              Turn personal memories and company milestones into a clear, printable story.
              Answer guided questions, add timeline events and photos, then export everything as a PDF.
            </p>
            <div style={styles.actions}>
              <button style={styles.primaryButton} onClick={() => navigate('/register?lang=en')}>Start free trial</button>
              <button style={styles.secondaryButton} onClick={() => navigate('/login?lang=en')}>Log in</button>
            </div>
          </div>

          <div style={styles.preview} aria-label="Product preview">
            <div style={styles.previewHeader}>Story progress</div>
            {[
              ['Origins and childhood', '100%'],
              ['Work and turning points', '70%'],
              ['Family and relationships', '45%'],
              ['Photos and timeline', '30%'],
            ].map(([label, value]) => (
              <div key={label} style={styles.progressRow}>
                <span style={styles.progressLabel}>{label}</span>
                <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: value }} /></div>
                <span style={styles.progressValue}>{value}</span>
              </div>
            ))}
            <div style={styles.previewFooter}>PDF ready when the story is complete</div>
          </div>
        </section>

        <section id="features" style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.kicker}>What it does</p>
            <h2 style={styles.h2}>Built for life stories and company histories</h2>
          </div>
          <div style={styles.grid}>
            {[
              ['Life Story', 'Capture childhood, family, work, hardships, lessons, and messages for future generations.'],
              ['Company History', 'Preserve founding stories, turning points, people, customer episodes, culture, and values.'],
              ['Guided Interview', 'Fifteen structured questions help users begin without facing a blank page.'],
              ['Timeline and Photos', 'Add dates, events, and images so the record feels concrete and easy to browse.'],
              ['AI Polishing', 'Draft answers can be lightly edited into more natural prose while keeping the user voice.'],
              ['PDF Export', 'Create a printable document for family members, employees, anniversaries, or archives.'],
            ].map(([title, text]) => (
              <article key={title} style={styles.card}>
                <h3 style={styles.cardTitle}>{title}</h3>
                <p style={styles.cardText}>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="use-cases" style={{ ...styles.section, ...styles.band }}>
          <div style={styles.sectionHeader}>
            <p style={styles.kicker}>Use cases</p>
            <h2 style={styles.h2}>Two focused markets to test first</h2>
          </div>
          <div style={styles.twoCol}>
            <article style={styles.useCase}>
              <h3 style={styles.useCaseTitle}>Families and individuals</h3>
              <p style={styles.cardText}>For people who want to preserve memories for children, grandchildren, relatives, or caregivers without writing a book from scratch.</p>
            </article>
            <article style={styles.useCase}>
              <h3 style={styles.useCaseTitle}>Founders and small businesses</h3>
              <p style={styles.cardText}>For anniversaries, succession planning, internal culture building, and documenting the knowledge of founders or long-serving employees.</p>
            </article>
          </div>
        </section>

        <section id="pricing" style={styles.section}>
          <div style={styles.cta}>
            <p style={styles.kicker}>Try the English concept</p>
            <h2 style={styles.h2}>Start with Life Story or Company History</h2>
            <p style={styles.leadSmall}>The current test version focuses on the two record types most useful for validating international demand.</p>
            <button style={styles.primaryButton} onClick={() => navigate('/register?lang=en')}>Create an account</button>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <span>© 2026 Robo Study Inc.</span>
        <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
        <a href="mailto:mitsunorif@robostudy.jp" style={styles.footerLink}>Contact</a>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#faf6f0', color: '#2c2c2c', fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  nav: { height: 64, padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eadfce', background: 'rgba(250,246,240,0.94)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { border: 'none', background: 'transparent', color: '#4b3329', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  navLink: { color: '#6f5b48', textDecoration: 'none', fontSize: '0.92rem' },
  navButton: { border: '1px solid #bfa37d', background: '#fff', color: '#4b3329', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 },
  hero: { minHeight: 'calc(100vh - 64px)', padding: '72px 5% 56px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.8fr)', gap: 40, alignItems: 'center' },
  heroText: { maxWidth: 680 },
  kicker: { color: '#b65f38', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 12px' },
  h1: { fontSize: 'clamp(2.4rem, 7vw, 5.4rem)', lineHeight: 1, color: '#3d2b1f', margin: '0 0 24px', letterSpacing: 0 },
  h2: { fontSize: 'clamp(1.7rem, 3vw, 2.35rem)', lineHeight: 1.2, color: '#3d2b1f', margin: '0 0 16px', letterSpacing: 0 },
  lead: { fontSize: '1.12rem', lineHeight: 1.75, color: '#625446', maxWidth: 620, margin: '0 0 32px' },
  leadSmall: { fontSize: '1rem', lineHeight: 1.7, color: '#625446', margin: '0 auto 28px', maxWidth: 560 },
  actions: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  primaryButton: { background: '#4b3329', color: '#fff8ed', border: 'none', borderRadius: 8, padding: '14px 24px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 28px rgba(75,51,41,0.22)' },
  secondaryButton: { background: 'transparent', color: '#4b3329', border: '2px solid #bfa37d', borderRadius: 8, padding: '12px 22px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
  preview: { background: '#fff', border: '1px solid #eadfce', borderRadius: 8, padding: 28, boxShadow: '0 16px 46px rgba(75,51,41,0.14)' },
  previewHeader: { color: '#4b3329', fontWeight: 800, marginBottom: 20 },
  progressRow: { display: 'grid', gridTemplateColumns: '1fr 120px 52px', gap: 12, alignItems: 'center', marginBottom: 16 },
  progressLabel: { color: '#625446', fontSize: '0.9rem' },
  progressTrack: { height: 8, background: '#efe4d4', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#6b9b6b', borderRadius: 999 },
  progressValue: { color: '#7a6a5a', fontSize: '0.84rem', textAlign: 'right' },
  previewFooter: { marginTop: 22, paddingTop: 18, borderTop: '1px solid #eadfce', color: '#7a6a5a', fontSize: '0.9rem' },
  section: { padding: '84px 5%' },
  band: { background: '#f0e8d8' },
  sectionHeader: { maxWidth: 720, marginBottom: 34 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 },
  card: { background: '#fff', border: '1px solid #eadfce', borderRadius: 8, padding: 26, boxShadow: '0 6px 20px rgba(75,51,41,0.08)' },
  cardTitle: { color: '#3d2b1f', margin: '0 0 10px', fontSize: '1.08rem' },
  cardText: { color: '#625446', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 },
  useCase: { background: '#fff', borderLeft: '4px solid #6b9b6b', borderRadius: 8, padding: 28, boxShadow: '0 6px 20px rgba(75,51,41,0.08)' },
  useCaseTitle: { margin: '0 0 12px', color: '#3d2b1f', fontSize: '1.25rem' },
  cta: { textAlign: 'center', background: '#fff', border: '1px solid #eadfce', borderRadius: 8, padding: '48px 28px', boxShadow: '0 12px 36px rgba(75,51,41,0.1)' },
  footer: { padding: '28px 5%', background: '#3d2b1f', color: '#cdb99a', display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'space-between' },
  footerLink: { color: '#fff8ed', textDecoration: 'none' },
};
