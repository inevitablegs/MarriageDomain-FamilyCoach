import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

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
  {
    id: 'rf1',
    category: 'Emotional Control',
    question: 'Does your partner frequently lose their temper or have angry outbursts?',
    severity: 'high',
  },
  {
    id: 'rf2',
    category: 'Respect',
    question: 'Does your partner belittle, criticize, or mock you in front of others?',
    severity: 'high',
  },
  {
    id: 'rf3',
    category: 'Control',
    question: 'Does your partner try to control who you see or how you spend your time?',
    severity: 'high',
  },
  {
    id: 'rf4',
    category: 'Honesty',
    question: 'Have you caught your partner in significant lies or deception?',
    severity: 'high',
  },
  {
    id: 'rf5',
    category: 'Addiction',
    question: 'Does your partner have substance abuse or addiction issues they refuse to address?',
    severity: 'high',
  },
  {
    id: 'rf6',
    category: 'Financial',
    question: 'Does your partner hide financial information or have secret debts?',
    severity: 'medium',
  },
  {
    id: 'rf7',
    category: 'Communication',
    question: 'Does your partner give you the silent treatment or refuse to communicate during conflicts?',
    severity: 'medium',
  },
  {
    id: 'rf8',
    category: 'Family Pressure',
    question: 'Are you being pressured into this relationship by family or society?',
    severity: 'medium',
  },
  {
    id: 'rf9',
    category: 'Values',
    question: 'Do you have fundamentally different views on important life decisions?',
    severity: 'medium',
  },
  {
    id: 'rf10',
    category: 'Past Behavior',
    question: 'Has your partner shown a pattern of dishonesty in past relationships?',
    severity: 'medium',
  },
  {
    id: 'rf11',
    category: 'Lifestyle',
    question: 'Do you feel like you have to change who you are to make the relationship work?',
    severity: 'low',
  },
  {
    id: 'rf12',
    category: 'Compatibility',
    question: 'Do you have significantly different expectations about daily life?',
    severity: 'low',
  },
];

export function RedFlagChecker({ onNavigate }: RedFlagCheckerProps) {
  const { profile, loading } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="rounded-full h-12 w-12 border-4 border-rose-200 dark:border-rose-900/30 border-t-rose-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center py-10 transition-colors duration-300">
        <div className="text-center premium-card p-10 max-w-md w-full mx-4 bg-secondary">
          <ShieldAlert className="text-rose-500 mx-auto mb-5" size={48} />
          <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-6 leading-relaxed">Please sign in to run a Risk Analysis.</p>
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

      // Save each detected flag separately
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

  if (saving) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-4 border-rose-200 dark:border-rose-900/30 border-t-rose-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold text-lg tracking-tight">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const detectedFlags = redFlagQuestions.filter((q) => answers[q.id] === true);
    const highSeverity = detectedFlags.filter((f) => f.severity === 'high').length;
    const mediumSeverity = detectedFlags.filter((f) => f.severity === 'medium').length;
    const lowSeverity = detectedFlags.filter((f) => f.severity === 'low').length;

    return (
      <div className="min-h-[calc(100vh-80px)] py-12 sm:py-16 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">
          <div className="premium-card p-8 sm:p-12 relative overflow-hidden bg-secondary">
            <div className="text-center mb-10 relative z-10">
              {highSeverity > 0 ? (
                <>
                  <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100 dark:border-red-900/30">
                    <XCircle className="text-red-500" size={48} />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                    Critical Warnings Detected
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">We found <span className="font-bold text-red-600">{detectedFlags.length}</span> potential red flags</p>
                </>
              ) : detectedFlags.length > 0 ? (
                <>
                  <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100 dark:border-amber-900/30">
                    <AlertTriangle className="text-amber-500" size={48} />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                    Areas of Concern
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">We found <span className="font-bold text-amber-600">{detectedFlags.length}</span> items to address</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="text-emerald-500" size={48} />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                    Looking Good!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">No major behavioral risks detected in your analysis.</p>
                </>
              )}
            </div>

            <div className="space-y-6 mb-10 relative z-10">
              {highSeverity > 0 && (
                <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center space-x-3 mb-5">
                    <AlertTriangle className="text-red-600 shrink-0" size={28} />
                    <h3 className="font-extrabold text-red-900 dark:text-red-200 text-xl tracking-tight">
                      High Severity Issues ({highSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-3 mb-5">
                    {detectedFlags
                      .filter((f) => f.severity === 'high')
                      .map((flag, index) => (
                        <li key={index} className="text-red-800 dark:text-red-200 bg-secondary/60 p-3 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm font-medium">
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded mr-2 align-middle">{flag.category}</span>
                          <span className="align-middle">{flag.question}</span>
                        </li>
                      ))}
                  </ul>
                  <div className="bg-red-100/50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/40">
                    <p className="text-red-900 dark:text-red-300 font-bold text-sm">
                      These are serious concerns that require immediate professional attention or serious reconsideration.
                    </p>
                  </div>
                </div>
              )}

              {mediumSeverity > 0 && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center space-x-3 mb-5">
                    <AlertTriangle className="text-amber-600 shrink-0" size={28} />
                    <h3 className="font-extrabold text-amber-900 dark:text-amber-200 text-xl tracking-tight">
                      Medium Severity Issues ({mediumSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-3 mb-5">
                    {detectedFlags
                      .filter((f) => f.severity === 'medium')
                      .map((flag, index) => (
                        <li key={index} className="text-amber-800 dark:text-amber-200 bg-secondary/60 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-sm font-medium">
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded mr-2 align-middle">{flag.category}</span>
                          <span className="align-middle">{flag.question}</span>
                        </li>
                      ))}
                  </ul>
                  <div className="bg-amber-100/50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40">
                    <p className="text-amber-900 dark:text-amber-300 font-bold text-sm">
                      These issues should be addressed through open communication and possibly coaching.
                    </p>
                  </div>
                </div>
              )}

              {lowSeverity > 0 && (
                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <AlertTriangle className="text-yellow-600 shrink-0" size={28} />
                    <h3 className="font-extrabold text-yellow-900 dark:text-yellow-200 text-xl tracking-tight">
                      Low Severity Issues ({lowSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {detectedFlags
                      .filter((f) => f.severity === 'low')
                      .map((flag, index) => (
                        <li key={index} className="text-yellow-800 dark:text-yellow-200 bg-secondary/60 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm font-medium">
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded mr-2 align-middle">{flag.category}</span>
                          <span className="align-middle">{flag.question}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {detectedFlags.length === 0 && (
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-sm">
                  <p className="text-emerald-800 dark:text-emerald-300 font-medium text-lg leading-relaxed text-center">
                    Based on your responses, we didn't detect any major behavioral red flags.
                    Continue nurturing healthy communication and transparency.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 bg-secondary border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 py-4 px-6 rounded-xl font-bold hover:bg-primary/50 hover:border-slate-300 transition shadow-sm"
              >
                Return to Dashboard
              </button>
              {detectedFlags.length > 0 && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md hover:-translate-y-0.5"
                >
                  View Resources <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / redFlagQuestions.length) * 100;

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 sm:py-16 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="premium-card p-8 sm:p-12 relative overflow-hidden bg-secondary">
          <div className="mb-10 text-center relative z-10">
            <div className="inline-flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-3 shadow-inner border border-rose-100 dark:border-rose-900/30">
                <ShieldAlert className="text-rose-500" size={32} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Risk Checker</h1>
            </div>

            <div className="flex justify-between items-end text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
              <span>Question {currentQuestion + 1} / {redFlagQuestions.length}</span>
              <span className="text-rose-600 dark:text-rose-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-primary/50 dark:bg-slate-900/40 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-rose-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="relative z-10 mb-10">
            <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase mb-6 shadow-sm border ${redFlagQuestions[currentQuestion].severity === 'high'
              ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300'
              : redFlagQuestions[currentQuestion].severity === 'medium'
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}>
              {redFlagQuestions[currentQuestion].category}
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {redFlagQuestions[currentQuestion].question}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-2 border-rose-200 dark:border-rose-900/30 py-5 sm:py-6 rounded-2xl font-bold text-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-900/30 py-5 sm:py-6 rounded-2xl font-bold text-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              No
            </button>
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500 relative z-10 uppercase tracking-widest">
            Answer honestly for accurate analysis
          </p>
        </div>
      </div>
    </div>
  );
}
