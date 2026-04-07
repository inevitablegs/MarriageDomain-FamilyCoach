import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart, ArrowRight, ArrowLeft, Users, Scale, Shield, Sparkles, Loader2,
  AlertTriangle, CheckCircle2, Zap, RotateCcw, Flame, TrendingUp, MessageCircleHeart, Clock
} from 'lucide-react';
import {
  runCouplePulsePipeline, PulseCheckReport, PulsePartnerResponses, PulseProgressCallback,
} from '../lib/ai';
import { PulseCheckSession, supabase, Profile } from '../lib/supabase';

type Props = { onNavigate: (page: string) => void };

type Stage = 'setup' | 'connection' | 'responsibility' | 'trust' | 'intimacy' | 'growth' | 'analyzing' | 'results';

const STAGES: Stage[] = ['setup', 'connection', 'responsibility', 'trust', 'intimacy', 'growth', 'analyzing', 'results'];

const empty = (): PulsePartnerResponses => ({
  connection_rating: 5, valued_action: '', intentional_time: false, emotional_highlight: '',
  tasks_handled: '', workload_fair: true, workload_explanation: '', partner_effort_acknowledgment: '',
  insecurity_triggers: '', boundaries_crossed: false, boundaries_explanation: '', hidden_anything: false,
  intimacy_rating: 5, vulnerability_shared: false, felt_heard: false, wish_partner_knew: '',
  gratitude_message: '', improvement_suggestion: '', growing_together: true, relationship_goal: '',
});

const sColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#f43f5e';
const statusLabel = (s: string) => s === 'strong' ? '💚 Strong' : s === 'stable' ? '💛 Stable' : s === 'needs-attention' ? '🟠 Needs Attention' : '🔴 Critical';

export function CouplePulseCheck({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [stage, setStage] = useState<Stage>('setup');
  const [responses, setResponses] = useState<PulsePartnerResponses>(empty());
  
  // Data state
  const [sessions, setSessions] = useState<PulseCheckSession[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [report, setReport] = useState<PulseCheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [error, setError] = useState('');
  const [phaseDetail, setPhaseDetail] = useState('');

  // Derived state
  const pendingPulse = sessions.find(s => s.status === 'pending_partner');
  const myPendingPulse = pendingPulse?.initiator_id === profile?.id;
  const partnerPendingPulse = pendingPulse?.partner_id === profile?.id;
  const history = sessions.filter(s => s.status === 'completed');

  const idx = STAGES.indexOf(stage);
  const pct = Math.round((idx / (STAGES.length - 2)) * 100); // Exclude analyzing/results from calculation

  useEffect(() => {
    if (!profile) return;
    
    const loadState = async () => {
      try {
        const { data: bData } = await supabase.from('pulse_check_sessions')
          .select('*')
          .or(`initiator_id.eq.${profile.id},partner_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });
        
        if (bData) setSessions(bData as PulseCheckSession[]);

        if (profile.partner_id) {
          const { data: pData } = await supabase.from('profiles').select('*').eq('id', profile.partner_id).single();
          if (pData) setPartnerProfile(pData as Profile);
        }
      } catch (err) {
        console.error('Error loading pulse sessions', err);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [profile]);

  const go = (s: Stage) => { setError(''); setStage(s); window.scrollTo(0, 0); };
  const next = () => { const i = STAGES.indexOf(stage); if (i < STAGES.length - 1) go(STAGES[i + 1]); };
  const prev = () => { const i = STAGES.indexOf(stage); if (i > 0) go(STAGES[i - 1]); };

  const upd = (p: Partial<PulsePartnerResponses>) => setResponses(v => ({ ...v, ...p }));
  const onProgress: PulseProgressCallback = (_ph, detail) => { setPhaseDetail(detail); };

  const submitMyResponses = async () => {
    if (!profile || !partnerProfile) return;
    go('analyzing');
    setError('');

    try {
      if (partnerPendingPulse && pendingPulse) {
        // I am responding! Time to run AI pipeline.
        onProgress('scoring', 'Loading partner responses and computing base scores...');
        const initResp = pendingPulse.initiator_responses as PulsePartnerResponses;
        const myResp = responses;

        const result = await runCouplePulsePipeline(partnerProfile.full_name, profile.full_name, initResp, myResp, onProgress);
        if (!result) throw new Error('Pipeline returned empty.');

        await supabase.from('pulse_check_sessions').update({
          partner_responses: myResp as unknown as Record<string, unknown>,
          report: result as unknown as Record<string, unknown>,
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', pendingPulse.id);

        setReport(result);
        go('results');
      } else {
        // I am starting a new session!
        onProgress('saving', 'Saving your responses...');
        const newSession = {
          initiator_id: profile.id,
          partner_id: profile.partner_id,
          status: 'pending_partner' as const,
          initiator_responses: responses as unknown as Record<string, unknown>,
        };
        
        // Save to DB
        await supabase.from('pulse_check_sessions').insert(newSession);
        
        // Update local state
        const { data: newSessions } = await supabase.from('pulse_check_sessions')
          .select('*')
          .or(`initiator_id.eq.${profile.id},partner_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });
        
        if (newSessions) setSessions(newSessions as PulseCheckSession[]);
        
        go('setup'); // Will re-render into "myPendingPulse" view
      }
    } catch (e: any) {
      console.error('Pulse failed:', e);
      setError(e.message || 'Operation failed.');
      go('growth');
    }
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-emerald-500" />
    </div>
  );

  if (!profile?.partner_id) return (
    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center py-10 px-4">
      <Card>
        <div className="text-center space-y-3">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={48} />
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Partner Connection Required</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You cannot start a Couple Pulse check until you have connected your partner's account.</p>
          <button onClick={() => onNavigate('dashboard')} className="mt-4 px-6 py-2 rounded-xl border border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50">Back to Dashboard</button>
        </div>
      </Card>
    </div>
  );

  // ── Render ──
  return (
    <div className="min-h-[calc(100vh-68px)] py-10 sm:py-14 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-rise-in">

        {/* Progress Tracker showing ONLY for active question stages */}
        {stage !== 'setup' && stage !== 'analyzing' && stage !== 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Heart className="text-white" size={20} fill="currentColor" />
                </div>
                Your Pulse
              </h1>
              <span className="text-sm font-bold text-emerald-600">{partnerPendingPulse ? 'Responding directly' : 'Starting new session'}</span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm font-medium animate-fade-in" style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}>
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* SETUP / DASHBOARD */}
        {stage === 'setup' && (
          <div className="space-y-6">
            <Card>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <Users className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Weekly Couple Pulse</h2>
                <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  A secure, private 5-pillar relationship check-in. Fill it out on your own device, and verify alignment together.
                </p>
              </div>

              {myPendingPulse && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center animate-fade-in">
                  <Clock className="mx-auto text-amber-500 mb-3" size={32} />
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Waiting for {partnerProfile?.full_name}</h3>
                  <p className="text-sm text-amber-800">You've successfully completed your part of the pulse check. Once your partner finishes their half, the results will appear here.</p>
                </div>
              )}

              {partnerPendingPulse && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-fade-in shadow-lg shadow-emerald-500/10">
                  <AlertTriangle className="mx-auto text-emerald-600 mb-3" size={32} />
                  <h3 className="text-lg font-bold text-emerald-900 mb-2">{partnerProfile?.full_name} is waiting for you!</h3>
                  <p className="text-sm text-emerald-800 mb-5">Your partner has completed the pulse check. Answer your half to run the AI alignment report.</p>
                  <button onClick={() => { setResponses(empty()); next(); }} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg focus-ring">
                    Respond Now <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {!pendingPulse && (
                <div className="space-y-6">
                  <HowItWorks />
                  <button onClick={() => { setResponses(empty()); next(); }} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 focus-ring">
                    Start New Pulse Check <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </Card>

            {/* History Tracker */}
            {history.length > 0 && (
              <div className="premium-card p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock size={20} className="text-indigo-500" /> Pulse History
                </h3>
                <div className="space-y-3">
                  {history.map((s) => {
                    const r = s.report as any;
                    return (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 gap-4 transition hover:bg-indigo-50/50">
                        <div>
                          <div className="font-bold text-sm text-indigo-900 mb-1">
                            {new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-indigo-700/80">Alignment Score: {r?.alignment_score || 'N/A'}%</div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Overall: {r?.overall_pulse || 'N/A'}%</span>
                          <button onClick={() => { setReport(r); window.scrollTo(0,0); setStage('results'); }} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:shadow">View Report</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- STAGE 1: CONNECTION --- */}
        {stage === 'connection' && (
          <StageWrap icon={<Heart className="text-white" size={24} fill="currentColor" />} title="Connection" subtitle="How connected did you feel this week?" gradient="bg-gradient-to-br from-rose-500 to-pink-600" onPrev={prev} onNext={() => { if (!responses.valued_action.trim()) { setError('Please describe what made you feel valued.'); return; } next(); }}>
            <Q>On a scale of 1–10, how connected did you feel this week?</Q>
            <Slider value={responses.connection_rating} onChange={v => upd({ connection_rating: v })} />
            <Q>What did your partner do that made you feel truly valued?</Q>
            <textarea value={responses.valued_action} onChange={e => upd({ valued_action: e.target.value })} className="input-base min-h-[90px] resize-y" placeholder="Be specific — small things matter most..." />
            <Q>What was your best emotional moment together this week?</Q>
            <textarea value={responses.emotional_highlight} onChange={e => upd({ emotional_highlight: e.target.value })} className="input-base min-h-[80px] resize-y" placeholder="A moment where you felt closest, happiest, or most loved..." />
            <Q>Did you spend intentional quality time together?</Q>
            <Toggle value={responses.intentional_time} onChange={v => upd({ intentional_time: v })} />
          </StageWrap>
        )}

        {/* --- STAGE 2: RESPONSIBILITY --- */}
        {stage === 'responsibility' && (
          <StageWrap icon={<Scale className="text-white" size={24} />} title="Responsibility Balance" subtitle="Reflect on how effort was shared." gradient="bg-gradient-to-br from-amber-500 to-orange-600" onPrev={prev} onNext={() => { if (!responses.tasks_handled.trim()) { setError('Please list tasks you handled.'); return; } next(); }}>
            <Q>List the tasks you handled this week (household, planning, emotional support…)</Q>
            <textarea value={responses.tasks_handled} onChange={e => upd({ tasks_handled: e.target.value })} className="input-base min-h-[90px] resize-y" placeholder="Cooking, kids, laundry, scheduling, emotional support..." />
            <Q>Do you feel the workload was fair this week?</Q>
            <Toggle value={responses.workload_fair} onChange={v => upd({ workload_fair: v })} />
            <Q>Why or why not?</Q>
            <textarea value={responses.workload_explanation} onChange={e => upd({ workload_explanation: e.target.value })} className="input-base min-h-[70px] resize-y" placeholder="Explain your feelings about the balance..." />
            <Q>What do you appreciate about your partner's effort this week?</Q>
            <textarea value={responses.partner_effort_acknowledgment} onChange={e => upd({ partner_effort_acknowledgment: e.target.value })} className="input-base min-h-[70px] resize-y" placeholder="Acknowledge something your partner did, even if small..." />
          </StageWrap>
        )}

        {/* --- STAGE 3: TRUST --- */}
        {stage === 'trust' && (
          <StageWrap icon={<Shield className="text-white" size={24} />} title="Trust & Honesty" subtitle="Reflect on trust, boundaries, and openness." gradient="bg-gradient-to-br from-indigo-500 to-violet-600" onPrev={prev} onNext={next}>
            <Q>Did anything this week make you feel insecure or doubtful?</Q>
            <textarea value={responses.insecurity_triggers} onChange={e => upd({ insecurity_triggers: e.target.value })} className="input-base min-h-[80px] resize-y" placeholder="Describe honestly, or type 'Nothing' if all good..." />
            <Q>Were any boundaries crossed this week?</Q>
            <Toggle value={responses.boundaries_crossed} onChange={v => upd({ boundaries_crossed: v })} />
            {responses.boundaries_crossed && <textarea value={responses.boundaries_explanation} onChange={e => upd({ boundaries_explanation: e.target.value })} className="input-base min-h-[70px] resize-y animate-fade-in" placeholder="What happened?" />}
            <Q>Did you hide anything important from your partner?</Q>
            <Toggle value={responses.hidden_anything} onChange={v => upd({ hidden_anything: v })} />
          </StageWrap>
        )}

        {/* --- STAGE 4: EMOTIONAL INTIMACY --- */}
        {stage === 'intimacy' && (
          <StageWrap icon={<Flame className="text-white" size={24} />} title="Emotional Intimacy" subtitle="How emotionally close did you feel?" gradient="bg-gradient-to-br from-pink-500 to-rose-600" onPrev={prev} onNext={next}>
            <Q>On a scale of 1–10, how emotionally close did you feel this week?</Q>
            <Slider value={responses.intimacy_rating} onChange={v => upd({ intimacy_rating: v })} />
            <Q>Did you share something vulnerable with your partner this week?</Q>
            <Toggle value={responses.vulnerability_shared} onChange={v => upd({ vulnerability_shared: v })} />
            <Q>Did you feel truly heard when you spoke?</Q>
            <Toggle value={responses.felt_heard} onChange={v => upd({ felt_heard: v })} />
            <Q>Complete this sentence: "I wish my partner knew…"</Q>
            <textarea value={responses.wish_partner_knew} onChange={e => upd({ wish_partner_knew: e.target.value })} className="input-base min-h-[80px] resize-y" placeholder="Something you've been holding inside..." />
          </StageWrap>
        )}

        {/* --- STAGE 5: GROWTH & APPRECIATION --- */}
        {stage === 'growth' && (
          <StageWrap icon={<TrendingUp className="text-white" size={24} />} title="Growth & Appreciation" subtitle="Are you growing together?" gradient="bg-gradient-to-br from-emerald-500 to-teal-600" onPrev={prev} onNext={submitMyResponses} nextLabel={partnerPendingPulse ? '✨ Submit & Analyze' : 'Send to Partner'}>
            <Q>Write a direct message of gratitude to your partner:</Q>
            <textarea value={responses.gratitude_message} onChange={e => upd({ gratitude_message: e.target.value })} className="input-base min-h-[80px] resize-y" placeholder="Dear [partner], I want you to know that..." />
            <Q>What's one thing your partner could do better next week?</Q>
            <textarea value={responses.improvement_suggestion} onChange={e => upd({ improvement_suggestion: e.target.value })} className="input-base min-h-[70px] resize-y" placeholder="Be kind but honest — this helps you both grow..." />
            <Q>Do you feel you're growing together as a couple?</Q>
            <Toggle value={responses.growing_together} onChange={v => upd({ growing_together: v })} />
            <Q>What's one relationship goal for next week?</Q>
            <textarea value={responses.relationship_goal} onChange={e => upd({ relationship_goal: e.target.value })} className="input-base min-h-[70px] resize-y" placeholder="E.g., Have one distraction-free dinner together..." />
          </StageWrap>
        )}

        {/* ANALYZING */}
        {stage === 'analyzing' && (
          <Card>
            <div className="text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl"><Sparkles className="text-white" size={36} /></div>
                <div className="absolute -inset-3 rounded-[28px] border-2 border-emerald-400/20 border-t-emerald-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{partnerPendingPulse ? 'Analyzing Pulse Check' : 'Saving Your Answers'}</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 justify-center text-sm font-medium" style={{ color: 'var(--brand-emerald)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  {phaseDetail || 'Synchronizing with partner data...'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* RESULTS */}
        {stage === 'results' && report && (
          <div className="space-y-6 animate-rise-in">
            {/* Hero */}
            <div className="premium-card p-8 sm:p-10 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden noise-overlay">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"><Heart className="text-emerald-300" size={22} fill="currentColor" /></div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold">Couple Pulse Report</h1>
                      <p className="text-emerald-200/80 text-sm">{profile?.full_name} & {partnerProfile?.full_name}</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-6xl font-extrabold drop-shadow-lg" style={{ color: sColor(report.overall_pulse) }}>{report.overall_pulse}</div>
                    <div className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-widest mt-1">Overall Pulse</div>
                  </div>
                </div>
                {/* Emotional Summary */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl mb-4">
                  <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2"><Sparkles size={14} className="inline mr-1" />Emotional Summary</h4>
                  <p className="text-emerald-50 font-medium leading-relaxed">{report.emotional_summary}</p>
                </div>
                {/* Insight */}
                <div className="bg-emerald-800/40 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                  <Sparkles className="text-emerald-300 shrink-0 mt-0.5" size={18} />
                  <p className="text-emerald-50 font-bold text-sm">{report.insight}</p>
                </div>
              </div>
            </div>

            {/* Pillar Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.pillars.map(p => (
                <div key={p.name} className="premium-card p-5 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-30 translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ backgroundColor: sColor(p.finalScore) }} />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    <span className="text-xs font-bold">{statusLabel(p.status)}</span>
                  </div>
                  <div className="text-3xl font-extrabold mb-1" style={{ color: sColor(p.finalScore) }}>{p.finalScore}%</div>
                  <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: `${sColor(p.finalScore)}15` }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.finalScore}%`, backgroundColor: sColor(p.finalScore) }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    <span>Local: {p.localScore}%</span>
                    <span>Alignment: {p.alignmentScore}%</span>
                  </div>
                </div>
              ))}
              {/* Alignment Score Card */}
              <div className="premium-card p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} style={{ color: 'var(--brand-emerald)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Partner Alignment</span>
                </div>
                <div className="text-3xl font-extrabold mb-1" style={{ color: sColor(report.alignment_score) }}>{report.alignment_score}%</div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How similarly you both perceive your relationship</p>
              </div>
            </div>

            {/* Responsibility Balance */}
            <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Scale size={16} className="text-amber-500" />Workload Balance
                {report.responsibility_balance.imbalance_detected && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md ml-2" style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>⚠ Imbalance</span>}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold w-20 text-right truncate" style={{ color: 'var(--text-primary)' }}>{myPendingPulse ? profile?.full_name : partnerProfile?.full_name}</span>
                <div className="flex-1 flex h-7 rounded-full overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700" style={{ width: `${report.responsibility_balance.partner_a_percent}%`, backgroundColor: '#10b981' }}>{report.responsibility_balance.partner_a_percent}%</div>
                  <div className="h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700" style={{ width: `${report.responsibility_balance.partner_b_percent}%`, backgroundColor: '#6366f1' }}>{report.responsibility_balance.partner_b_percent}%</div>
                </div>
                <span className="text-xs font-bold w-20 truncate" style={{ color: 'var(--text-primary)' }}>{myPendingPulse ? partnerProfile?.full_name : profile?.full_name}</span>
              </div>
            </div>

            {/* Answer Alignment Table */}
            {report.similarity_pairs.length > 0 && (
              <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MessageCircleHeart size={16} className="text-indigo-500" />Answer Alignment Breakdown
                </h3>
                <div className="space-y-2">
                  {report.similarity_pairs.map((sp, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border text-xs" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                      <span className="font-bold w-32 shrink-0" style={{ color: 'var(--text-primary)' }}>{sp.label}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${sp.score === 1 ? 'bg-emerald-100 text-emerald-700' : sp.score === 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {sp.score === 1 ? '✓ Aligned' : sp.score === 0.5 ? '~ Partial' : '✗ Misaligned'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discrepancies */}
            {report.discrepancies.length > 0 && (
              <div className="premium-card p-6 border-l-4" style={{ backgroundColor: 'var(--bg-secondary)', borderLeftColor: '#f59e0b' }}>
                <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: '#d97706' }}>
                  <AlertTriangle size={16} />Discrepancy Warnings
                </h3>
                <ul className="space-y-2">
                  {report.discrepancies.map((d, i) => (
                    <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues & Positives */}
            <div className="grid sm:grid-cols-2 gap-4">
              {report.top_issues.length > 0 && (
                <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><AlertTriangle size={16} className="text-rose-500" />Issues to Address</h3>
                  <ul className="space-y-2">
                    {report.top_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-xl border" style={{ backgroundColor: 'rgba(244,63,94,0.04)', borderColor: 'rgba(244,63,94,0.12)', color: 'var(--text-secondary)' }}>
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.positive_behaviors.length > 0 && (
                <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><CheckCircle2 size={16} className="text-emerald-500" />What's Going Well</h3>
                  <ul className="space-y-2">
                    {report.positive_behaviors.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-xl border" style={{ backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.12)', color: 'var(--text-secondary)' }}>
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Weekly Actions */}
            {report.weekly_actions.length > 0 && (
              <div className="premium-card p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-teal-900 text-white relative overflow-hidden noise-overlay">
                <div className="relative z-10">
                  <h3 className="text-base font-extrabold mb-4 flex items-center gap-2"><Zap size={18} className="text-emerald-300" />Weekly Action Plan</h3>
                  <ul className="space-y-3">
                    {report.weekly_actions.map((act, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                        <span className="bg-emerald-600 font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs">{i + 1}</span>
                        <span className="text-emerald-50 font-medium">{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center mt-8">
              <button onClick={() => { setReport(null); go('setup'); }}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring">
                Back to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared UI ──

function Card({ children }: { children: React.ReactNode }) {
  return <div className="premium-card p-8 sm:p-10 space-y-6 animate-rise-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>{children}</div>;
}

function Q({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{children}</label>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => onChange(v)} className="flex-1 py-3 rounded-xl font-bold text-sm border transition-all hover:-translate-y-0.5 focus-ring"
          style={value === v ? { backgroundColor: 'var(--brand-emerald)', borderColor: 'var(--brand-emerald)', color: '#fff' } : { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-emerald-500 h-2 rounded-full" />
      <span className="text-2xl font-extrabold w-10 text-center tabular-nums" style={{ color: 'var(--brand-emerald)' }}>{value}</span>
    </div>
  );
}

function StageWrap({ icon, title, subtitle, gradient, children, onPrev, onNext, nextLabel = 'Continue' }: {
  icon: React.ReactNode; title: string; subtitle: string; gradient: string;
  children: React.ReactNode; onPrev: () => void; onNext: () => void; nextLabel?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg shrink-0`}>{icon}</div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
      <div className="flex gap-3 pt-2">
        <button onClick={onPrev} className="flex-shrink-0 px-5 py-3.5 rounded-xl font-bold border transition-all hover:-translate-y-0.5 focus-ring flex items-center gap-2"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}><ArrowLeft size={16} /> Back</button>
        <button onClick={onNext} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md hover:-translate-y-0.5 focus-ring">
          {nextLabel} <ArrowRight size={16} />
        </button>
      </div>
    </Card>
  );
}

function HowItWorks() {
  const items = [
    { icon: <Heart size={14} />, text: 'Answer 5 pillars securely on your own device' },
    { icon: <RotateCcw size={14} />, text: 'Your partner receives an alert to complete their half' },
    { icon: <Sparkles size={14} />, text: 'AI generates a single report comparing your answers' },
  ];
  return (
    <div className="rounded-2xl p-5 border space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
      <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>How it Works</h4>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}>{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
