import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

type RedFlagCheckerProps = {
  onNavigate: (page: string) => void;
};

type RedFlagQuestion = {
  id: string;
  category: string;
  question: string;
  severity: 'high' | 'medium' | 'low';
};

const redFlagQuestions: RedFlagQuestion[] = [
  { id: 'rf1', category: 'Emotional Control', question: 'Does your partner frequently lose their temper or have angry outbursts?', severity: 'high' },
  { id: 'rf2', category: 'Respect', question: 'Does your partner belittle, criticize, or mock you in front of others?', severity: 'high' },
  { id: 'rf3', category: 'Control', question: 'Does your partner try to control who you see or how you spend your time?', severity: 'high' },
  { id: 'rf4', category: 'Honesty', question: 'Have you caught your partner in significant lies or deception?', severity: 'high' },
  { id: 'rf5', category: 'Addiction', question: 'Does your partner have substance abuse or addiction issues they refuse to address?', severity: 'high' },
  { id: 'rf6', category: 'Financial', question: 'Does your partner hide financial information or have secret debts?', severity: 'medium' },
  { id: 'rf7', category: 'Communication', question: 'Does your partner give you the silent treatment or refuse to communicate during conflicts?', severity: 'medium' },
  { id: 'rf8', category: 'Family Pressure', question: 'Are you being pressured into this relationship by family or society?', severity: 'medium' },
  { id: 'rf9', category: 'Values', question: 'Do you have fundamentally different views on important life decisions?', severity: 'medium' },
  { id: 'rf10', category: 'Past Behavior', question: 'Has your partner shown a pattern of dishonesty in past relationships?', severity: 'medium' },
  { id: 'rf11', category: 'Lifestyle', question: 'Do you feel like you have to change who you are to make the relationship work?', severity: 'low' },
  { id: 'rf12', category: 'Compatibility', question: 'Do you have significantly different expectations about daily life?', severity: 'low' },
];

// ── Severity config ──────────────────────────────────────────────────────────
const severityConfig = {
  high: {
    bg: 'rgba(166,93,80,0.07)',
    border: 'rgba(166,93,80,0.18)',
    text: '#a65d50',
    badgeBg: 'rgba(166,93,80,0.1)',
    label: 'High',
  },
  medium: {
    bg: 'rgba(217,119,87,0.07)',
    border: 'rgba(217,119,87,0.18)',
    text: '#d97757',
    badgeBg: 'rgba(217,119,87,0.1)',
    label: 'Medium',
  },
  low: {
    bg: 'rgba(201,138,94,0.07)',
    border: 'rgba(201,138,94,0.18)',
    text: '#c98a5e',
    badgeBg: 'rgba(201,138,94,0.1)',
    label: 'Low',
  },
};

// ── Reusable spinner ─────────────────────────────────────────────────────────
function PageSpinner({ color = '#d97757', label }: { color?: string; label: string }) {
  return (
    <div
      className="min-h-[calc(100vh-68px)] flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div
          className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: `${color}33`, borderTopColor: color }}
        />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function RedFlagChecker({ onNavigate }: RedFlagCheckerProps) {
  const { profile, loading } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <PageSpinner label="Loading workspace…" />;

  if (!profile) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center px-4 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="premium-card p-10 max-w-sm w-full text-center animate-rise-in"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'var(--brand-rose-light)', color: 'var(--brand-rose)' }}
          >
            <ShieldAlert size={26} />
          </div>
          <p className="font-bold text-base mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            Please sign in to run a Risk Analysis.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-[#d97757] text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleAnswer = async (answer: boolean) => {
    const newAnswers = { ...answers, [redFlagQuestions[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < redFlagQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await saveResults(newAnswers);
    }
  };

  const saveResults = async (finalAnswers: Record<string, boolean>) => {
    setSaving(true);
    try {
      const detectedFlags = redFlagQuestions.filter((q) => finalAnswers[q.id] === true);
      for (const flag of detectedFlags) {
        await supabase.from('red_flags').insert({
          user_id: profile!.id,
          category: flag.category,
          severity: flag.severity,
          description: flag.question,
        });
      }
      setShowResults(true);
    } catch (error) {
      console.error('Error saving red flags:', error);
    } finally {
      setSaving(false);
    }
  };

  // ── Saving state ────────────────────────────────────────────────────────────
  if (saving) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="premium-card p-12 max-w-sm w-full text-center animate-scale-in"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'var(--brand-rose-light)', color: '#a65d50' }}
          >
            <Loader2 size={26} className="animate-spin" />
          </div>
          <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Analyzing your responses…
          </p>
          <div className="mt-6 space-y-2">
            <div className="skeleton h-2.5 rounded-full w-full" />
            <div className="skeleton h-2.5 rounded-full w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (showResults) {
    const detectedFlags = redFlagQuestions.filter((q) => answers[q.id] === true);
    const highSeverity = detectedFlags.filter((f) => f.severity === 'high').length;
    const mediumSeverity = detectedFlags.filter((f) => f.severity === 'medium').length;
    const lowSeverity = detectedFlags.filter((f) => f.severity === 'low').length;

    const resultHeader = highSeverity > 0
      ? { icon: <XCircle size={48} className="text-[#a65d50]" />, bg: 'rgba(166,93,80,0.08)', border: 'rgba(166,93,80,0.18)', title: 'Critical Warnings Detected', subtitle: `We found ${detectedFlags.length} potential red flags`, countColor: '#a65d50' }
      : detectedFlags.length > 0
        ? { icon: <AlertTriangle size={48} className="text-[#d97757]" />, bg: 'rgba(217,119,87,0.08)', border: 'rgba(217,119,87,0.18)', title: 'Areas of Concern', subtitle: `We found ${detectedFlags.length} items to address`, countColor: '#d97757' }
        : { icon: <CheckCircle size={48} className="text-[#5c7c64]" />, bg: 'rgba(92,124,100,0.08)', border: 'rgba(92,124,100,0.18)', title: 'Looking Good!', subtitle: 'No major behavioral risks detected in your analysis.', countColor: '#5c7c64' };

    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-rise-in">

          {/* Result header card */}
          <div
            className="premium-card p-8 sm:p-12 text-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2"
              style={{ backgroundColor: resultHeader.bg, borderColor: resultHeader.border }}
            >
              {resultHeader.icon}
            </div>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              {resultHeader.title}
            </h2>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              {resultHeader.subtitle}
            </p>
          </div>

          {/* Flag groups */}
          <div className="space-y-5">
            {(['high', 'medium', 'low'] as const).map((sev) => {
              const flags = detectedFlags.filter((f) => f.severity === sev);
              if (flags.length === 0) return null;
              const cfg = severityConfig[sev];
              const count = sev === 'high' ? highSeverity : sev === 'medium' ? mediumSeverity : lowSeverity;
              const summaries: Record<string, string> = {
                high: 'These are serious concerns that require immediate professional attention or serious reconsideration.',
                medium: 'These issues should be addressed through open communication and possibly coaching.',
                low: 'Keep these in mind and monitor them through honest, ongoing communication.',
              };

              return (
                <div
                  key={sev}
                  className="rounded-2xl p-6 sm:p-8 border"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <AlertTriangle size={22} style={{ color: cfg.text }} className="shrink-0" />
                    <h3 className="font-extrabold text-lg" style={{ color: cfg.text }}>
                      {cfg.label} Severity Issues ({count})
                    </h3>
                  </div>
                  <ul className="space-y-2.5 mb-5">
                    {flags.map((flag, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl p-3 border text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: cfg.border,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span
                          className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded mr-2"
                          style={{ backgroundColor: cfg.badgeBg, color: cfg.text }}
                        >
                          {flag.category}
                        </span>
                        {flag.question}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="text-sm font-semibold rounded-xl px-4 py-3 border"
                    style={{ backgroundColor: cfg.badgeBg, borderColor: cfg.border, color: cfg.text }}
                  >
                    {summaries[sev]}
                  </p>
                </div>
              );
            })}

            {/* Clean result */}
            {detectedFlags.length === 0 && (
              <div
                className="rounded-2xl p-8 border text-center"
                style={{ backgroundColor: 'rgba(92,124,100,0.07)', borderColor: 'rgba(92,124,100,0.18)' }}
              >
                <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Based on your responses, we didn't detect any major behavioral red flags.
                  Continue nurturing healthy communication and transparency.
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div
            className="flex flex-col sm:flex-row gap-3 pt-2 border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 py-4 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            >
              Return to Dashboard
            </button>
            {detectedFlags.length > 0 && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#d97757] text-white py-4 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 focus-ring"
              >
                View Resources <ArrowRight size={18} />
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ── Quiz question ───────────────────────────────────────────────────────────
  const progress = ((currentQuestion + 1) / redFlagQuestions.length) * 100;
  const current = redFlagQuestions[currentQuestion];
  const sev = severityConfig[current.severity];

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div
          className="premium-card p-8 sm:p-12"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Progress header */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-3 px-1"
              style={{ color: 'var(--text-muted)' }}>
              <span>Question {currentQuestion + 1} / {redFlagQuestions.length}</span>
              <span style={{ color: '#d97757' }}>{Math.round(progress)}%</span>
            </div>
            <div
              className="w-full rounded-full h-2.5 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #d97757, #a65d50)',
                }}
              />
            </div>
          </div>

          {/* Category badge */}
          <div className="mb-6">
            <span
              className="badge"
              style={{ backgroundColor: sev.badgeBg, color: sev.text }}
            >
              {current.category}
            </span>
          </div>

          {/* Question */}
          <h2
            className="text-2xl sm:text-3xl font-extrabold leading-tight mb-10"
            style={{ color: 'var(--text-primary)' }}
          >
            {current.question}
          </h2>

          {/* Yes / No */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 py-5 rounded-2xl font-bold text-xl border-2 transition-all hover:-translate-y-0.5 focus-ring"
              style={{
                backgroundColor: 'rgba(166,93,80,0.06)',
                borderColor: 'rgba(166,93,80,0.2)',
                color: '#a65d50',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#a65d50';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(166,93,80,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = '#a65d50';
              }}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 py-5 rounded-2xl font-bold text-xl border-2 transition-all hover:-translate-y-0.5 focus-ring"
              style={{
                backgroundColor: 'rgba(92,124,100,0.06)',
                borderColor: 'rgba(92,124,100,0.2)',
                color: '#5c7c64',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5c7c64';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(92,124,100,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = '#5c7c64';
              }}
            >
              No
            </button>
          </div>

          <p
            className="mt-8 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Answer honestly for accurate analysis
          </p>
        </div>
      </div>
    </div>
  );
}