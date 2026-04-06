import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzePreMarriageBehaviorWithGemini, PreMarriageAnalysisResult } from '../lib/ai';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Brain,
  Send,
  Target,
  ArrowRight,
  Activity,
  Loader2,
} from 'lucide-react';

type PreMarriageAnalysisProps = {
  onNavigate: (page: string) => void;
};

// ── Shared page spinner ──────────────────────────────────────────────────────
function PageSpinner({ color = '#6366f1', label }: { color?: string; label: string }) {
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
function SignInPrompt({ icon: Icon, message, onNavigate }: {
  icon: React.ElementType; message: string; onNavigate: (p: string) => void;
}) {
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

// ── Risk helpers ─────────────────────────────────────────────────────────────
const getRiskColor = (pct: number) => {
  if (pct >= 75) return '#ef4444';
  if (pct >= 40) return '#f59e0b';
  return '#10b981';
};
const getRiskBgToken = (pct: number) => {
  if (pct >= 75) return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  if (pct >= 40) return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' };
  return { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' };
};

// ── Main component ───────────────────────────────────────────────────────────
export function PreMarriageAnalysis({ onNavigate }: PreMarriageAnalysisProps) {
  const { profile, loading: authLoading } = useAuth();
  const [behaviorText, setBehaviorText] = useState('');
  const [incidentText, setIncidentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreMarriageAnalysisResult | null>(null);

  if (authLoading) return <PageSpinner label="Loading workspace…" />;

  if (!profile) {
    return (
      <SignInPrompt
        icon={ShieldAlert}
        message="Please sign in to run a Deep Behavior Analysis."
        onNavigate={onNavigate}
      />
    );
  }

  const handleAnalyze = async () => {
    if (!behaviorText.trim() || !incidentText.trim()) return;
    setLoading(true);
    const analysis = await analyzePreMarriageBehaviorWithGemini(behaviorText, incidentText);
    setResult(analysis);
    setLoading(false);
  };

  // ── Input form ──────────────────────────────────────────────────────────────
  if (!result && !loading) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-rise-in">
          <div
            className="premium-card p-8 sm:p-12"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}
              >
                <Brain size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Deep Personality Analysis
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Before-marriage behavioral assessment
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              Describe your partner's general traits and a specific recent incident to uncover hidden red flags and their real personality.
            </p>

            <div className="space-y-5">
              {/* Textarea 1 */}
              <div>
                <label
                  htmlFor="behaviorText"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  General Behavior (Positive &amp; Negative)
                </label>
                <textarea
                  id="behaviorText"
                  className="input-base min-h-[120px] resize-y"
                  placeholder="E.g., They are very loving and caring, but tend to get extremely defensive when asked simple questions about their whereabouts…"
                  value={behaviorText}
                  onChange={(e) => setBehaviorText(e.target.value)}
                />
              </div>

              {/* Textarea 2 */}
              <div>
                <label
                  htmlFor="incidentText"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Describe a Recent Incident
                </label>
                <textarea
                  id="incidentText"
                  className="input-base min-h-[120px] resize-y"
                  placeholder="E.g., He was shouting for a minor reason yesterday when…"
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div
                className="flex flex-col sm:flex-row gap-3 pt-5 border-t"
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
                  onClick={handleAnalyze}
                  disabled={!behaviorText.trim() || !incidentText.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-ring"
                >
                  <Send size={16} /> Analyze Behavior
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AI loading state ────────────────────────────────────────────────────────
  if (loading) {
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
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}
          >
            <Loader2 size={28} className="animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            Analyzing Behavioral Patterns…
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Please wait while our AI psychologist evaluates the scenario and builds your risk profile.
          </p>
          {/* Progress shimmer */}
          <div className="mt-8 space-y-2">
            <div className="skeleton h-3 rounded-full w-full" />
            <div className="skeleton h-3 rounded-full w-4/5 mx-auto" />
            <div className="skeleton h-3 rounded-full w-3/5 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (result) {
    const riskColor = getRiskColor(result.redFlagPercentage);
    const riskTokens = getRiskBgToken(result.redFlagPercentage);

    return (
      <div
        className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-rise-in">

          {/* Risk Score Card */}
          <div
            className="premium-card p-8 sm:p-12 text-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4"
              style={{
                backgroundColor: riskTokens.bg,
                borderColor: riskTokens.border,
              }}
            >
              <span className="text-5xl font-black" style={{ color: riskColor }}>
                {result.redFlagPercentage}%
              </span>
            </div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
              Risk Probability Assessment
            </h2>
            <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Based on the behaviors and incident described, we calculated the probability of significant relationship red flags.
            </p>
          </div>

          {/* Traits + Explanation */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Detected Traits */}
            <div
              className="premium-card p-6"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Brain size={18} style={{ color: 'var(--brand-indigo)' }} /> Detected Traits
              </h3>
              <ul className="space-y-2.5">
                {result.personalityTraits.map((trait, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {trait.type === 'positive' ? (
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    {trait.trait}
                  </li>
                ))}
              </ul>
            </div>

            {/* Psychologist's Explanation */}
            <div
              className="premium-card p-6 space-y-5"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <ShieldAlert size={18} className="text-rose-500" /> Psychologist's Explanation
                </h3>
                <div
                  className="rounded-2xl p-5 border"
                  style={{ backgroundColor: 'var(--brand-indigo-light)', borderColor: 'rgba(99,102,241,0.15)' }}
                >
                  <p className="font-bold text-sm mb-1.5" style={{ color: 'var(--brand-indigo)' }}>
                    {result.insight}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {result.analysisExplanation}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Activity size={18} className="text-rose-500" /> Issues &amp; Precautions
                </h3>
                <div
                  className="rounded-xl p-4 border space-y-4"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                      Identified Issues
                    </p>
                    <ul className="space-y-1.5">
                      {result.mainProblems.map((prob, idx) => (
                        <li key={idx} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="text-rose-500 shrink-0 mt-0.5">&bull;</span> {prob}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                      Future Precautions
                    </p>
                    <ul className="space-y-1.5">
                      {result.futurePrecautions.map((prec, idx) => (
                        <li key={idx} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="text-amber-500 shrink-0 mt-0.5">&bull;</span> {prec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step + Recommendations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="premium-card p-6"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Target size={18} className="text-emerald-500" /> Step-by-Step Actions
              </h3>
              <ol className="space-y-3">
                {result.stepByStepActions.map((action, idx) => (
                  <li key={idx} className="flex gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
                    >
                      {idx + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="premium-card p-6"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ArrowRight size={18} className="text-blue-500" /> Recommended Actions
              </h3>
              <ul className="space-y-2.5">
                {result.recommendedActions.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm font-medium rounded-xl px-4 py-3 border"
                    style={{
                      backgroundColor: 'rgba(59,130,246,0.06)',
                      borderColor: 'rgba(59,130,246,0.15)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="flex flex-col sm:flex-row gap-3 pt-2 border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <button
              onClick={() => {
                setResult(null);
                setBehaviorText('');
                setIncidentText('');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft size={16} /> Analyze Another Incident
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 focus-ring"
            >
              Return to Dashboard <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}