import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyzeConflictWithGemini, ConflictResolutionReport } from '../lib/ai';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  HeartCrack,
  Loader2,
  MessageCircleWarning,
  ShieldAlert,
  Sparkles,
  Swords,
  XCircle,
} from 'lucide-react';

type ConflictResolutionProps = {
  onNavigate: (page: string) => void;
};

// ── Shared spinner ───────────────────────────────────────────────────────────
function PageSpinner({ color = '#f59e0b', label }: { color?: string; label: string }) {
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
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Auth guard empty state ───────────────────────────────────────────────────
function SignInPrompt({ icon: Icon, message, onNavigate }: { icon: React.ElementType; message: string; onNavigate: (p: string) => void }) {
  return (
    <div
      className="min-h-[calc(100vh-68px)] flex items-center justify-center px-4 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="premium-card p-10 max-w-sm w-full text-center animate-rise-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}
        >
          <Icon size={26} />
        </div>
        <p className="font-bold text-base mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export function ConflictResolution({ onNavigate }: ConflictResolutionProps) {
  const { profile, loading: authLoading } = useAuth();
  
  // Phase management
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  // Form state
  const [trigger, setTrigger] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [userReaction, setUserReaction] = useState('');
  const [partnerReaction, setPartnerReaction] = useState('');
  const [frequency, setFrequency] = useState('First time');
  const [intensity, setIntensity] = useState('Calm disagreement');

  // Result state
  const [report, setReport] = useState<ConflictResolutionReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (authLoading) return <PageSpinner label="Loading workspace…" />;

  if (!profile) {
    return (
      <SignInPrompt
        icon={Swords}
        message="Please sign in to access the Conflict Resolution Program."
        onNavigate={onNavigate}
      />
    );
  }

  const isFormValid =
    trigger.trim() &&
    whatHappened.trim() &&
    userReaction.trim() &&
    partnerReaction.trim();

  // ── Actions ─────────────────────────────────────────────────────────────────
  const processPhase1To2 = () => {
    if (!isFormValid) return;
    setPhase(2);
    window.scrollTo(0, 0);
  };

  const executeAnalysis = async () => {
    setPhase(3);
    window.scrollTo(0, 0);
    setErrorMsg('');

    try {
      const result = await analyzeConflictWithGemini(
        whatHappened,
        userReaction,
        partnerReaction,
        trigger,
        frequency,
        intensity
      );

      if (result) {
        // Save to Supabase
        await supabase.from('conflict_resolution_sessions').insert({
          user_id: profile.id,
          conflict_type: result.conflictType,
          severity_level: result.severityLevel,
          report: result,
        });

        setReport(result);
        setPhase(4);
      } else {
        throw new Error('Analysis returned null');
      }
    } catch (error) {
      console.error('Error in executeAnalysis:', error);
      setErrorMsg('Failed to generate analysis. Please try again or provide more details.');
      setPhase(2);
    }
  };

  const resetForm = () => {
    setTrigger('');
    setWhatHappened('');
    setUserReaction('');
    setPartnerReaction('');
    setFrequency('First time');
    setIntensity('Calm disagreement');
    setReport(null);
    setErrorMsg('');
    setPhase(1);
    window.scrollTo(0, 0);
  };

  // ── Phase 1: Intake ─────────────────────────────────────────────────────────
  if (phase === 1) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-rise-in">
          <div
            className="premium-card p-8 sm:p-12 border-t-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: '#f59e0b' }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
              >
                <Swords size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Conflict Intake
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Describe the conflict honestly for an accurate diagnosis.
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-8 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              We need to understand both sides of the "dance" to provide you with actionable de-escalation scripts. Be objective.
            </p>

            <div className="space-y-6">
              {/* Row 1 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  What was the trigger?
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="e.g., They came home late without texting."
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  What happened during the conflict?
                </label>
                <textarea
                  className="input-base min-h-[100px] resize-y"
                  placeholder="e.g., We argued for an hour about responsibilities, voices were raised..."
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                />
              </div>

              {/* Row 2: Reactions */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    How did YOU react?
                  </label>
                  <textarea
                    className="input-base min-h-[100px] resize-y"
                    placeholder="e.g., I got defensive, brought up past things, and eventually walked away."
                    value={userReaction}
                    onChange={(e) => setUserReaction(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    How did YOUR PARTNER react?
                  </label>
                  <textarea
                    className="input-base min-h-[100px] resize-y"
                    placeholder="e.g., They pushed for an immediate answer and wouldn't let me leave."
                    value={partnerReaction}
                    onChange={(e) => setPartnerReaction(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Metrics */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Frequency of this argument
                  </label>
                  <select
                    className="input-base"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="First time">First time</option>
                    <option value="Occasional">Occasional</option>
                    <option value="Recurring pattern">Recurring pattern</option>
                    <option value="Chronic issue">Chronic issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Emotional Intensity
                  </label>
                  <select
                    className="input-base"
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value)}
                  >
                    <option value="Calm disagreement">Calm disagreement</option>
                    <option value="Heated argument">Heated argument</option>
                    <option value="Silent treatment / Ice">Silent treatment / Ice</option>
                    <option value="Explosive fight">Explosive fight</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex flex-col sm:flex-row gap-3 pt-6 border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={processPhase1To2}
                  disabled={!isFormValid}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-amber-950 py-3.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-ring"
                  style={{ backgroundColor: '#fbbf24' }}
                >
                  Confirm Intake <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 2: Pattern Summary ────────────────────────────────────────────────
  if (phase === 2) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-rise-in">
          <div
            className="premium-card p-8 sm:p-12"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)', color: '#d97706' }}
              >
                <Brain size={28} />
              </div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                Triage Summary
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Review the behavioral dynamic before our AI therapist diagnoses it.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold flex items-start gap-3">
                <XCircle size={20} className="shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">My Reaction</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{userReaction}</p>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Partner's Reaction</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{partnerReaction}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{frequency}</span>
              <span className="badge" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Intensity: {intensity}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={() => { setPhase(1); setErrorMsg(''); }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <ArrowLeft size={16} /> Edit Details
              </button>
              <button
                onClick={executeAnalysis}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 focus-ring"
              >
                <Sparkles size={16} /> Run AI Diagnosis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 3: Loading AI ─────────────────────────────────────────────────────
  if (phase === 3) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="premium-card p-12 max-w-md w-full text-center animate-scale-in"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-amber-500/20 shadow-xl"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
          >
            <Loader2 size={28} className="animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            Diagnosing Conflict…
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Our clinical AI is analyzing the behavioral loop ("the dance") between you and your partner to build a resolution roadmap.
          </p>
          <div className="mt-8 space-y-2">
            <div className="skeleton h-3 rounded-full w-full" />
            <div className="skeleton h-3 rounded-full w-4/5 mx-auto" />
            <div className="skeleton h-3 rounded-full w-3/5 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 4: Resolution Report ──────────────────────────────────────────────
  if (phase === 4 && report) {
    const sevColor = report.severityLevel === 'critical' ? '#ef4444' : report.severityLevel === 'moderate' ? '#f59e0b' : '#10b981';
    const sevBg = report.severityLevel === 'critical' ? 'rgba(239,68,68,0.1)' : report.severityLevel === 'moderate' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';

    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-rise-in">
          
          {/* Header Card */}
          <div className="premium-card p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <span
              className="badge shadow-sm mb-6"
              style={{ backgroundColor: sevBg, color: sevColor, border: `1px solid ${sevColor}40` }}
            >
              • {report.severityLevel.toUpperCase()} SEVERITY
            </span>
            <h1 className="text-3xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
              {report.conflictType}
            </h1>
            <p className="text-base font-medium max-w-2xl mx-auto p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              "{report.insight}"
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Root Cause & Roles */}
            <div className="premium-card p-6 flex flex-col gap-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Brain size={18} style={{ color: 'var(--brand-indigo)' }} /> Root Cause Analysis
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {report.rootCauseAnalysis}
                </p>
              </div>
              <div className="border-t pt-5" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <HeartCrack size={18} className="text-rose-500" /> The Behavioral Loop
                </h3>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border-l-4 border-l-indigo-500" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                    <p className="text-[10px] font-bold uppercase text-indigo-500 mb-1">Your Role</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{report.partnerARole}</p>
                  </div>
                  <div className="p-3 rounded-lg border-l-4 border-l-emerald-500" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                    <p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Partner's Role</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{report.partnerBRole}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* De-Escalation Scripts */}
            <div className="premium-card p-6 border-t-4 border-t-amber-500" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MessageCircleWarning size={18} className="text-amber-500" /> De-Escalation Scripts
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Memorize these or keep them handy. Say them exactly as written when you feel flooded.
              </p>
              <ul className="space-y-3">
                {report.deEscalationScript.map((script, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}>
                    <span className="text-amber-600 font-serif text-2xl leading-none font-bold">"</span>
                    <span className="text-sm font-medium pt-1" style={{ color: 'var(--text-primary)' }}>{script}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Repair Triggers */}
            <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CheckCircle size={18} className="text-emerald-500" /> Post-Conflict Repair
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Actions to take once both of you have cooled down.
              </p>
              <ul className="space-y-2">
                {report.repairTriggers.map((repair, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-emerald-500 shrink-0 mt-1">•</span> {repair}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning Signals */}
            {report.warningSignals.length > 0 && (
              <div className="premium-card p-6 border border-rose-500/20" style={{ backgroundColor: 'rgba(244,63,94,0.03)' }}>
                <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-rose-600">
                  <ShieldAlert size={18} /> Red Flags To Monitor
                </h3>
                <ul className="space-y-2">
                  {report.warningSignals.map((warning, i) => (
                    <li key={i} className="text-sm font-medium flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-500" /> {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 4-Week Action Plan */}
          <div className="premium-card p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar size={22} className="text-blue-500" /> 4-Week Action Plan
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.weeklyActionPlan.map((weekData) => (
                <div key={weekData.week} className="p-4 rounded-xl border flex flex-col" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                  <div className="badge self-start mb-3" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                    Week {weekData.week}
                  </div>
                  <p className="text-xs font-bold leading-snug mb-3 flex-grow" style={{ color: 'var(--text-primary)' }}>
                    {weekData.goal}
                  </p>
                  <ul className="space-y-1.5 mt-auto border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                    {weekData.actions.map((act, i) => (
                      <li key={i} className="text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        – {act}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              onClick={resetForm}
              className="flex-1 py-4 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              Analyze Another Incident
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all hover:-translate-y-0.5 focus-ring"
            >
              Return to Dashboard
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}

// Helper icon
function CheckCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
