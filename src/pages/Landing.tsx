import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Heart,
  Brain,
  TrendingUp,
  Star,
  Users,
  Shield,
} from 'lucide-react';
import weddingHero from '../assets/wedding-hero.png';

type LandingProps = {
  onNavigate: (page: string) => void;
};

// ── Decorative SVG Components ──────────────────────────────────────────────
function MandalaSVG({ size = 300, opacity = 0.06 }: { size?: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      style={{ opacity }}
      className="pointer-events-none select-none"
    >
      <g transform="translate(150,150)">
        {/* Center circle */}
        <circle r="15" fill="none" stroke="var(--royal-gold)" strokeWidth="1.5" />
        <circle r="8" fill="var(--royal-gold)" opacity="0.4" />
        {/* Petal rings */}
        {[30, 50, 72, 95, 118, 142].map((r, i) => (
          <g key={r}>
            {Array.from({ length: (i + 1) * 6 }).map((_, j) => {
              const angle = (j * 360) / ((i + 1) * 6);
              const rad = (angle * Math.PI) / 180;
              const x = r * Math.cos(rad);
              const y = r * Math.sin(rad);
              return (
                <g key={j} transform={`translate(${x},${y}) rotate(${angle})`}>
                  <ellipse
                    rx={i < 2 ? 3 : i < 4 ? 4 : 5}
                    ry={i < 2 ? 7 : i < 4 ? 9 : 11}
                    fill="none"
                    stroke={i % 2 === 0 ? 'var(--royal-gold)' : 'var(--royal-maroon)'}
                    strokeWidth="0.8"
                    opacity="0.7"
                  />
                </g>
              );
            })}
            <circle r={r} fill="none" stroke="var(--royal-gold)" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 6" />
          </g>
        ))}
        {/* Outer decorative diamonds */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const rad = (angle * Math.PI) / 180;
          const x = 142 * Math.cos(rad);
          const y = 142 * Math.sin(rad);
          return (
            <polygon
              key={i}
              points="0,-5 3,0 0,5 -3,0"
              transform={`translate(${x},${y}) rotate(${angle})`}
              fill="var(--royal-gold)"
              opacity="0.5"
            />
          );
        })}
      </g>
    </svg>
  );
}

function LotusIcon({ size = 24, color = 'var(--royal-saffron)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 16 3 10C3 7 5 5 8 5C9.5 5 11 5.8 12 7C13 5.8 14.5 5 16 5C19 5 21 7 21 10C21 16 12 21 12 21Z" fill={color} opacity="0.9" />
      <path d="M12 21C12 21 8 17 7 13C7 13 9.5 14 12 12C14.5 14 17 13 17 13C16 17 12 21 12 21Z" fill="white" opacity="0.4" />
      <path d="M12 7C12 7 11 3 8 3C8 3 8 6 12 7Z" fill={color} opacity="0.6" />
      <path d="M12 7C12 7 13 3 16 3C16 3 16 6 12 7Z" fill={color} opacity="0.6" />
      <path d="M12 7C12 7 9 4 6 6C6 6 8 8 12 7Z" fill={color} opacity="0.5" />
      <path d="M12 7C12 7 15 4 18 6C18 6 16 8 12 7Z" fill={color} opacity="0.5" />
    </svg>
  );
}

function DiamondDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, var(--royal-gold))', opacity: 0.4 }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--royal-gold)', opacity: 0.7 }} />
      <div className="w-1 h-1 rotate-45" style={{ backgroundColor: 'var(--royal-maroon)', opacity: 0.5 }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--royal-gold)', opacity: 0.7 }} />
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, var(--royal-gold))', opacity: 0.4 }} />
    </div>
  );
}

export function Landing({ onNavigate }: LandingProps) {
  const stats = [
    { value: '50+', label: 'Assessment Questions', icon: <Brain size={20} /> },
    { value: 'AI', label: 'Powered Analysis', icon: <Sparkles size={20} /> },
    { value: '2', label: 'Sacred Journeys', icon: <Heart size={20} /> },
  ];

  const features = [
    {
      icon: <Brain size={22} />,
      title: 'Compatibility Deep Scan',
      desc: 'Scientifically structured questions reveal real alignment across values, lifestyle, finances, and life goals.',
      color: 'var(--royal-saffron)',
      bg: 'var(--royal-glow)',
      border: 'var(--royal-border)',
    },
    {
      icon: <ShieldAlert size={22} />,
      title: 'Red Flag Intelligence',
      desc: 'Detect high-severity behavioral risks before you commit. Protect your future with data-backed clarity.',
      color: 'var(--royal-maroon)',
      bg: 'rgba(139,26,58,0.08)',
      border: 'rgba(139,26,58,0.2)',
    },
    {
      icon: <TrendingUp size={22} />,
      title: 'Relationship Health Tracker',
      desc: 'Weekly AI reflections analyze your journal to track emotional, communication, and intimacy trends.',
      color: '#2D6A4F',
      bg: 'rgba(45,106,79,0.1)',
      border: 'rgba(45,106,79,0.2)',
    },
    {
      icon: <Sparkles size={22} />,
      title: 'Couple Assessment Sessions',
      desc: 'Private shared sessions generate a joint report only after both partners independently answer the same questions.',
      color: 'var(--royal-gold)',
      bg: 'rgba(201,150,12,0.1)',
      border: 'var(--royal-border)',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Answer Sacred Questions',
      desc: 'Carefully structured prompts reveal true compatibility, values alignment, and deeper risk areas that matter.',
      fromColor: 'var(--royal-saffron)',
      toColor: 'var(--royal-gold)',
    },
    {
      num: '02',
      title: 'Receive Your Compatibility Report',
      desc: 'AI-powered analysis with strengths, gaps, and critical red flags — clarity you need before the most important decision.',
      fromColor: 'var(--royal-maroon)',
      toColor: 'var(--royal-saffron)',
    },
    {
      num: '03',
      title: 'Follow Your Path Forward',
      desc: 'Clear structured steps to decide with confidence or to rebuild and strengthen your sacred bond.',
      fromColor: '#2D6A4F',
      toColor: 'var(--royal-gold)',
    },
  ];

  const testimonials = [
    {
      name: 'Priya & Rahul',
      location: 'Mumbai',
      quote: 'VivahSutra helped us discover what family pressure had hidden from us. We made our decision with full clarity.',
      stars: 5,
    },
    {
      name: 'Ananya S.',
      location: 'Bangalore',
      quote: 'The red flag analysis was eye-opening. I finally had the data to trust my instincts and walk away safely.',
      stars: 5,
    },
    {
      name: 'Vikram & Kavitha',
      location: 'Chennai',
      quote: 'After five years of marriage, the health tracker helped us reconnect at a deeper level than ever before.',
      stars: 5,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--royal-parchment)' }}>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Dynamic Theme-Aware Hero Background */}
        <div
          className="absolute inset-0 noise-overlay"
          style={{
            background: 'var(--royal-hero-bg)',
          }}
        />
        {/* Saffron radial glow from bottom right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 70% at 80% 80%, var(--royal-hero-glow) 0%, transparent 65%)',
          }}
        />
        {/* Gold glow top left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 40% 40% at 10% 10%, rgba(201, 150, 12, 0.15) 0%, transparent 60%)',
          }}
        />

        {/* Mandala watermarks */}
        <div className="absolute -top-16 -left-16 pointer-events-none">
          <MandalaSVG size={380} opacity={0.12} />
        </div>
        <div className="absolute -bottom-20 -right-20 pointer-events-none">
          <MandalaSVG size={420} opacity={0.1} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <MandalaSVG size={600} opacity={0.04} />
        </div>

        {/* Decorative top border — gold paisley-inspired line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--royal-maroon), var(--royal-gold), var(--royal-saffron), var(--royal-gold), var(--royal-maroon))' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

            {/* LEFT: Text content */}
            <div className="flex-1 max-w-2xl">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 border"
                style={{
                  backgroundColor: 'rgba(201,150,12,0.15)',
                  borderColor: 'rgba(201,150,12,0.4)',
                  color: 'var(--royal-gold)',
                }}
              >
                <LotusIcon size={14} color="var(--royal-gold)" />
                AI-Powered Relationship Intelligence
              </motion.div>

              {/* Main heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-[2.4rem] sm:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] leading-[1.05] mb-6 tracking-tight"
                style={{
                  fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
                  color: 'var(--royal-text)',
                  textShadow: '0 2px 30px var(--royal-hero-shadow)',
                }}
              >
                Clarity before
                <br />
                <span style={{ color: 'var(--royal-saffron)', fontStyle: 'italic' }}>commitment.</span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-[2.8rem]" style={{ color: 'var(--royal-text)', opacity: 0.75, fontStyle: 'italic' }}>
                  Connection after marriage.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-base sm:text-lg leading-relaxed mb-10"
                style={{ color: 'var(--royal-text)', opacity: 0.8, maxWidth: '500px' }}
              >
                One wrong decision can cost years. One right tool can save your life.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(232,131,26,0.5), 0 8px 30px rgba(232,131,26,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('auth-before')}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-base shadow-2xl transition-all focus-ring"
                  style={{
                    background: 'linear-gradient(135deg, var(--royal-saffron) 0%, var(--royal-gold) 50%, var(--royal-saffron) 100%)',
                    backgroundSize: '200% 100%',
                    color: '#1C0A14',
                    border: '1px solid rgba(201,150,12,0.4)',
                  }}
                >
                  Begin Your Journey <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(253,248,242,0.1)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 border-2 px-8 py-4 rounded-full font-bold text-base transition-all focus-ring"
                  style={{ borderColor: 'rgba(253,248,242,0.25)', color: 'var(--royal-text)' }}
                >
                  See How It Works
                </motion.button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                className="flex items-center gap-6 mt-10"
              >
                {[
                  { icon: <Shield size={14} />, text: 'Private & Secure' },
                  { icon: <Users size={14} />, text: 'Couples Guided' },
                  { icon: <Star size={14} />, text: 'AI-Powered' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--royal-gold)', opacity: 0.8 }}>
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT: Photo card with ornamental border */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
              className="relative w-full lg:w-[440px] xl:w-[490px] shrink-0"
            >
              {/* Gold ornamental frame */}
              <div
                className="absolute -inset-2 rounded-[2rem]"
                style={{
                  background: 'linear-gradient(135deg, var(--royal-gold), var(--royal-maroon), var(--royal-saffron), var(--royal-gold))',
                  padding: '2px',
                }}
              >
                <div className="w-full h-full rounded-[1.8rem]" style={{ backgroundColor: '#1C0A14' }} />
              </div>

              {/* Corner ornaments */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-8 h-8 z-20`}
                  style={{
                    transform: `rotate(${i * 90}deg)`,
                    background: 'radial-gradient(circle at center, var(--royal-gold) 2px, transparent 2px)',
                  }}
                >
                  <div className="absolute inset-0" style={{ border: '2px solid var(--royal-gold)', borderRadius: '0 1rem 0 0', opacity: 0.6 }} />
                </div>
              ))}

              {/* Main image */}
              <div className="relative rounded-[1.5rem] overflow-hidden" style={{ height: '500px' }}>
                <img
                  src={weddingHero}
                  alt="Indian wedding couple — a sacred beginning"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                {/* Maroon gradient overlay bottom */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(28,10,20,0.85) 0%, rgba(28,10,20,0.1) 55%, transparent 100%)' }}
                />

                {/* Quote overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                  className="absolute bottom-0 left-0 right-0 p-7 z-10"
                >
                  <div className="mb-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill="var(--royal-gold)" color="var(--royal-gold)" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--royal-gold)', opacity: 0.7 }}>
                    Ancient Wisdom, Modern Clarity
                  </p>
                  <h3
                    className="text-xl leading-snug italic"
                    style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
                  >
                    "A marriage rooted in understanding flourishes for a lifetime."
                  </h3>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z" fill="var(--royal-parchment)" />
          </svg>
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────── */}
      <section className="relative py-16 lg:py-20" style={{ backgroundColor: 'var(--royal-card-bg)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="text-center group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-110"
                  style={{
                    background: 'var(--royal-glow)',
                    border: '1px solid var(--royal-border)',
                    color: 'var(--royal-gold)',
                  }}
                >
                  {s.icon}
                </div>
                <p
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 group-hover:scale-105 transition-transform"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    background: 'linear-gradient(135deg, var(--royal-saffron), var(--royal-gold))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.value}
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px w-6" style={{ background: 'linear-gradient(to right, transparent, var(--royal-gold))', opacity: 0.4 }} />
                  <div className="w-1 h-1 rotate-45" style={{ backgroundColor: 'var(--royal-gold)', opacity: 0.5 }} />
                  <div className="h-px w-6" style={{ background: 'linear-gradient(to left, transparent, var(--royal-gold))', opacity: 0.4 }} />
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────── */}
      <section
        className="relative py-20 lg:py-28 overflow-hidden"
        style={{ backgroundColor: 'var(--royal-accent)' }}
      >
        {/* Mandala watermark */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
          <MandalaSVG size={400} opacity={1} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <LotusIcon size={16} color="var(--royal-saffron)" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--royal-saffron)' }}>
                What VivahSutra Offers
              </p>
              <LotusIcon size={16} color="var(--royal-saffron)" />
            </div>
            <h2
              className="text-4xl sm:text-5xl tracking-tight mb-4"
              style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
            >
              Everything You Need to <em style={{ color: 'var(--royal-maroon)' }}>Decide Wisely</em>
            </h2>
            <DiamondDivider />
            <p className="text-base leading-relaxed mt-4" style={{ color: 'var(--text-secondary)' }}>
              Rooted in cultural understanding. Powered by modern AI intelligence.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                whileHover={{ y: -6, boxShadow: `0 20px 60px ${f.color}20, 0 8px 20px rgba(0,0,0,0.06)` }}
                className="relative overflow-hidden rounded-[1.5rem] p-7 transition-all cursor-default"
                style={{
                  backgroundColor: 'var(--royal-card-bg)',
                  border: `1px solid ${f.border}`,
                  boxShadow: '0 2px 12px rgba(44,26,14,0.04)',
                }}
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
                />
                {/* Corner ornament */}
                <div
                  className="absolute top-3 right-3 w-6 h-6 opacity-20"
                  style={{
                    background: `radial-gradient(circle, ${f.color} 1px, transparent 1px) 0 0 / 4px 4px`,
                  }}
                />

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: f.bg, color: f.color, border: `1px solid ${f.border}` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2.5" style={{ color: 'var(--royal-text)', fontFamily: '"Playfair Display", serif' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: 'var(--royal-parchment)' }}>
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-15">
          <MandalaSVG size={350} opacity={1} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-1 h-1 rotate-45" style={{ backgroundColor: '#2D6A4F' }} />
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#2D6A4F' }}>The Sacred Path</p>
              <div className="w-1 h-1 rotate-45" style={{ backgroundColor: '#2D6A4F' }} />
            </div>
            <h2
              className="text-4xl sm:text-5xl tracking-tight mb-4"
              style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
            >
              Three Steps to <em style={{ color: 'var(--royal-saffron)' }}>Lasting Clarity</em>
            </h2>
            <DiamondDivider />
            <p className="text-base leading-relaxed mt-4" style={{ color: 'var(--text-secondary)' }}>
              Your path to relationship wisdom — structured, simple, and profound.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                whileHover={{ y: -5 }}
                className="relative overflow-hidden rounded-[1.5rem] p-8 transition-all"
                style={{
                  backgroundColor: 'var(--royal-card-bg)',
                  border: '1px solid var(--royal-border)',
                  boxShadow: '0 2px 16px rgba(44,26,14,0.05)',
                }}
              >
                {/* Gradient glow in corner */}
                <div
                  className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-15 transition-opacity group-hover:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${step.fromColor}, ${step.toColor})` }}
                />
                {/* Step number */}
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-bold text-white shadow-lg mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${step.fromColor}, ${step.toColor})`,
                    fontFamily: '"Playfair Display", serif',
                    boxShadow: `0 8px 24px ${step.fromColor}40`,
                  }}
                >
                  {step.num}
                </div>

                {/* Connecting line between cards */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-[3.5rem] -right-3 w-6 z-10"
                    style={{ color: 'var(--royal-gold)' }}
                  >
                    <ArrowRight size={20} style={{ color: 'rgba(201,150,12,0.4)' }} />
                  </div>
                )}

                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {step.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO JOURNEYS ──────────────────────────────────────────── */}
      <section
        className="relative py-20 lg:py-28 overflow-hidden"
        style={{ backgroundColor: 'var(--royal-accent)' }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-4xl sm:text-5xl tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
            >
              Choose Your <em style={{ color: 'var(--royal-maroon)' }}>Sacred Journey</em>
            </h2>
            <DiamondDivider />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Before Marriage */}
            <motion.article
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10 transition-all"
              style={{
                background: 'linear-gradient(145deg, #1C0A14 0%, #3D0F24 60%, #6B1437 100%)',
                border: '1px solid rgba(201,150,12,0.3)',
                boxShadow: '0 4px 40px rgba(139,26,58,0.2)',
              }}
            >
              {/* Gold border top */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, var(--royal-maroon), var(--royal-gold), var(--royal-saffron), var(--royal-gold), var(--royal-maroon))' }}
              />
              {/* Mandala accent */}
              <div className="absolute -bottom-12 -right-12 opacity-10 pointer-events-none">
                <MandalaSVG size={200} opacity={1} />
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-5"
                style={{ backgroundColor: 'rgba(201,150,12,0.15)', border: '1px solid rgba(201,150,12,0.3)', color: 'var(--royal-gold)' }}
              >
                <LotusIcon size={12} color="var(--royal-gold)" /> Before Marriage
              </div>

              <h3
                className="text-3xl sm:text-4xl leading-tight mb-4"
                style={{ fontFamily: '"Playfair Display", serif', color: '#FDF8F2' }}
              >
                Seeking Clarity<br />Before Commitment?
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(253,248,242,0.7)' }}>
                In Indian culture, marriage is forever. Stop guessing and get deep insights before making
                the most sacred commitment of your life.
              </p>

              <ul className="space-y-3 mb-8">
                {['Compatibility Deep Scan', 'Red Flag Intelligence', 'Make Confident, Informed Decisions'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(253,248,242,0.85)' }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(232,131,26,0.2)', border: '1px solid rgba(232,131,26,0.4)' }}
                    >
                      <CheckCircle2 size={12} style={{ color: 'var(--royal-saffron)' }} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(232,131,26,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('auth-before')}
                className="flex items-center justify-between w-full rounded-2xl px-7 py-4 font-bold text-sm transition-all focus-ring"
                style={{
                  background: 'linear-gradient(135deg, var(--royal-saffron) 0%, var(--royal-gold) 100%)',
                  color: '#1C0A14',
                }}
              >
                <span>Start Before Marriage Journey</span>
                <ArrowRight size={20} />
              </motion.button>
            </motion.article>

            {/* After Marriage */}
            <motion.article
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10 transition-all"
              style={{
                background: 'linear-gradient(145deg, #0A1C14 0%, #102B1E 60%, #1A3D2B 100%)',
                border: '1px solid rgba(45,106,79,0.4)',
                boxShadow: '0 4px 40px rgba(45,106,79,0.15)',
              }}
            >
              {/* Mehndi green border top */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, #2D6A4F, #52B788, var(--royal-gold), #52B788, #2D6A4F)' }}
              />
              <div className="absolute -bottom-12 -right-12 opacity-10 pointer-events-none">
                <MandalaSVG size={200} opacity={1} />
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-5"
                style={{ backgroundColor: 'rgba(45,106,79,0.2)', border: '1px solid rgba(82,183,136,0.3)', color: '#52B788' }}
              >
                <Heart size={12} fill="#52B788" color="#52B788" /> After Marriage
              </div>

              <h3
                className="text-3xl sm:text-4xl leading-tight mb-4"
                style={{ fontFamily: '"Playfair Display", serif', color: '#FDF8F2' }}
              >
                Facing Challenges<br />in Your Relationship?
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(253,248,242,0.7)' }}>
                Repair and rebuild together with structured assessment sessions,
                weekly health tracking, and guided conflict resolution.
              </p>

              <ul className="space-y-3 mb-8">
                {['Couple Assessment Sessions', 'Conflict Risk Monitor', 'Rebuild Sacred Connection'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium" style={{ color: 'rgba(253,248,242,0.85)' }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(45,106,79,0.25)', border: '1px solid rgba(82,183,136,0.4)' }}
                    >
                      <CheckCircle2 size={12} style={{ color: '#52B788' }} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(45,106,79,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('auth-after')}
                className="flex items-center justify-between w-full rounded-2xl px-7 py-4 font-bold text-sm transition-all focus-ring"
                style={{
                  background: 'linear-gradient(135deg, #2D6A4F 0%, #1A3D2B 100%)',
                  color: 'white',
                }}
              >
                <span>Start After Marriage Journey</span>
                <ArrowRight size={20} />
              </motion.button>
            </motion.article>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: 'var(--royal-parchment)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Star size={14} fill="var(--royal-gold)" color="var(--royal-gold)" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--royal-gold)' }}>Sacred Testimonials</p>
              <Star size={14} fill="var(--royal-gold)" color="var(--royal-gold)" />
            </div>
            <h2
              className="text-4xl sm:text-5xl tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif', color: 'var(--royal-text)' }}
            >
              Stories of <em style={{ color: 'var(--royal-maroon)' }}>Clarity & Love</em>
            </h2>
            <DiamondDivider />
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative p-8 rounded-[2rem] border"
                style={{ backgroundColor: 'var(--royal-card-bg)', borderColor: 'var(--royal-border)' }}
              >
                <div
                  className="text-5xl opacity-10 absolute top-4 left-6 pointer-events-none"
                  style={{ color: 'var(--royal-gold)', fontFamily: 'serif' }}
                >
                  "
                </div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: 'var(--text-secondary)' }}>
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'rgba(201,150,12,0.1)', color: 'var(--royal-gold)' }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--royal-text)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.location}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={10} fill="var(--royal-gold)" color="var(--royal-gold)" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer
        className="relative py-16 border-t"
        style={{ backgroundColor: 'var(--royal-accent)', borderColor: 'var(--royal-border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-8">
            <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--royal-maroon)', color: 'white' }}
              >
                <Heart fill="currentColor" size={24} />
              </div>
              <span
                className="text-2xl font-semibold tracking-wide"
                style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--royal-text)' }}
              >
                Vivah<span className="italic" style={{ color: 'var(--royal-saffron)' }}>Sutra</span>
              </span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sacred Bonds, Modern Clarity</p>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-8">
              {['Features', 'Pricing', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <button
                  key={link}
                  className="text-xs font-semibold hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
                >
                  {link}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <DiamondDivider />
          </div>

          {/* Copyright */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© {new Date().getFullYear()} VivahSutra</p>
        </div>
      </footer>
    </div>
  );
}