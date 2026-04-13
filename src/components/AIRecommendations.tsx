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
      <div
        className="rounded-2xl p-6 border animate-fade-in"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Brain size={20} className="text-[#d97757] animate-pulse" />
          <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Clinical Solution
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-5 rounded-lg" style={{ width: `${[100, 75, 65][i - 1]}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(217,119,87,0.1)', color: '#d97757' }}
        >
          <Sparkles size={18} />
        </div>
        <h3 className="text-lg font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
          AI Solution Report
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Insight */}
        <div
          className="rounded-xl p-5 border flex gap-4"
          style={{ backgroundColor: 'rgba(217,119,87,0.05)', borderColor: 'rgba(217,119,87,0.15)' }}
        >
          <Brain size={20} className="shrink-0 mt-0.5 text-[#d97757]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#d97757' }}>
              Core Insight
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {report.insight}
            </p>
          </div>
        </div>

        {/* Problems + Precautions */}
        <div className="grid md:grid-cols-2 gap-5">
          <ReportSection
            icon={<Activity size={16} className="text-[#a65d50]" />}
            title="Identified Issues"
            items={report.mainProblems}
            dotColor="#a65d50"
          />
          <ReportSection
            icon={<ShieldAlert size={16} className="text-[#d97757]" />}
            title="Future Precautions"
            items={report.futurePrecautions}
            dotColor="#d97757"
          />
        </div>

        {/* Step-by-Step Actions */}
        <div
          className="rounded-xl p-5 border"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-[#5c7c64]" />
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Step-by-Step Actions
            </h4>
          </div>
          <ol className="space-y-3">
            {report.stepByStepActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'rgba(92,124,100,0.1)', color: '#5c7c64' }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {action}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Recommended Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={15} className="text-[#5c7c64]" />
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Professional Recommendations
            </h4>
          </div>
          <ul className="space-y-2">
            {report.recommendedActions.map((rec, idx) => (
              <li
                key={idx}
                className="text-sm font-medium rounded-xl px-4 py-3 border"
                style={{
                  backgroundColor: 'rgba(92,124,100,0.06)',
                  borderColor: 'rgba(92,124,100,0.15)',
                  color: 'var(--text-primary)',
                }}
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  icon,
  title,
  items,
  dotColor,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  dotColor: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h4>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
              style={{ backgroundColor: dotColor }}
            />
            <span className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}