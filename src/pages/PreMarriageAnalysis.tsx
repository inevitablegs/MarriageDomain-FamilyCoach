import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzePreMarriageBehaviorWithGemini, PreMarriageAnalysisResult } from '../lib/ai';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowLeft, Brain, Send, Target, ArrowRight, Activity } from 'lucide-react';

type PreMarriageAnalysisProps = {
  onNavigate: (page: string) => void;
};

export function PreMarriageAnalysis({ onNavigate }: PreMarriageAnalysisProps) {
  const { profile, loading: authLoading } = useAuth();
  const [behaviorText, setBehaviorText] = useState('');
  const [incidentText, setIncidentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreMarriageAnalysisResult | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="rounded-full h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900/30 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center py-10 transition-colors duration-300">
        <div className="text-center premium-card p-10 max-w-md w-full mx-4 bg-secondary">
          <ShieldAlert className="text-indigo-500 mx-auto mb-5" size={48} />
          <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-6 leading-relaxed">Please sign in to run a Deep Analysis.</p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md hover:-translate-y-0.5"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    if (!behaviorText.trim() || !incidentText.trim()) return;
    setLoading(true);
    const analysis = await analyzePreMarriageBehaviorWithGemini(behaviorText, incidentText);
    setResult(analysis);
    setLoading(false);
  };

  const getRiskColor = (percentage: number) => {
    if (percentage >= 75) return 'text-red-500';
    if (percentage >= 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRiskBg = (percentage: number) => {
    if (percentage >= 75) return 'bg-red-50 dark:bg-red-900/20';
    if (percentage >= 40) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-emerald-50 dark:bg-emerald-900/20';
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 sm:py-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">
        
        {!result && !loading && (
          <div className="premium-card p-8 sm:p-12 relative overflow-hidden bg-secondary">
            <div className="mb-10 relative z-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center shadow-inner border border-indigo-100 dark:border-indigo-900/30">
                  <Brain className="text-indigo-500" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Deep Personality Analysis</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Before marriage behavioral assessment</p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                Describe your partner's general traits and a specific recent incident to uncover hidden red flags and their real personality.
              </p>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  General Behavior (Positive & Negative)
                </label>
                <textarea
                  className="w-full bg-primary border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium resize-none min-h-[120px]"
                  placeholder="E.g., They are very loving and caring, but tend to get extremely defensive when asked simple questions about their whereabouts..."
                  value={behaviorText}
                  onChange={(e) => setBehaviorText(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Recent Incident
                </label>
                <textarea
                  className="w-full bg-primary border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium resize-none min-h-[120px]"
                  placeholder="E.g., He was shouting for a minor reason yesterday when..."
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 bg-secondary border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 py-4 px-6 rounded-xl font-bold hover:bg-primary/50 hover:border-slate-300 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!behaviorText.trim() || !incidentText.trim() || loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  <Send size={18} /> Analyze Behavior
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="premium-card p-12 relative overflow-hidden bg-secondary text-center min-h-[400px] flex flex-col items-center justify-center">
            <div className="rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-900/30 border-t-indigo-600 animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Analyzing Behavioral Patterns...</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">Please wait while our AI psychologist evaluates the scenario and builds your risk profile.</p>
          </div>
        )}

        {result && (
          <div className="premium-card p-8 sm:p-12 relative overflow-hidden bg-secondary animate-rise-in">
            <div className="text-center mb-10 relative z-10">
               <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 ${getRiskColor(result.redFlagPercentage).replace('text-', 'border-').replace('500', '200')} ${getRiskBg(result.redFlagPercentage)}`}>
                  <span className={`text-5xl font-black ${getRiskColor(result.redFlagPercentage)}`}>{result.redFlagPercentage}%</span>
               </div>
               <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                 Risk Probability Assessment
               </h2>
               <p className="text-slate-600 dark:text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                 Based on the general behaviors and the incident described, we have calculated the probability of significant relationship red flags.
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10 relative z-10">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain size={20} className="text-indigo-500" /> Detected Traits
                </h3>
                <ul className="space-y-3">
                  {result.personalityTraits.map((trait, idx) => (
                    <li key={idx} className="bg-primary/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-sm">
                      {trait.type === 'positive' ? (
                        <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-700 dark:text-slate-300 font-medium leading-snug">{trait.trait}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-rose-500" /> Psychologist's Explanation
                  </h3>
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium relative z-10 text-[15px]">
                      <span className="block font-bold text-indigo-700 dark:text-indigo-400 mb-2">{result.insight}</span>
                      {result.analysisExplanation}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-rose-500" /> Main Problems & Precautions
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Identified Issues</h4>
                      <ul className="space-y-2">
                        {result.mainProblems.map((prob, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-700 dark:text-slate-300 text-sm">
                            <span className="text-rose-500 shrink-0 mt-0.5">•</span> {prob}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Future Precautions</h4>
                      <ul className="space-y-2">
                        {result.futurePrecautions.map((prec, idx) => (
                          <li key={idx} className="flex gap-2 text-slate-700 dark:text-slate-300 text-sm">
                            <span className="text-amber-500 shrink-0 mt-0.5">•</span> {prec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10 relative z-10">
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Target size={20} className="text-emerald-500" /> Step-by-Step Actions
                </h3>
                <ul className="space-y-3">
                  {result.stepByStepActions.map((action, idx) => (
                    <li key={idx} className="flex gap-3 text-emerald-900 dark:text-emerald-200 text-sm">
                      <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5">{idx + 1}</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <ArrowRight size={20} className="text-blue-500" /> Recommended Actions
                </h3>
                <ul className="space-y-3">
                  {result.recommendedActions.map((rec, idx) => (
                    <li key={idx} className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-sm font-medium">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-6 border-t border-slate-100 dark:border-slate-800">
               <button
                 onClick={() => {
                   setResult(null);
                   setBehaviorText('');
                   setIncidentText('');
                 }}
                 className="flex-1 bg-secondary border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 py-4 px-6 rounded-xl font-bold hover:bg-primary/50 hover:border-slate-300 transition shadow-sm inline-flex items-center justify-center gap-2"
               >
                 <ArrowLeft size={18} /> Analyze Another Incident
               </button>
               <button
                 onClick={() => onNavigate('dashboard')}
                 className="flex-1 inline-flex items-center justify-center bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md hover:-translate-y-0.5"
               >
                 Return to Dashboard
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
