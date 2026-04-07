import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Users,
  Scale,
  Shield,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  analyzePulseCheckWithGemini,
  PulseCheckReport,
  PulsePartnerResponses,
} from '../lib/ai';
import { supabase } from '../lib/supabase';

type CouplePulseCheckProps = {
  onNavigate: (page: string) => void;
};

// ── Stage definitions ──────────────────────────────────────────────
type Stage =
  | 'setup'
  | 'a-connection'
  | 'a-responsibility'
  | 'a-trust'
  | 'handoff'
  | 'b-connection'
  | 'b-responsibility'
  | 'b-trust'
  | 'analyzing'
  | 'results';

const STAGE_ORDER: Stage[] = [
  'setup',
  'a-connection',
  'a-responsibility',
  'a-trust',
  'handoff',
  'b-connection',
  'b-responsibility',
  'b-trust',
  'analyzing',
  'results',
];

const stageLabel = (s: Stage): string => {
  switch (s) {
    case 'setup': return 'Setup';
    case 'a-connection': return 'Connection';
    case 'a-responsibility': return 'Responsibility';
    case 'a-trust': return 'Trust';
    case 'handoff': return 'Handoff';
    case 'b-connection': return 'Connection';
    case 'b-responsibility': return 'Responsibility';
    case 'b-trust': return 'Trust';
    case 'analyzing': return 'Analyzing';
    case 'results': return 'Results';
  }
};

const stageIcon = (s: Stage) => {
  switch (s) {
    case 'setup': return <Users size={16} />;
    case 'a-connection':
    case 'b-connection': return <Heart size={16} />;
    case 'a-responsibility':
    case 'b-responsibility': return <Scale size={16} />;
    case 'a-trust':
    case 'b-trust': return <Shield size={16} />;
    case 'handoff': return <RotateCcw size={16} />;
    case 'analyzing': return <Sparkles size={16} />;
    case 'results': return <Zap size={16} />;
  }
};

const emptyResponses = (): PulsePartnerResponses => ({
  connection_rating: 5,
  valued_action: '',
  intentional_time: false,
  tasks_handled: '',
  workload_fair: true,
  workload_explanation: '',
  insecurity_triggers: '',
  boundaries_crossed: false,
  boundaries_explanation: '',
  hidden_anything: false,
});

// ── Component ────────────────────────────────────────────────────────
export function CouplePulseCheck({ onNavigate }: CouplePulseCheckProps) {
  const { profile } = useAuth();
  const [stage, setStage] = useState<Stage>('setup');
  const [partnerAName, setPartnerAName] = useState('');
  const [partnerBName, setPartnerBName] = useState('');
  const [partnerA, setPartnerA] = useState<PulsePartnerResponses>(emptyResponses());
  const [partnerB, setPartnerB] = useState<PulsePartnerResponses>(emptyResponses());
  const [report, setReport] = useState<PulseCheckReport | null>(null);
  const [error, setError] = useState('');

  const stageIdx = STAGE_ORDER.indexOf(stage);
  const progressPct = Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 100);

  const go = (s: Stage) => {
    setError('');
    setStage(s);
    window.scrollTo(0, 0);
  };

  const next = () => {
    const i = STAGE_ORDER.indexOf(stage);
    if (i < STAGE_ORDER.length - 1) go(STAGE_ORDER[i + 1]);
  };

  const prev = () => {
    const i = STAGE_ORDER.indexOf(stage);
    if (i > 0) go(STAGE_ORDER[i - 1]);
  };

  // ── Setup validation ──
  const handleStartSetup = () => {
    if (!partnerAName.trim() || !partnerBName.trim()) {
      setError('Please enter both partner names to begin.');
      return;
    }
    next();
  };

  // ── Connection validation ──
  const validateConnection = (r: PulsePartnerResponses): boolean => {
    if (!r.valued_action.trim()) {
      setError('Please describe what made you feel valued.');
      return false;
    }
    return true;
  };

  // ── Responsibility validation ──
  const validateResponsibility = (r: PulsePartnerResponses): boolean => {
    if (!r.tasks_handled.trim()) {
      setError('Please list the tasks you handled.');
      return false;
    }
    return true;
  };

  // ── Trust validation (minimal) ──
  const validateTrust = (_r: PulsePartnerResponses): boolean => true;

  // ── Run analysis ──
  const runAnalysis = async () => {
    go('analyzing');
    try {
      const result = await analyzePulseCheckWithGemini(
        partnerAName,
        partnerBName,
        partnerA,
        partnerB
      );
      if (!result) throw new Error('AI analysis returned empty.');

      setReport(result);

      // Save to local DB
      if (profile) {
        await supabase.from('pulse_check_sessions').insert({
          user_id: profile.id,
          partner_a_name: partnerAName,
          partner_b_name: partnerBName,
          partner_a_responses: partnerA as unknown as Record<string, unknown>,
          partner_b_responses: partnerB as unknown as Record<string, unknown>,
          report: result as unknown as Record<string, unknown>,
        });
      }

      go('results');
    } catch (e: any) {
      console.error('Pulse analysis failed:', e);
      setError(e.message || 'Analysis failed. Please try again.');
      go('b-trust'); // go back so user can retry
    }
  };

  // ── Stage handlers ──
  const handleNextConnection = (isA: boolean) => {
    const r = isA ? partnerA : partnerB;
    if (!validateConnection(r)) return;
    next();
  };

  const handleNextResponsibility = (isA: boolean) => {
    const r = isA ? partnerA : partnerB;
    if (!validateResponsibility(r)) return;
    next();
  };

  const handleNextTrust = (isA: boolean) => {
    const r = isA ? partnerA : partnerB;
    if (!validateTrust(r)) return;
    if (isA) {
      next(); // go to handoff
    } else {
      runAnalysis(); // go to analyzing
    }
  };

  // ── Helpers for Partner A/B input ──
  const updateA = (patch: Partial<PulsePartnerResponses>) =>
    setPartnerA((p) => ({ ...p, ...patch }));
  const updateB = (patch: Partial<PulsePartnerResponses>) =>
    setPartnerB((p) => ({ ...p, ...patch }));

  // ── Score color helpers ──
  const scoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'rgba(16,185,129,0.1)';
    if (score >= 60) return 'rgba(245,158,11,0.1)';
    return 'rgba(244,63,94,0.1)';
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 sm:py-14 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">
        {/* ── Progress bar ── */}
        {stage !== 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Heart className="text-white" size={20} fill="currentColor" />
                </div>
                Couple Pulse
              </h1>
              <span
                className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border"
                style={{
                  color: 'var(--brand-emerald)',
                  backgroundColor: 'var(--brand-emerald-light)',
                  borderColor: 'rgba(16,185,129,0.2)',
                }}
              >
                {stageLabel(stage)}
              </span>
            </div>

            {/* Progress track */}
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-between gap-1">
              {STAGE_ORDER.filter((s) => s !== 'analyzing').map((s, i) => {
                const idx = STAGE_ORDER.indexOf(s);
                const isComplete = stageIdx > idx;
                const isCurrent = stage === s;
                return (
                  <div
                    key={s}
                    className="flex flex-col items-center gap-1"
                    title={stageLabel(s)}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={
                        isCurrent
                          ? { backgroundColor: '#10b981', color: '#fff', boxShadow: '0 0 0 3px rgba(16,185,129,0.3)' }
                          : isComplete
                          ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }
                          : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }
                      }
                    >
                      {isComplete ? <CheckCircle2 size={14} /> : stageIcon(s)}
                    </div>
                    <span
                      className="hidden sm:block text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: isCurrent ? '#10b981' : 'var(--text-muted)' }}
                    >
                      {i <= 3 ? (i === 0 ? '' : `A`) : i === 4 ? '' : 'B'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm font-medium animate-fade-in"
            style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ═══════════ SETUP ═══════════ */}
        {stage === 'setup' && (
          <div
            className="premium-card p-8 sm:p-10 space-y-8 animate-rise-in"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <Users className="text-white" size={32} />
              </div>
              <h2
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Weekly Couple Pulse
              </h2>
              <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Both partners will answer questions about Connection, Responsibility, and Trust.
                Then AI will analyze your relationship pulse for this week.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Partner A Name
                </label>
                <input
                  type="text"
                  value={partnerAName}
                  onChange={(e) => setPartnerAName(e.target.value)}
                  className="input-base"
                  placeholder="e.g., Priya"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Partner B Name
                </label>
                <input
                  type="text"
                  value={partnerBName}
                  onChange={(e) => setPartnerBName(e.target.value)}
                  className="input-base"
                  placeholder="e.g., Raj"
                />
              </div>
            </div>

            {/* How it works */}
            <div
              className="rounded-2xl p-5 border space-y-3"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
            >
              <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                How It Works
              </h4>
              <div className="grid gap-2">
                {[
                  { icon: <Heart size={14} />, text: 'Connection — Rate how connected you felt this week' },
                  { icon: <Scale size={14} />, text: 'Responsibility — Evaluate workload fairness' },
                  { icon: <Shield size={14} />, text: 'Trust — Reflect on honesty and security' },
                  { icon: <Sparkles size={14} />, text: 'AI analyzes both responses and generates your pulse report' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
                    >
                      {item.icon}
                    </span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartSetup}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 focus-ring"
            >
              Begin — {partnerAName || 'Partner A'} Goes First <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ═══════════ CONNECTION STAGE ═══════════ */}
        {(stage === 'a-connection' || stage === 'b-connection') && (
          <ConnectionStage
            partnerName={stage === 'a-connection' ? partnerAName : partnerBName}
            responses={stage === 'a-connection' ? partnerA : partnerB}
            update={stage === 'a-connection' ? updateA : updateB}
            onNext={() => handleNextConnection(stage === 'a-connection')}
            onPrev={prev}
          />
        )}

        {/* ═══════════ RESPONSIBILITY STAGE ═══════════ */}
        {(stage === 'a-responsibility' || stage === 'b-responsibility') && (
          <ResponsibilityStage
            partnerName={stage === 'a-responsibility' ? partnerAName : partnerBName}
            responses={stage === 'a-responsibility' ? partnerA : partnerB}
            update={stage === 'a-responsibility' ? updateA : updateB}
            onNext={() => handleNextResponsibility(stage === 'a-responsibility')}
            onPrev={prev}
          />
        )}

        {/* ═══════════ TRUST STAGE ═══════════ */}
        {(stage === 'a-trust' || stage === 'b-trust') && (
          <TrustStage
            partnerName={stage === 'a-trust' ? partnerAName : partnerBName}
            responses={stage === 'a-trust' ? partnerA : partnerB}
            update={stage === 'a-trust' ? updateA : updateB}
            onNext={() => handleNextTrust(stage === 'a-trust')}
            onPrev={prev}
            isLastStage={stage === 'b-trust'}
          />
        )}

        {/* ═══════════ HANDOFF ═══════════ */}
        {stage === 'handoff' && (
          <div
            className="premium-card p-10 sm:p-14 text-center space-y-8 animate-rise-in relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-500/10 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-pulse">
                <RotateCcw className="text-white" size={36} />
              </div>

              <div>
                <h2
                  className="text-3xl font-extrabold tracking-tight mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Time to Switch!
                </h2>
                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-extrabold" style={{ color: 'var(--brand-emerald)' }}>{partnerAName}</span> is done.
                  Please hand the device to{' '}
                  <span className="font-extrabold" style={{ color: 'var(--brand-emerald)' }}>{partnerBName}</span>.
                </p>
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold border"
                style={{
                  backgroundColor: 'rgba(245,158,11,0.08)',
                  borderColor: 'rgba(245,158,11,0.2)',
                  color: '#d97706',
                }}
              >
                <Shield size={16} />
                {partnerAName}'s answers are private and won't be shown
              </div>

              <button
                onClick={next}
                className="w-full max-w-sm mx-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 focus-ring"
              >
                I'm {partnerBName} — Let's Begin <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ ANALYZING ═══════════ */}
        {stage === 'analyzing' && (
          <div
            className="premium-card p-14 text-center space-y-6 animate-rise-in"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <Sparkles className="text-white" size={36} />
              </div>
              <div className="absolute -inset-3 rounded-[28px] border-2 border-emerald-400/20 border-t-emerald-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Analyzing Your Pulse
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Gemini AI is cross-referencing both partners' answers to generate your relationship pulse report…
            </p>
            <Loader2 className="animate-spin mx-auto text-emerald-500" size={28} />
          </div>
        )}

        {/* ═══════════ RESULTS ═══════════ */}
        {stage === 'results' && report && (
          <ResultsDashboard
            report={report}
            partnerAName={partnerAName}
            partnerBName={partnerBName}
            scoreColor={scoreColor}
            scoreBg={scoreBg}
            onNavigate={onNavigate}
            onRestart={() => {
              setPartnerA(emptyResponses());
              setPartnerB(emptyResponses());
              setReport(null);
              setError('');
              go('setup');
            }}
          />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── Substage Components ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function StageCard({
  icon,
  title,
  subtitle,
  partnerName,
  children,
  onNext,
  onPrev,
  nextLabel = 'Continue',
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  partnerName: string;
  children: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
  nextLabel?: string;
  gradient: string;
}) {
  return (
    <div
      className="premium-card p-8 sm:p-10 space-y-6 animate-rise-in"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg shrink-0`}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
            >
              {partnerName}
            </span>
          </div>
          <h2
            className="text-xl sm:text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onPrev}
          className="flex-shrink-0 px-5 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring flex items-center gap-2"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
        >
          {nextLabel} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Question helpers ────────────────────────────────────────────
function QuestionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
      {children}
    </label>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className="flex-1 py-3 rounded-xl font-bold text-sm border transition-all hover:-translate-y-0.5 focus-ring"
          style={
            value === v
              ? { backgroundColor: 'var(--brand-emerald)', borderColor: 'var(--brand-emerald)', color: '#fff' }
              : { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }
          }
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

// ── Connection Stage ────────────────────────────────────────────
function ConnectionStage({
  partnerName,
  responses,
  update,
  onNext,
  onPrev,
}: {
  partnerName: string;
  responses: PulsePartnerResponses;
  update: (patch: Partial<PulsePartnerResponses>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <StageCard
      icon={<Heart className="text-white" size={24} fill="currentColor" />}
      title="Connection Check"
      subtitle="How connected did you feel with your partner this week?"
      partnerName={partnerName}
      onNext={onNext}
      onPrev={onPrev}
      gradient="bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/20"
    >
      {/* Rating slider */}
      <div>
        <QuestionLabel>
          On a scale of 1–10, how connected did you feel this week?
        </QuestionLabel>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={responses.connection_rating}
            onChange={(e) => update({ connection_rating: Number(e.target.value) })}
            className="flex-1 accent-emerald-500 h-2 rounded-full"
          />
          <span
            className="text-2xl font-extrabold w-10 text-center tabular-nums"
            style={{ color: 'var(--brand-emerald)' }}
          >
            {responses.connection_rating}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Disconnected</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Deeply Connected</span>
        </div>
      </div>

      {/* Valued action */}
      <div>
        <QuestionLabel>
          What did your partner do this week that made you feel valued?
        </QuestionLabel>
        <textarea
          value={responses.valued_action}
          onChange={(e) => update({ valued_action: e.target.value })}
          className="input-base min-h-[100px] resize-y"
          placeholder="E.g., They made me coffee every morning, they listened when I was stressed..."
        />
      </div>

      {/* Intentional time */}
      <div>
        <QuestionLabel>
          Did you spend intentional quality time together this week?
        </QuestionLabel>
        <YesNoToggle
          value={responses.intentional_time}
          onChange={(v) => update({ intentional_time: v })}
        />
      </div>
    </StageCard>
  );
}

// ── Responsibility Stage ────────────────────────────────────────
function ResponsibilityStage({
  partnerName,
  responses,
  update,
  onNext,
  onPrev,
}: {
  partnerName: string;
  responses: PulsePartnerResponses;
  update: (patch: Partial<PulsePartnerResponses>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <StageCard
      icon={<Scale className="text-white" size={24} />}
      title="Responsibility Balance"
      subtitle="Evaluate how tasks and effort were shared this week."
      partnerName={partnerName}
      onNext={onNext}
      onPrev={onPrev}
      gradient="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
    >
      {/* Tasks handled */}
      <div>
        <QuestionLabel>
          List the tasks you handled this week (household, planning, emotional support, etc.)
        </QuestionLabel>
        <textarea
          value={responses.tasks_handled}
          onChange={(e) => update({ tasks_handled: e.target.value })}
          className="input-base min-h-[100px] resize-y"
          placeholder="E.g., Cooking, kids' homework, laundry, scheduled doctor visits, emotional support after partner's bad day..."
        />
      </div>

      {/* Workload fair */}
      <div>
        <QuestionLabel>
          Do you feel the workload was fair this week?
        </QuestionLabel>
        <YesNoToggle
          value={responses.workload_fair}
          onChange={(v) => update({ workload_fair: v })}
        />
      </div>

      {/* Explanation */}
      <div>
        <QuestionLabel>
          Why or why not?
        </QuestionLabel>
        <textarea
          value={responses.workload_explanation}
          onChange={(e) => update({ workload_explanation: e.target.value })}
          className="input-base min-h-[80px] resize-y"
          placeholder="Explain your feeling about the balance..."
        />
      </div>
    </StageCard>
  );
}

// ── Trust Stage ─────────────────────────────────────────────────
function TrustStage({
  partnerName,
  responses,
  update,
  onNext,
  onPrev,
  isLastStage,
}: {
  partnerName: string;
  responses: PulsePartnerResponses;
  update: (patch: Partial<PulsePartnerResponses>) => void;
  onNext: () => void;
  onPrev: () => void;
  isLastStage: boolean;
}) {
  return (
    <StageCard
      icon={<Shield className="text-white" size={24} />}
      title="Trust & Honesty"
      subtitle="Reflect on trust, boundaries, and openness this week."
      partnerName={partnerName}
      onNext={onNext}
      onPrev={onPrev}
      nextLabel={isLastStage ? 'Analyze Pulse' : 'Continue'}
      gradient="bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20"
    >
      {/* Insecurity */}
      <div>
        <QuestionLabel>
          Did anything this week make you feel insecure or doubtful?
        </QuestionLabel>
        <textarea
          value={responses.insecurity_triggers}
          onChange={(e) => update({ insecurity_triggers: e.target.value })}
          className="input-base min-h-[80px] resize-y"
          placeholder="Describe what made you feel insecure, or type 'Nothing' if all good..."
        />
      </div>

      {/* Boundaries */}
      <div>
        <QuestionLabel>
          Were any boundaries crossed this week?
        </QuestionLabel>
        <YesNoToggle
          value={responses.boundaries_crossed}
          onChange={(v) => update({ boundaries_crossed: v })}
        />
        {responses.boundaries_crossed && (
          <div className="mt-3 animate-fade-in">
            <textarea
              value={responses.boundaries_explanation}
              onChange={(e) => update({ boundaries_explanation: e.target.value })}
              className="input-base min-h-[70px] resize-y"
              placeholder="Please explain what happened..."
            />
          </div>
        )}
      </div>

      {/* Hidden anything */}
      <div>
        <QuestionLabel>
          Did you hide anything important from your partner this week?
        </QuestionLabel>
        <YesNoToggle
          value={responses.hidden_anything}
          onChange={(v) => update({ hidden_anything: v })}
        />
      </div>
    </StageCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── Results Dashboard ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function ResultsDashboard({
  report,
  partnerAName,
  partnerBName,
  scoreColor,
  scoreBg,
  onNavigate,
  onRestart,
}: {
  report: PulseCheckReport;
  partnerAName: string;
  partnerBName: string;
  scoreColor: (s: number) => string;
  scoreBg: (s: number) => string;
  onNavigate: (page: string) => void;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-6 animate-rise-in">
      {/* ── Hero Score ── */}
      <div className="premium-card p-8 sm:p-10 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="text-emerald-300" size={22} fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Couple Pulse Report</h1>
                  <p className="text-emerald-200/80 text-sm">{partnerAName} & {partnerBName}</p>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div
                className="text-6xl font-extrabold drop-shadow-lg"
                style={{ color: scoreColor(report.overall_pulse) }}
              >
                {report.overall_pulse}
              </div>
              <div className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-widest mt-1">
                Overall Pulse Score
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-start gap-3">
            <Sparkles className="text-emerald-300 shrink-0 mt-1" size={22} />
            <div>
              <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1.5">Core Insight</h4>
              <p className="text-emerald-50 font-medium text-base leading-relaxed">{report.insight}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-scores ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Connection', value: report.connection_score, icon: <Heart size={20} /> },
          { label: 'Trust', value: report.trust_score, icon: <Shield size={20} /> },
          {
            label: 'Responsibility',
            value: Math.round((report.responsibility_balance.partner_a_percent + report.responsibility_balance.partner_b_percent) / 2),
            icon: <Scale size={20} />,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="premium-card p-5 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-30 translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ backgroundColor: scoreColor(metric.value) }}
            />
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: scoreBg(metric.value), color: scoreColor(metric.value) }}
              >
                {metric.icon}
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{metric.label}</span>
            </div>
            <div className="text-3xl font-extrabold mb-2" style={{ color: scoreColor(metric.value) }}>
              {metric.value}%
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: `${scoreColor(metric.value)}15` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${metric.value}%`, backgroundColor: scoreColor(metric.value) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Responsibility Balance Bar ── */}
      <div
        className="premium-card p-6 sm:p-8"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 className="text-base font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Scale size={18} className="text-amber-500" />
          Workload Balance
          {report.responsibility_balance.imbalance_detected && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ml-2"
              style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}
            >
              Imbalance Detected
            </span>
          )}
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold w-24 text-right" style={{ color: 'var(--text-primary)' }}>
            {partnerAName}
          </span>
          <div className="flex-1 flex h-8 rounded-full overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
            <div
              className="h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
              style={{
                width: `${report.responsibility_balance.partner_a_percent}%`,
                backgroundColor: '#10b981',
              }}
            >
              {report.responsibility_balance.partner_a_percent}%
            </div>
            <div
              className="h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
              style={{
                width: `${report.responsibility_balance.partner_b_percent}%`,
                backgroundColor: '#6366f1',
              }}
            >
              {report.responsibility_balance.partner_b_percent}%
            </div>
          </div>
          <span className="text-sm font-bold w-24" style={{ color: 'var(--text-primary)' }}>
            {partnerBName}
          </span>
        </div>
      </div>

      {/* ── Issues & Positives ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Top Issues */}
        {report.top_issues.length > 0 && (
          <div
            className="premium-card p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle size={16} className="text-rose-500" />
              Top Issues
            </h3>
            <ul className="space-y-3">
              {report.top_issues.map((issue, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm font-medium p-3 rounded-xl border"
                  style={{
                    backgroundColor: 'rgba(244,63,94,0.05)',
                    borderColor: 'rgba(244,63,94,0.15)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive Behaviors */}
        {report.positive_behaviors.length > 0 && (
          <div
            className="premium-card p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} className="text-emerald-500" />
              Positive Behaviors
            </h3>
            <ul className="space-y-3">
              {report.positive_behaviors.map((behavior, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm font-medium p-3 rounded-xl border"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.05)',
                    borderColor: 'rgba(16,185,129,0.15)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </span>
                  {behavior}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Weekly Action Plan ── */}
      {report.weekly_actions.length > 0 && (
        <div className="premium-card p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden noise-overlay">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-base font-extrabold mb-5 flex items-center gap-2">
              <Zap size={18} className="text-emerald-300" />
              Weekly Action Plan
            </h3>
            <ul className="space-y-4">
              {report.weekly_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-4 text-sm leading-relaxed">
                  <span className="bg-emerald-600 font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs text-white shadow-md">
                    {i + 1}
                  </span>
                  <span className="text-emerald-50 font-medium">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        >
          <RotateCcw size={16} /> New Pulse Check
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
        >
          Back to Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
