import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, RelationshipHealth } from '../lib/supabase';
import { Heart, TrendingUp, TrendingDown, Minus, Activity, Plus, Sparkles, Loader2, MessageSquareText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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
        .order('recorded_at', { ascending: false });

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
Also provide a short (1-2 sentence) encouraging piece of advice based on what they wrote.

User's Journal Entry: "${journalEntry}"

You MUST respond with ONLY valid JSON strictly matching the format below, nothing else:
{
  "emotional_score": number,
  "communication_score": number,
  "intimacy_score": number,
  "conflict_score": number,
  "notes": "string"
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

      const { error } = await supabase.from('relationship_health').insert({
        user_id: profile!.id,
        emotional_score: emotional,
        communication_score: communication,
        intimacy_score: intimacy,
        conflict_score: conflict,
        overall_score: overallScore,
        notes: output.notes || 'No insights generated.',
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
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium tracking-wide">Loading records...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center py-10">
        <div className="text-center premium-card p-10 max-w-md w-full mx-4">
          <Activity className="text-emerald-500 mx-auto mb-5" size={48} />
          <p className="text-slate-700 font-bold text-lg mb-6 leading-relaxed">Please sign in to track your relationship health</p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md hover:-translate-y-0.5"
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
    if (trend === 'up') return <TrendingUp className="text-emerald-500 bg-emerald-50 p-1 rounded-full shrink-0" size={24} />;
    if (trend === 'down') return <TrendingDown className="text-rose-500 bg-rose-50 p-1 rounded-full shrink-0" size={24} />;
    return <Minus className="text-slate-400 bg-slate-100 p-1 rounded-full shrink-0" size={24} />;
  };

  // Prepare chart data
  const chartData = [...healthRecords].reverse().map(record => ({
    date: new Date(record.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: record.overall_score
  }));

  const radarData = latestRecord ? [
    { subject: 'Emotional', A: latestRecord.emotional_score, fullMark: 100 },
    { subject: 'Communication', A: latestRecord.communication_score, fullMark: 100 },
    { subject: 'Intimacy', A: latestRecord.intimacy_score, fullMark: 100 },
    { subject: 'Conflict', A: latestRecord.conflict_score, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 bg-white/40 border border-slate-200/60 p-6 rounded-[2rem] backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Sparkles className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">AI Health Tracker</h1>
              <p className="text-slate-600 font-medium">Conversational insights for your relationship</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 bg-slate-900 text-white w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md hover:-translate-y-0.5"
          >
            <Plus size={18} /> New AI Check-in
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 sm:p-10 max-h-[90vh] overflow-y-auto animate-rise-in border border-slate-200">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                <MessageSquareText className="text-emerald-500" size={28} /> Weekly Reflection
              </h2>
              <p className="text-slate-500 mb-8 font-medium">Write a few sentences about your relationship this week. Our AI will analyze your entry to extract scores and provide tailored advice securely.</p>

              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="relative">
                  <textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 font-medium transition placeholder:text-slate-400 min-h-[160px] resize-y"
                    placeholder="E.g., We had a minor argument about chores on Tuesday but resolved it quickly by talking it out. Date night on Friday was amazing and we felt really connected..."
                    disabled={saving}
                  />
                  {saving && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center z-10 transition-all">
                      <Loader2 className="animate-spin text-emerald-600 mb-3" size={36} />
                      <p className="text-emerald-800 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
                        Gemini is analyzing your entry...
                      </p>
                    </div>
                  )}
                </div>

                {aiError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 py-3 px-4 rounded-xl text-sm font-medium">
                    {aiError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setAiError('');
                      setJournalEntry('');
                    }}
                    disabled={saving}
                    className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-emerald-600 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md transform hover:-translate-y-0.5"
                  >
                    {saving ? 'Analyzing...' : <><Sparkles size={18} /> Ask AI</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {latestRecord && (
          <div className="grid lg:grid-cols-[1fr,400px] gap-8">
            <div className="space-y-8">
              <div className="premium-card p-8 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">AI Insights</h2>
                      <p className="text-emerald-200/80 font-medium text-sm mt-1">Based on your latest response</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-extrabold text-emerald-300 drop-shadow-md">{latestRecord.overall_score}%</div>
                      <div className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest mt-1">Overall Vitality</div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-emerald-300 shrink-0 mt-1" size={20} />
                      <p className="text-emerald-50 leading-relaxed font-medium text-lg">"{latestRecord.notes}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card p-8">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <Activity className="text-emerald-500" /> Metrics Breakdown
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Emotional', score: latestRecord.emotional_score, prev: previousRecord?.emotional_score, color: 'indigo' },
                    { label: 'Communication', score: latestRecord.communication_score, prev: previousRecord?.communication_score, color: 'teal' },
                    { label: 'Intimacy', score: latestRecord.intimacy_score, prev: previousRecord?.intimacy_score, color: 'rose' },
                    { label: 'Conflict Mgmt', score: latestRecord.conflict_score, prev: previousRecord?.conflict_score, color: 'amber' },
                  ].map((metric) => (
                    <div key={metric.label} className={`bg-${metric.color}-50/50 p-5 rounded-2xl border border-${metric.color}-100`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-${metric.color}-900`}>{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold text-lg text-${metric.color}-700`}>{metric.score}%</span>
                          <TrendIcon trend={getTrend(metric.score, metric.prev)} />
                        </div>
                      </div>
                      <div className={`w-full bg-${metric.color}-100 rounded-full h-2`}>
                        <div
                          className={`bg-${metric.color}-500 h-full rounded-full`}
                          style={{ width: `${metric.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="premium-card p-6 flex flex-col items-center justify-center">
                <h3 className="font-extrabold text-slate-800 self-start mb-4">Relationship Balance</h3>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="premium-card p-6">
                <h3 className="font-extrabold text-slate-800 mb-6">Historical Trend</h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        hide
                        domain={[0, 100]}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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

        {healthRecords.length === 0 && (
          <div className="premium-card p-12 text-center relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                <Sparkles className="text-emerald-500" size={48} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Meet Your AI Coach</h3>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                Log your first weekly reflection and let our AI provide deep relationship insights and exact metrics.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-md hover:-translate-y-0.5 inline-flex items-center gap-2"
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
