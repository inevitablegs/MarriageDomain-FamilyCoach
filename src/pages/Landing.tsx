import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Target,
  Heart,
  Brain,
  TrendingUp,
} from 'lucide-react';

type LandingProps = {
  onNavigate: (page: string) => void;
};

export function Landing({ onNavigate }: LandingProps) {
  const stats = [
    { value: '50+', label: 'Assessment Questions' },
    { value: 'AI', label: 'Powered Analysis' },
    { value: '2', label: 'Journeys: Before & After' },
  ];

  const features = [
    {
      icon: <Brain size={22} />,
      title: 'Compatibility Deep Scan',
      desc: 'Scientifically structured questions reveal real alignment across values, lifestyle, finances, and goals.',
      color: 'var(--brand-indigo)',
      bg: 'var(--brand-indigo-light)',
    },
    {
      icon: <ShieldAlert size={22} />,
      title: 'Red Flag Intelligence',
      desc: 'Detect high-severity behavioral risks before you commit. Protect your future with data-backed clarity.',
      color: '#f43f5e',
      bg: '#fff1f2',
    },
    {
      icon: <TrendingUp size={22} />,
      title: 'Relationship Health Tracker',
      desc: 'Weekly AI reflections analyze your journal to track emotional, communication, and intimacy trends.',
      color: 'var(--brand-emerald)',
      bg: 'var(--brand-emerald-light)',
    },
    {
      icon: <Sparkles size={22} />,
      title: 'Couple Assessment Sessions',
      desc: 'Private shared sessions generate a joint report only after both partners independently answer the same questions.',
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
  ];

  const steps = [
    {
      num: '1',
      title: 'Answer Smart Questions',
      desc: 'Structured prompts reveal true compatibility, values alignment, and risk areas.',
      palette: 'from-indigo-500 to-blue-500',
    },
    {
      num: '2',
      title: 'Get Your Compatibility Score',
      desc: 'Instant AI report with strengths, gaps, and critical red flags — no fluff.',
      palette: 'from-violet-500 to-indigo-500',
    },
    {
      num: '3',
      title: 'Follow Your Action Plan',
      desc: 'Clear structured steps to decide confidently or rebuild your relationship.',
      palette: 'from-sky-500 to-cyan-500',
    },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full opacity-[0.22] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute top-60 -right-40 h-[480px] w-[480px] rounded-full opacity-[0.16] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent)' }} />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full opacity-[0.12] blur-[90px]"
          style={{ background: 'radial-gradient(circle, #fb7185, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">

        {/* ── HERO ── */}
        <section className="text-center max-w-3xl mx-auto animate-rise-in">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in delay-75"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--brand-indigo)' }}>
            <Heart size={12} fill="currentColor" className="text-rose-500" />
            AI-Powered Relationship Intelligence
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight mb-6 animate-rise-in delay-150">
            Clarity before <span className="gradient-text-indigo italic">commitment.</span>
            <br />
            Connection after <span className="gradient-text-emerald italic">marriage.</span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in delay-225"
            style={{ color: 'var(--text-secondary)' }}>
            MarriageWise uses structured assessments and AI analysis to help you make the most important relationship decisions of your life — with data-backed clarity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-300">
            <button
              onClick={() => onNavigate('auth-before')}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus-ring"
            >
              Before Marriage Journey <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate('auth-after')}
              className="flex items-center gap-2 border font-bold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 focus-ring"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              After Marriage Journey
            </button>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="mt-20 animate-rise-in delay-400">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text-indigo">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--brand-indigo)' }}>What MarriageWise offers</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Everything you need to decide wisely
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="premium-card p-6 group transition-all hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--brand-emerald)' }}>How it works</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Simple. Structured. Effective.</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Your path to relationship clarity takes just three steps.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="premium-card p-7 relative overflow-hidden group hover:-translate-y-1 transition-all">
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${step.palette}`} />
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-xl font-black text-white shadow-md mb-5 bg-gradient-to-br ${step.palette}`}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── TWO JOURNEYS ── */}
        <section className="mt-32 grid gap-6 lg:grid-cols-2">
          {/* Before Marriage */}
          <article className="premium-card p-8 sm:p-10 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-[1.25rem] bg-gradient-to-r from-indigo-500 to-blue-500" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
              style={{ backgroundColor: '#818cf8' }} />

            <p className="badge mb-4" style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
              Before Marriage
            </p>
            <h3 className="font-display text-3xl sm:text-4xl leading-tight mb-3">
              Confused about your partner?
            </h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              Stop guessing. Get deep insights before making the biggest commitment of your life.
            </p>
            <ul className="space-y-3 mb-8">
              {['Compatibility Deep Scan', 'Red Flag Intelligence', 'Make Confident Decisions'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--brand-indigo-light)' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-indigo)' }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('auth-before')}
              className="flex items-center justify-between w-full rounded-2xl px-6 py-4 font-bold text-white transition-all hover:opacity-90 shadow-md focus-ring"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #2563eb)' }}
            >
              <span>Start Before Marriage Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>

          {/* After Marriage */}
          <article className="premium-card p-8 sm:p-10 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-[1.25rem] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
              style={{ backgroundColor: '#6ee7b7' }} />

            <p className="badge mb-4" style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>
              After Marriage
            </p>
            <h3 className="font-display text-3xl sm:text-4xl leading-tight mb-3">
              Facing issues in your relationship?
            </h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              Repair and rebuild together with structured assessment sessions and weekly health tracking.
            </p>
            <ul className="space-y-3 mb-8">
              {['Couple Assessment Sessions', 'Conflict Risk Monitor', 'Rebuild Connection'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--brand-emerald-light)' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-emerald)' }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('auth-after')}
              className="flex items-center justify-between w-full rounded-2xl px-6 py-4 font-bold text-white transition-all hover:opacity-90 shadow-md focus-ring"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              <span>Start Joint Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="mt-32 noise-overlay relative overflow-hidden rounded-[2.5rem] p-12 sm:p-16 text-center text-white shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.3) 0%, transparent 70%)'
          }} />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 mb-6">
              <Heart className="text-rose-400" size={32} fill="currentColor" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight max-w-2xl mx-auto mb-4">
              Don't wait until it's too late
            </h2>
            <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed mb-10">
              One wrong decision can cost years. One right decision can change your life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('auth-before')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold shadow-xl transition-all hover:scale-105 focus-ring"
              >
                Start Compatibility Check <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('auth-after')}
                className="w-full sm:w-auto border border-white/20 text-white px-8 py-4 rounded-full font-semibold transition-all hover:bg-white/10 focus-ring"
              >
                After Marriage Journey
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="mt-20 border-t pt-10 pb-6" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-1.5 rounded-[8px]">
                <Heart className="text-white" size={14} fill="currentColor" />
              </div>
              <span className="font-extrabold text-sm">MarriageWise</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><HeartHandshake size={13} /> Pre + Post Marriage</span>
              <span className="flex items-center gap-1.5"><Compass size={13} /> Structured Guidance</span>
              <span className="flex items-center gap-1.5"><Target size={13} /> Data-Driven Clarity</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} MarriageWise
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}