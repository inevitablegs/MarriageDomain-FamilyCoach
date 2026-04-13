import { motion } from 'motion/react';
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
      color: 'var(--brand-rose)',
      bg: 'var(--brand-rose-light)',
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
      palette: 'from-[#d97757] to-[#f4a261]',
    },
    {
      num: '2',
      title: 'Get Your Compatibility Score',
      desc: 'Instant AI report with strengths, gaps, and critical red flags — no fluff.',
      palette: 'from-[#a65d50] to-[#d97757]',
    },
    {
      num: '3',
      title: 'Follow Your Action Plan',
      desc: 'Clear structured steps to decide confidently or rebuild your relationship.',
      palette: 'from-[#5c7c64] to-[#8fb199]',
    },
  ];

  // Scroll to the "how it works" section
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen transition-colors duration-500">

      {/* ── HERO ── */}
      <div className="w-full transition-colors duration-500" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-16 lg:py-24">

            {/* Left: Text */}
            <div className="flex-1 flex flex-col justify-center max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] mb-7 w-fit transition-colors"
                style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}
              >
                AI-Powered Relationship Intelligence
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="font-display text-[2.2rem] sm:text-4xl lg:text-5xl xl:text-[4rem] leading-[1.07] mb-6 tracking-tight transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Clarity before<br />commitment.{' '}
                <span className="italic opacity-75">
                  Connection after marriage.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-sm sm:text-base lg:text-lg leading-relaxed mb-9 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Make the most important relationship decision of your life with data-backed clarity. Our structured assessments and AI analysis reveal what matters most beneath the surface.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('auth-before')}
                  className="inline-flex items-center justify-center gap-3 text-white px-7 py-3.5 rounded-full font-bold shadow-lg transition-all focus-ring text-sm sm:text-base"
                  style={{ backgroundColor: 'var(--brand-indigo)' }}
                >
                  Begin Your Assessment <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={scrollToHowItWorks}
                  className="inline-flex items-center justify-center gap-2 border-2 px-7 py-3.5 rounded-full font-bold transition-all focus-ring text-sm sm:text-base"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  See How It Works
                </motion.button>
              </motion.div>
            </div>

            {/* Right: Image — fixed height, rounded, not full bleed */}
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="relative w-full lg:w-[480px] xl:w-[520px] shrink-0 rounded-2xl overflow-hidden transition-colors"
              style={{ height: '520px', backgroundColor: 'var(--bg-tertiary)' }}
            >
              <img
                src="https://t3.ftcdn.net/jpg/03/38/79/70/240_F_338797073_CsO0jjvg8f8E9WqPJJn072tBwYrsFOcH.jpg"
                alt="Couple holding hands — emotional connection"
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundImage: 'linear-gradient(to top, var(--bg-tertiary) 0%, transparent 70%)', opacity: 0.7 }} />

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute bottom-8 left-8 right-8 text-white z-10"
              >
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2 opacity-50">Insight driven</p>
                <h3 className="text-xl font-display leading-snug italic opacity-90">
                  "Data reveals what emotions sometimes obscure."
                </h3>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── REST OF PAGE ── */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-24">

        {/* STATS */}
        <section className="mb-32">
          <div className="grid grid-cols-3 gap-6 sm:gap-10 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center group">
                <p className="text-3xl sm:text-5xl lg:text-6xl font-display mb-2 group-hover:scale-105 transition-transform" style={{ color: 'var(--brand-indigo)' }}>{s.value}</p>
                <div className="w-8 h-px mx-auto mb-3" style={{ backgroundColor: 'var(--border-primary)' }} />
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 transition-colors" style={{ color: 'var(--brand-indigo)' }}>What MarriageWise offers</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
              Everything you need to decide wisely
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="premium-card p-6 group transition-all hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">Refined Insights</h3>
                <p className="text-sm leading-relaxed transition-colors" style={{ color: 'var(--text-muted)' }}>Analyzed and actionable relationship intelligence for every stage.</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 transition-colors" style={{ color: 'var(--brand-emerald)' }}>How it works</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Simple. Structured. Effective.</h2>
            <p className="mt-4 text-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>Your path to relationship clarity takes just three steps.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.title}
                className="premium-card p-7 relative overflow-hidden group hover:-translate-y-1.5 transition-all"
              >
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-opacity bg-gradient-to-br ${step.palette}`} />
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-xl font-black text-white shadow-md mb-5 bg-gradient-to-br ${step.palette}`}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed transition-colors" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* TWO JOURNEYS */}
        <section className="mt-32 grid gap-6 lg:grid-cols-2">
          <article className="premium-card p-8 sm:p-10 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-[1.25rem] bg-gradient-to-r from-[#d97757] to-[#f4a261]" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-colors" style={{ backgroundColor: 'var(--brand-indigo)' }} />
            <p className="badge mb-4 transition-colors" style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>Before Marriage</p>
            <h3 className="font-display text-3xl sm:text-4xl leading-tight mb-3">Confused about your partner?</h3>
            <p className="text-base leading-relaxed mb-8 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Stop guessing. Get deep insights before making the biggest commitment of your life.
            </p>
            <ul className="space-y-3 mb-8">
              {['Compatibility Deep Scan', 'Red Flag Intelligence', 'Make Confident Decisions'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(217,119,87,0.1)' }}>
                    <CheckCircle2 size={14} style={{ color: '#d97757' }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('auth-before')}
              className="flex items-center justify-between w-full rounded-2xl px-6 py-4 font-bold text-white transition-all hover:opacity-90 shadow-md focus-ring"
              style={{ background: 'linear-gradient(135deg, #d97757, #a65d50)' }}
            >
              <span>Start Before Marriage Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>

          <article className="premium-card p-8 sm:p-10 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-[1.25rem] bg-gradient-to-r from-[#5c7c64] to-[#8fb199]" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-colors" style={{ backgroundColor: 'var(--brand-emerald)' }} />
            <p className="badge mb-4 transition-colors" style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>After Marriage</p>
            <h3 className="font-display text-3xl sm:text-4xl leading-tight mb-3">Facing issues in your relationship?</h3>
            <p className="text-base leading-relaxed mb-8 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Repair and rebuild together with structured assessment sessions and weekly health tracking.
            </p>
            <ul className="space-y-3 mb-8">
              {['Couple Assessment Sessions', 'Conflict Risk Monitor', 'Rebuild Connection'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(92,124,100,0.1)' }}>
                    <CheckCircle2 size={14} style={{ color: '#5c7c64' }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('auth-after')}
              className="flex items-center justify-between w-full rounded-2xl px-6 py-4 font-bold text-white transition-all hover:opacity-90 shadow-md focus-ring"
              style={{ background: 'linear-gradient(135deg, #5c7c64, #4a6350)' }}
            >
              <span>Start Joint Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>
        </section>

        {/* CTA BANNER */}
        <section className="mt-32 relative overflow-hidden rounded-[2.5rem] p-12 sm:p-16 text-center text-white shadow-2xl transition-all"
          style={{ background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-primary) 50%, var(--bg-tertiary) 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--brand-indigo) 0%, transparent 70%)', opacity: 0.2
          }} />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#d97757]/20 border border-[#d97757]/30 mb-6">
              <Heart className="text-[#d97757]" size={32} fill="currentColor" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight max-w-2xl mx-auto mb-4">
              Don't wait until it's too late
            </h2>
            <p className="text-lg max-w-xl mx-auto leading-relaxed mb-10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              One wrong decision can cost years. One right decision can change your life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('auth-before')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#d97757] text-white px-8 py-4 rounded-full font-bold shadow-xl transition-all hover:scale-105 focus-ring"
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

        {/* FOOTER */}
        <footer className="mt-20 border-t pt-10 pb-6" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-[#d97757] p-1.5 rounded-[8px]">
                <Heart className="text-white" size={14} fill="currentColor" />
              </div>
              <span className="font-extrabold text-sm transition-colors" style={{ color: 'var(--text-primary)' }}>MarriageWise</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold uppercase tracking-wider transition-colors" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><HeartHandshake size={13} /> Pre + Post Marriage</span>
              <span className="flex items-center gap-1.5"><Compass size={13} /> Structured Guidance</span>
              <span className="flex items-center gap-1.5"><Target size={13} /> Data-Driven Clarity</span>
            </div>
            <p className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>© {new Date().getFullYear()} MarriageWise</p>
          </div>
        </footer>
      </div>
    </div>
  );
}