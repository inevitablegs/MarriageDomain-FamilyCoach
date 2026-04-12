import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type RelationshipStressTest as RelationshipStressTestType } from '../lib/supabase';
import { generateStressTestReport } from '../lib/stressTestEngine';
import { ArrowRight, BrainCircuit, ShieldAlert, SkipBack, Target, Activity, AlertTriangle, EyeOff, ClipboardCheck } from 'lucide-react';

const assessmentQuestions = [
  {
    id: 'psy_1',
    domain: 'Psychological Readiness',
    question: "You both return home after a deeply exhausting, terrible workday. One of you snaps over a trivial issue (e.g., a misplaced key). What is the immediate behavioral response?",
    options: [
      { text: "The other person completely ignores it and scrolls on their phone, staying silent to 'keep the peace'.", value: "avoids_conflict" },
      { text: "It immediately escalates into a screaming match bringing up grievances from three months ago.", value: "escalates_conflict" },
      { text: "One person physically leaves the room, locking the door without saying when they will return.", value: "avoids_conflict" },
      { text: "A brief sharp response, followed by a 10-minute cool down, then explicit verbal decompression.", value: "healthy_regulation" },
    ]
  },
  {
    id: 'fam_1',
    domain: 'Family & Social Pressure',
    question: "It is your first major festival as a married couple. Your parents demand you spend it exactly as they always have. Your partner wants to establish a new tradition just for the two of you. The outcome:",
    options: [
      { text: "You agree with the parents instantly; negotiating with elders on festivals is considered deeply disrespectful.", value: "family_overrides" },
      { text: "You promise your partner 'next year we will do it our way', but force compliance this year to avoid drama.", value: "family_overrides" },
      { text: "You tell your parents you will attend morning pooja, but the evening is exclusively reserved for your spouse.", value: "healthy_boundary" },
      { text: "You fight with your parents, then blame your partner for making you the 'bad child'.", value: "blameshifting" },
    ]
  },
  {
    id: 'fin_1',
    domain: 'Financial Reality',
    question: "Your spouse discovers you have been sending a portion of your salary to your family every month without mentioning it. Your justification is:",
    options: [
      { text: "'It is my duty as a child, it isn't something I need 'permission' for.'", value: "hide_finances" },
      { text: "'I didn't want you to stress about our joint budget, so I managed it silently.'", value: "hide_finances" },
      { text: "'I was wrong to hide it; let's establish an exact monthly allowance line-item for both sets of parents.'", value: "healthy_financial" },
      { text: "You get defensive and accuse them of being overly controlling with money.", value: "defensive" },
    ]
  },
  {
    id: 'rol_1',
    domain: 'Role Expectations',
    question: "You both claim to want a strictly 'modern, equal' marriage. A pipe bursts in the kitchen at 8 PM on a Tuesday. How is the crisis managed?",
    options: [
      { text: "One person immediately calls the plumber and cleans the water; the other says 'just tell me how I can help'.", value: "traditional_default" },
      { text: "You both panic and call your respective fathers for instructions.", value: "pseudo_modern" },
      { text: "One secures the water valve while the other simultaneously coordinates the emergency plumber.", value: "egalitarian" },
      { text: "The wife automatically starts wiping the floor while the husband sits on the couch making phone calls.", value: "traditional_default" },
    ]
  },
  {
    id: 'int_1',
    domain: 'Intimacy & Communication',
    question: "One partner initiates physical intimacy, and the other rejects it due to extreme stress. The rejecting partner's delivery and the initiator's reaction looks like:",
    options: [
      { text: "A blunt 'no, I'm tired', followed by the initiator turning their back and giving the silent treatment until morning.", value: "dismisses_rejection" },
      { text: "The rejection is soft, but the initiator takes it as a severe personal failure and requires hours of emotional validation.", value: "external_validation" },
      { text: "The rejection is accompanied by 'Not tonight, I am drained, but let's cuddle/connect this weekend.' The initiator says 'Understood.'", value: "healthy_intimacy" },
      { text: "The initiator insists or guilts the partner until they reluctantly give in to avoid a fight.", value: "coercive" },
    ]
  }
];

type RelationshipStressTestProps = {
  onNavigate: (page: string) => void;
};

export function RelationshipStressTest({ onNavigate }: RelationshipStressTestProps) {
  const { profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RelationshipStressTestType | null>(null);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = async () => {
    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      await submitAssessment();
    }
  };

  const submitAssessment = async () => {
    if (!profile) return;
    setIsProcessing(true);
    
    try {
      const generated = await generateStressTestReport(profile.id, answers);
      
      const newAssessment: RelationshipStressTestType = {
        ...generated,
        id: `rst_${Date.now()}`,
        created_at: new Date().toISOString()
      };

      await supabase.from('relationship_stress_tests').insert(newAssessment as any);
      setResult(newAssessment);
    } catch (err) {
      console.error('Failed to run stress test:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <LoadingState />;
  }

  if (result) {
    return <ResultState result={result} onNavigate={onNavigate} />;
  }

  const currentQ = assessmentQuestions[currentStep];
  const hasAnswered = !!answers[currentQ.id];

  return (
    <div className="min-h-[calc(100vh-68px)] flex flex-col pt-12 pb-24 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-primary)' }}
          >
            <SkipBack size={16} /> Dashboard
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
            <Activity size={16} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Premium Service</span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Relationship Stress Test
          </h1>
          <p className="text-sm font-medium max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            We do not test intentions; we test behavioral reality. Answer honestly based on how you and your partner actually react under pressure.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10 premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: '#6366f1' }}>Domain: {currentQ.domain}</span>
            <span>Scenario {currentStep + 1} of {assessmentQuestions.length}</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep) / assessmentQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className="animate-fade-in premium-card p-8 sm:p-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-relaxed mb-8" style={{ color: 'var(--text-primary)' }}>
            {currentQ.question}
          </h2>

          <div className="space-y-4">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === opt.value;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, opt.value)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-950/20' 
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? undefined : 'var(--bg-tertiary)',
                  }}
                >
                  <p className={`font-semibold text-sm sm:text-[15px] leading-relaxed ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : ''}`} style={{ color: !isSelected ? 'var(--text-primary)' : undefined }}>
                    {opt.text}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end border-t pt-8" style={{ borderColor: 'var(--border-primary)' }}>
             <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all focus-ring ${
                hasAnswered 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:-translate-y-0.5' 
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed'
              }`}
             >
               {currentStep === assessmentQuestions.length - 1 ? 'Execute Audit' : 'Next Scenario'} 
               <ArrowRight size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center animate-pulse max-w-md px-6">
        <BrainCircuit size={48} className="mx-auto mb-6 text-indigo-500 opacity-80" />
        <h2 className="text-xl font-extrabold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Processing Audit Pipeline</h2>
        <p className="font-semibold text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
           Detecting contradictions. Mapping internal blind spots. Generating behavioral mismatch probabilities...
        </p>
      </div>
    </div>
  );
}

function ResultState({ result, onNavigate }: { result: RelationshipStressTestType, onNavigate: (page: string) => void }) {
  
  const isHighRisk = result.risk_score >= 70;
  const isModerate = result.risk_score >= 30 && result.risk_score < 70;
  
  const riskColor = isHighRisk ? '#ef4444' : (isModerate ? '#f59e0b' : '#10b981');
  const riskBg = isHighRisk ? 'rgba(239,68,68,0.1)' : (isModerate ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)');

  return (
    <div className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest rounded-full mb-6">
            <Target size={14} /> Official Audit Architecture
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            Stress Diagnostics Complete
          </h1>
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
             This report strips away intention and focuses purely on predicted operational reality. Review the structural friction points below.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Risk Score */}
          <div className="lg:col-span-1 space-y-8">
            <div className="premium-card p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: `4px solid ${riskColor}` }}>
              <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -z-0 pointer-events-none" style={{ backgroundColor: riskColor }}></div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 relative z-10" style={{ color: 'var(--text-muted)' }}>
                Systemic Risk Score
              </h2>
              <div className="flex items-baseline gap-2 mb-4 relative z-10">
                <span className="text-6xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{result.risk_score}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest mb-6 relative z-10" style={{ backgroundColor: riskBg, color: riskColor }}>
                {isHighRisk ? 'High Risk' : (isModerate ? 'Moderate Risk' : 'Low Risk')}
              </div>
              <p className="text-sm font-semibold leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>
                {isHighRisk 
                  ? "Immediate structural intervention required. High probability of relationship breakdown due to core misalignment."
                  : "Friction exists in expected operational areas. Requires explicit communication structure to prevent compounding resentment."}
              </p>
            </div>

            {/* Blind Spots */}
            <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <EyeOff size={16} /> Identified Blind Spots
              </h3>
              <ul className="space-y-4">
                {result.blind_spots.map((spot, i) => (
                  <li key={i} className="text-sm font-bold leading-relaxed flex items-start gap-3" style={{ color: 'var(--text-primary)' }}>
                    <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#8b5cf6' }}></div>
                    {spot}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Complex Outputs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Top Breaking Points */}
            <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <ShieldAlert size={16} className="text-amber-500" /> Primary Breaking Points
              </h3>
              <div className="space-y-4">
                {result.breaking_points.map((bp, i) => (
                  <div key={i} className="p-4 rounded-xl border flex items-start gap-4 transition-colors" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center font-black text-xs shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{bp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expectation Gaps */}
            <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <AlertTriangle size={16} className="text-rose-500" /> Structural Expectation Gaps
              </h3>
              <div className="space-y-5">
                {result.expectation_gaps.map((gap, i) => (
                  <div key={i} className="pb-5 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--border-primary)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#d97706' }}>{gap.domain}</p>
                    <p className="text-[15px] font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{gap.gap}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #10b981' }}>
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <ClipboardCheck size={16} className="text-emerald-500" /> Remediation Action Plan
              </h3>
              <div className="grid sm:grid-cols-2 gap-5">
                {result.action_plan.map((action, i) => (
                  <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <h4 className="font-extrabold text-[15px] mb-3" style={{ color: '#10b981' }}>{action.title}</h4>
                    <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{action.task}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-8">
           <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all focus-ring shadow-md hover:-translate-y-0.5"
           >
             Return to Dashboard
           </button>
        </div>

      </div>
    </div>
  );
}
