import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, RelationshipHealth } from '../lib/supabase';
import { TrendingUp, TrendingDown, Minus, Activity, Plus, Sparkles, Loader2, MessageSquareText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { SolutionReport } from '../lib/ai';

type HealthTrackerProps = {
  onNavigate: (page: string) => void;
};

// Initialize Gemini Client
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

export function HealthTracker({ onNavigate }: HealthTrackerProps) {
  const { profile, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [healthRecords, setHealthRecords] = useState<RelationshipHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [journalEntry, setJournalEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    loadHealthRecords();
  }, [profile]);

  const loadHealthRecords = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('relationship_health')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setHealthRecords(data);
    } catch (error) {
      console.error('Error loading health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractJsonFromText = (text: string) => {
    // LLMs often wrap JSON in markdown block ticks
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }
    // If no ticks, find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return text.slice(firstBrace, lastBrace + 1);
    }
    return text; // fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalEntry.trim()) {
      setAiError('Please write a brief entry before submitting.');
      return;
    }

    if (!aiClient) {
      setAiError('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setSaving(true);
    setAiError('');

    try {
      const prompt = `
You are an expert relationship counselor and AI analyst. The user has written a weekly journal entry about their relationship.
Read their entry and evaluate the state of their relationship on four metrics out of 100:
- emotional_score (0-100): How connected, understood, and emotionally supportive they feel.
- communication_score (0-100): How effectively they are sharing, listening, and expressing themselves.
- intimacy_score (0-100): Satisfaction with physical and romantic connection.
- conflict_score (0-100): Constructive conflict resolution (higher means fewer destructive arguments and better resolution).

If a metric isn't explicitly mentioned, infer a baseline (e.g., 60-70) based on the overall tone.
Also generate a comprehensive clinical solution report containing:
- insight (string): A short, compassionate core takeaway.
- mainProblems (array of strings): Specific issues identified from the data.
- stepByStepActions (array of strings): Concrete behavioral steps for the coming week.
- futurePrecautions (array of strings): What to watch for or avoid.
- recommendedActions (array of strings): High-priority actions, including professional referrals if needed.

User's Journal Entry: "${journalEntry}"

You MUST respond with ONLY valid JSON strictly matching the format below, nothing else:
{
  "emotional_score": number,
  "communication_score": number,
  "intimacy_score": number,
  "conflict_score": number,
  "insight": "string",
  "mainProblems": ["string", "string"],
  "stepByStepActions": ["string", "string"],
  "futurePrecautions": ["string", "string"],
  "recommendedActions": ["string", "string"]
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Failed to get response from Gemini");

      const cleanJsonStr = extractJsonFromText(responseText);
      const output = JSON.parse(cleanJsonStr);

      // Validate scores
      const emotional = Math.max(0, Math.min(100, output.emotional_score || 50));
      const communication = Math.max(0, Math.min(100, output.communication_score || 50));
      const intimacy = Math.max(0, Math.min(100, output.intimacy_score || 50));
      const conflict = Math.max(0, Math.min(100, output.conflict_score || 50));

      const overallScore = Math.round((emotional + communication + intimacy + conflict) / 4);
      
      const newReport: SolutionReport = {
        insight: output.insight || "Focus on building a stronger connection.",
        mainProblems: output.mainProblems || [],
        stepByStepActions: output.stepByStepActions || [],
        futurePrecautions: output.futurePrecautions || [],
        recommendedActions: output.recommendedActions || []
      };

      const { error } = await supabase.from('relationship_health').insert({
        user_id: profile!.id,
        emotional_score: emotional,
        communication_score: communication,
        intimacy_score: intimacy,
        conflict_score: conflict,
        overall_score: overallScore,
        notes: JSON.stringify(newReport),
        improvements: null, // Legacy field unused for new format
        journal_entry: journalEntry,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowForm(false);
      setJournalEntry('');
      loadHealthRecords();
    } catch (error: any) {
      console.error('Error analyzing and saving health record:', error);
      setAiError(error.message || 'There was an error parsing the AI response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(16,185,129,0.2)', borderTopColor: '#10b981' }}
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Loading records…
          </p>
        </div>
      </div>
    );
  }

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
            style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
          >
            <Activity size={26} />
          </div>
          <p className="font-bold text-base mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            Please sign in to track your relationship health
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const latestRecord = healthRecords[0];
  const previousRecord = healthRecords[1];

  const getTrend = (current?: number, previous?: number) => {
    if (!current || !previous) return null;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  const TrendIcon = ({ trend }: { trend: string | null }) => {
    if (trend === 'up') return <TrendingUp className="shrink-0" size={20} style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: 3, borderRadius: '50%' }} />;
    if (trend === 'down') return <TrendingDown className="shrink-0" size={20} style={{ color: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)', padding: 3, borderRadius: '50%' }} />;
    return <Minus className="shrink-0" size={20} style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: 3, borderRadius: '50%' }} />;
  };

  const formatSafeDate = (record: RelationshipHealth, options?: Intl.DateTimeFormatOptions) => {
    const dString = record.recorded_at || record.created_at;
    if (!dString) return 'Just now';
    const d = new Date(dString);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleDateString(undefined, options || { month: 'short', day: 'numeric' });
  };

  // Prepare chart data
  const chartData = [...healthRecords].reverse().map(record => ({
    date: formatSafeDate(record),
    score: record.overall_score
  }));

  const radarData = latestRecord ? [
    { subject: 'Emotional', A: latestRecord.emotional_score, fullMark: 100 },
    { subject: 'Communication', A: latestRecord.communication_score, fullMark: 100 },
    { subject: 'Intimacy', A: latestRecord.intimacy_score, fullMark: 100 },
    { subject: 'Conflict', A: latestRecord.conflict_score, fullMark: 100 },
  ] : [];

  const parseReport = (notes?: string, legacyImprovements?: string): SolutionReport | null => {
    if (!notes) return null;
    try {
      const parsed = JSON.parse(notes);
      if (parsed && typeof parsed === 'object' && 'insight' in parsed) {
        return parsed as SolutionReport;
      }
    } catch {
      // Legacy data fallback, reconstruct missing fields visually
      return {
        insight: notes,
        mainProblems: [],
        stepByStepActions: legacyImprovements ? legacyImprovements.split('\n\n') : [],
        futurePrecautions: [],
        recommendedActions: []
      };
    }
    return null;
  };

  const latestSolution = latestRecord ? parseReport(latestRecord.notes, latestRecord.improvements) : null;

  const metricConfig = [
    { label: 'Emotional', key: 'emotional_score' as const, prev: previousRecord?.emotional_score, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)' },
    { label: 'Communication', key: 'communication_score' as const, prev: previousRecord?.communication_score, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.15)' },
    { label: 'Intimacy', key: 'intimacy_score' as const, prev: previousRecord?.intimacy_score, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.15)' },
    { label: 'Conflict Mgmt', key: 'conflict_score' as const, prev: previousRecord?.conflict_score, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  ];

  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-12 sm:py-16 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 p-6 rounded-[2rem] border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AI Health Tracker
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Conversational insights for your relationship
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white w-full sm:w-auto px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring"
          >
            <Plus size={18} /> New AI Check-in
          </button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
            style={{ backgroundColor: 'rgba(8,12,20,0.7)', backdropFilter: 'blur(6px)' }}
          >
            <div
              className="rounded-3xl shadow-2xl max-w-2xl w-full p-8 sm:p-10 max-h-[90vh] overflow-y-auto animate-rise-in border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <h2 className="text-2xl font-extrabold mb-2 tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <MessageSquareText className="text-emerald-500" size={24} /> Weekly Reflection
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Write a few sentences about your relationship this week. Our AI will analyze your entry to extract scores and provide tailored advice securely.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    className="input-base min-h-[160px] resize-y"
                    placeholder="E.g., We had a minor argument about chores on Tuesday but resolved it quickly by talking it out. Date night on Friday was amazing and we felt really connected..."
                    disabled={saving}
                  />
                  {saving && (
                    <div
                      className="absolute inset-0 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center z-10"
                      style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                    >
                      <Loader2 className="animate-spin text-emerald-600 mb-3" size={32} />
                      <p
                        className="font-bold text-sm px-4 py-2 rounded-full border"
                        style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)', borderColor: 'rgba(16,185,129,0.2)' }}
                      >
                        Gemini is analyzing your entry…
                      </p>
                    </div>
                  )}
                </div>

                {aiError && (
                  <div
                    className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm animate-fade-in"
                    style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}
                  >
                    {aiError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setAiError('');
                      setJournalEntry('');
                    }}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md hover:-translate-y-0.5 focus-ring"
                  >
                    {saving ? 'Analyzing…' : <><Sparkles size={16} /> Ask AI</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {latestRecord && (
          <div className="grid lg:grid-cols-[1fr,400px] gap-8">
            <div className="space-y-6">
              {/* AI Insights Hero */}
              <div className="premium-card p-8 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden noise-overlay">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">AI Insights</h2>
                      <p className="text-emerald-200/80 text-sm mt-1">Based on your latest response</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-extrabold text-emerald-300 drop-shadow-md">{latestRecord.overall_score}%</div>
                      <div className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-widest mt-1">Overall Vitality</div>
                    </div>
                  </div>

                  {latestRecord.journal_entry && (
                    <details className="group mb-6">
                      <summary className="text-emerald-300/80 hover:text-emerald-300 cursor-pointer text-xs font-bold uppercase tracking-widest flex items-center gap-2 list-none outline-none">
                        <MessageSquareText size={14} />
                        View Your Reflection
                        <Plus size={12} className="group-open:hidden" />
                        <Minus size={12} className="hidden group-open:block" />
                      </summary>
                      <div className="mt-3 bg-white/5 border border-white/10 p-4 rounded-xl text-emerald-50 text-sm italic leading-relaxed animate-fade-in">
                        "{latestRecord.journal_entry}"
                      </div>
                    </details>
                  )}

                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl space-y-6">
                    <div className="flex items-start gap-3 border-b border-emerald-500/30 pb-5">
                      <Sparkles className="text-emerald-300 shrink-0 mt-1" size={24} />
                      <div>
                        <h4 className="text-emerald-200 text-sm font-bold uppercase tracking-widest mb-2">Core Insight</h4>
                        <p className="text-emerald-50 leading-relaxed font-medium text-lg">{latestSolution?.insight}</p>
                      </div>
                    </div>

                    {latestSolution && latestSolution.mainProblems.length > 0 && (
                      <div className="border-b border-emerald-500/30 pb-5">
                        <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-3">Identified Areas of Focus</h4>
                        <ul className="space-y-2">
                          {latestSolution.mainProblems.map((prob, i) => (
                            <li key={i} className="flex gap-2 text-emerald-100 text-sm">
                              <span className="text-rose-400 shrink-0 mt-1">•</span> {prob}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestSolution && latestSolution.stepByStepActions.length > 0 && (
                      <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30">
                        <h4 className="text-emerald-200 text-sm font-bold uppercase tracking-widest mb-4">Step-by-Step Action Plan</h4>
                        <ul className="space-y-4">
                          {latestSolution.stepByStepActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-4 text-emerald-50 text-sm leading-relaxed">
                              <span className="bg-emerald-600 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs text-white">{i + 1}</span> 
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {latestSolution && latestSolution.futurePrecautions.length > 0 && (
                      <div>
                        <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-3">Future Precautions</h4>
                        <ul className="space-y-2">
                          {latestSolution.futurePrecautions.map((prec, i) => (
                            <li key={i} className="flex gap-2 text-emerald-100 text-sm">
                               <span className="text-amber-400 shrink-0 font-bold">!</span> {prec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestSolution && latestSolution.recommendedActions.length > 0 && (
                      <div className="bg-emerald-800/40 p-3 rounded-lg border border-emerald-500/50">
                         <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2">Priority Recommendations</h4>
                         <ul className="space-y-1">
                           {latestSolution.recommendedActions.map((rec, i) => (
                             <li key={i} className="text-emerald-50 font-medium text-sm border-b border-emerald-700/50 last:border-0 pb-1 mb-1 last:mb-0 last:pb-0">{rec}</li>
                           ))}
                         </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Activity className="text-emerald-500" size={20} /> Metrics Breakdown
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {metricConfig.map((metric) => {
                    const score = latestRecord[metric.key];
                    return (
                      <div
                        key={metric.label}
                        className="p-5 rounded-2xl border"
                        style={{ backgroundColor: metric.bg, borderColor: metric.border }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{metric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg" style={{ color: metric.color }}>{score}%</span>
                            <TrendIcon trend={getTrend(score, metric.prev)} />
                          </div>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: `${metric.color}15` }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, backgroundColor: metric.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar: Charts */}
            <div className="space-y-6">
              <div className="premium-card p-6 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="font-extrabold self-start mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Relationship Balance</h3>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke={gridColor} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="font-extrabold mb-6 text-sm" style={{ color: 'var(--text-primary)' }}>Historical Trend</h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid var(--border-primary)',
                          boxShadow: 'var(--card-shadow)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#059669' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Entries */}
        {healthRecords.length > 1 && (
          <div className="premium-card p-8 sm:p-10 mt-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h2 className="text-xl font-extrabold mb-8 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Activity size={20} style={{ color: 'var(--text-muted)' }} /> Previous Entries
            </h2>
            <div className="space-y-4">
              {healthRecords.slice(1).map((record) => (
                <details
                  key={record.id}
                  className="group p-2 rounded-2xl border transition hover:shadow-md outline-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  <summary className="flex justify-between items-center p-3 cursor-pointer list-none outline-none">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center relative"
                        style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
                      >
                        <TrendingUp size={18} className="absolute transition-transform group-open:scale-0" />
                        <Minus size={18} className="absolute transition-transform scale-0 group-open:scale-100" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatSafeDate(record, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                          {formatSafeDate(record, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className="font-extrabold text-lg px-3 py-1 rounded-lg border"
                        style={{ color: 'var(--brand-emerald)', backgroundColor: 'var(--brand-emerald-light)', borderColor: 'rgba(16,185,129,0.15)' }}
                      >
                        {record.overall_score}%
                      </p>
                    </div>
                  </summary>
                  <div className="px-5 pb-5 pt-3 animate-fade-in border-t mt-2" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="grid md:grid-cols-[1fr,240px] gap-6">
                      <div className="space-y-4">
                        {record.journal_entry && (
                          <details className="group">
                            <summary
                              className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 list-none outline-none mb-2"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <MessageSquareText size={12} />
                              View Original Entry
                              <Plus size={10} className="group-open:hidden" />
                              <Minus size={10} className="hidden group-open:block" />
                            </summary>
                            <div
                              className="p-4 rounded-xl border text-sm italic leading-relaxed animate-fade-in mb-4"
                              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                            >
                              "{record.journal_entry}"
                            </div>
                          </details>
                        )}
                        {(() => {
                          const sol = parseReport(record.notes, record.improvements);
                          if (!sol) return null;
                          return (
                            <div
                              className="p-5 rounded-xl border shadow-sm transition hover:shadow-md space-y-4"
                              style={{ backgroundColor: 'var(--brand-emerald-light)', borderColor: 'rgba(16,185,129,0.15)' }}
                            >
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--brand-emerald)' }}>
                                  <Sparkles size={14} /> Core Insight
                                </h4>
                                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{sol.insight}</p>
                              </div>
                              
                              {sol.stepByStepActions.length > 0 && (
                                <div className="pt-3 border-t" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                                  <h5 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-emerald)' }}>Action Plan</h5>
                                  <ul className="space-y-3">
                                    {sol.stepByStepActions.map((action, i) => (
                                      <li key={i} className="flex gap-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                        <span
                                          className="font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                          style={{ backgroundColor: 'var(--brand-emerald)', color: '#fff' }}
                                        >{i + 1}</span> 
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {[
                            { label: 'Emotional', value: record.emotional_score, color: '#6366f1' },
                            { label: 'Communication', value: record.communication_score, color: '#14b8a6' },
                            { label: 'Intimacy', value: record.intimacy_score, color: '#f43f5e' },
                            { label: 'Conflict', value: record.conflict_score, color: '#f59e0b' },
                          ].map((m) => (
                            <span
                              key={m.label}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border"
                              style={{ color: m.color, backgroundColor: `${m.color}0d`, borderColor: `${m.color}25` }}
                            >
                              {m.label}: {m.value}%
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="h-[200px] rounded-xl border p-2 flex flex-col items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                      >
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Balance Map</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                            { subject: 'Emotional', A: record.emotional_score, fullMark: 100 },
                            { subject: 'Comm', A: record.communication_score, fullMark: 100 },
                            { subject: 'Intimacy', A: record.intimacy_score, fullMark: 100 },
                            { subject: 'Conflict', A: record.conflict_score, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke={gridColor} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                            <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {healthRecords.length === 0 && (
          <div
            className="premium-card p-12 text-center relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"
              style={{ backgroundColor: '#10b981' }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner"
                style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
              >
                <Sparkles size={40} />
              </div>
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Meet Your AI Coach
              </h3>
              <p className="mb-8 max-w-sm mx-auto text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Log your first weekly reflection and let our AI provide deep relationship insights and exact metrics.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-md hover:-translate-y-0.5 inline-flex items-center gap-2 focus-ring"
              >
                <Plus size={20} /> Create First Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
