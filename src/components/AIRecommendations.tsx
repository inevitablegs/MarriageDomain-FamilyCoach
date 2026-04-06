import { useEffect, useState } from 'react';
import { Sparkles, Brain, Target, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { getAIRecommendations, AssessmentData, RedFlagData, HealthData, SolutionReport } from '../lib/ai';

type AIRecommendationsProps = {
  assessmentData?: AssessmentData;
  redFlagData?: RedFlagData;
  healthData?: HealthData;
};

export function AIRecommendations({ assessmentData, redFlagData, healthData }: AIRecommendationsProps) {
  const [report, setReport] = useState<SolutionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [assessmentData, redFlagData, healthData]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getAIRecommendations(assessmentData, redFlagData, healthData);
      setReport(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-indigo-200 dark:border-slate-800">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="text-indigo-600 dark:text-indigo-400 animate-pulse" size={24} />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">AI-Powered Clinical Solution</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-indigo-200/50 dark:bg-slate-700/50 rounded-xl w-full"></div>
          <div className="h-6 bg-indigo-200/50 dark:bg-slate-700/50 rounded md:w-3/4"></div>
          <div className="h-6 bg-indigo-200/50 dark:bg-slate-700/50 rounded md:w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border-2 border-indigo-100 dark:border-indigo-900/50 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Sparkles className="text-indigo-600 dark:text-indigo-400" size={28} />
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">AI Solution Report</h3>
      </div>

      <div className="space-y-8">
        {/* Insight */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-4">
          <Brain className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2">Core Insight</h4>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{report.insight}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Problems */}
          <div>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4 text-lg">
              <Activity className="text-rose-500" size={20} /> Identified Issues
            </h4>
            <ul className="space-y-3">
              {report.mainProblems.map((prob, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                  {prob}
                </li>
              ))}
            </ul>
          </div>

          {/* Precautions */}
          <div>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4 text-lg">
              <ShieldAlert className="text-amber-500" size={20} /> Future Precautions
            </h4>
            <ul className="space-y-3">
              {report.futurePrecautions.map((prec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                  {prec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step-by-Step Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
          <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-5 text-lg">
            <Target className="text-emerald-500" size={20} /> Step-by-Step Actions
          </h4>
          <ul className="space-y-4">
            {report.stepByStepActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Priority Actions */}
        <div>
          <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4 text-lg">
            <ArrowRight className="text-blue-500" size={20} /> Professional Recommendations
          </h4>
          <ul className="space-y-3">
            {report.recommendedActions.map((rec, idx) => (
              <li key={idx} className="bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 font-medium">
                {rec}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
