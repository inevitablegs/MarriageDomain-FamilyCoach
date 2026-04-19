import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Heart,
  Lightbulb,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  Calendar,
  Clock,
  Handshake,
  Eye,
  HeartHandshake,
  User,
  Ban,
  BookOpen,
  Repeat,
  CheckCircle2,
  MessageSquareText,
  Footprints,
  Trash2,
} from 'lucide-react';
import {
  resolveExpectation,
  generateRecommendations,
  readAllThoughts,
  writeAllThoughts,
  genId,
  priorityConfig as priorityData,
  emotionEmoji,
  type ExpectationResolverResult,
  type RecommendationResult,
  type StoredThought,
  type ThoughtInput,
} from '../lib/expectationResolverAi';

// ── Context chips ──
const CONTEXT_OPTIONS = [
  'after fight',
  'feeling disturbed',
  'missing partner',
  'after meeting',
  'general concern',
  'future anxiety',
  'trust issue',
  'communication gap',
  'family pressure',
  'feeling happy',
];

// ── Priority config with icons ──
const priorityConfig = {
  low: { ...priorityData.low, icon: Clock },
  medium: { ...priorityData.medium, icon: TrendingUp },
  high: { ...priorityData.high, icon: AlertTriangle },
  critical: { ...priorityData.critical, icon: Zap },
};

const categoryBadge = {
  temporary: { label: 'Temporary', color: '#5c7c64', bg: 'rgba(92,124,100,0.12)' },
  recurring: { label: 'Recurring', color: '#d97757', bg: 'rgba(217,119,87,0.12)' },
  core: { label: 'Core Issue', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
};

type TabType = 'my-thoughts' | 'partner-needs';

type Props = { onNavigate: (page: string) => void };

export function ExpectationResolver({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my-thoughts');
  const [myThoughts, setMyThoughts] = useState<StoredThought[]>([]);
  const [partnerThoughts, setPartnerThoughts] = useState<StoredThought[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [thoughtText, setThoughtText] = useState('');
  const [contextText, setContextText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeResult, setActiveResult] = useState<StoredThought | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Recommendation Engine state
  const [selectedRecoThought, setSelectedRecoThought] = useState<string>('');
  const [recoResult, setRecoResult] = useState<RecommendationResult | null>(null);
  const [isLoadingReco, setIsLoadingReco] = useState(false);
  const [recoDropdownOpen, setRecoDropdownOpen] = useState(false);

  // All thoughts combined for the dropdown
  const allActiveThoughts = useMemo(() => {
    return [...myThoughts, ...partnerThoughts].filter((t) => !t.is_deleted);
  }, [myThoughts, partnerThoughts]);

  const selectedRecoThoughtObj = useMemo(() => {
    return allActiveThoughts.find((t) => t.id === selectedRecoThought) || null;
  }, [allActiveThoughts, selectedRecoThought]);

  // Generate recommendations for selected thought
  const handleGenerateReco = async () => {
    if (!selectedRecoThoughtObj || isLoadingReco) return;
    setIsLoadingReco(true);
    setRecoResult(null);
    const result = await generateRecommendations(selectedRecoThoughtObj);
    setRecoResult(result);
    setIsLoadingReco(false);
  };

  const hasPartner = Boolean(profile?.partner_id);

  // Load partner profile
  useEffect(() => {
    if (!profile?.partner_id) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.partner_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPartnerProfile(data as Profile);
      });
  }, [profile?.partner_id]);

  // Load thoughts on mount — split into mine vs partner's
  useEffect(() => {
    if (!profile) return;
    const all = readAllThoughts();
    setMyThoughts(all.filter((t) => t.user_id === profile.id));
    if (profile.partner_id) {
      setPartnerThoughts(all.filter((t) => t.user_id === profile.partner_id));
    }
  }, [profile]);

  // Find similar past thoughts
  const findSimilarThoughts = (text: string): StoredThought[] => {
    const words = text.toLowerCase().split(/\s+/);
    return myThoughts
      .filter((t) => !t.is_deleted)
      .filter((t) => {
        const tWords = t.thought_text.toLowerCase().split(/\s+/);
        return words.some((w) => tWords.some((tw) => tw.includes(w) || w.includes(tw)));
      });
  };

  // Stats for my thoughts
  const myStats = useMemo(() => {
    const active = myThoughts.filter((t) => !t.is_deleted);
    const resolved = myThoughts.filter((t) => t.is_deleted);
    const critical = active.filter((t) => t.priority === 'critical' || t.priority === 'high');
    return { total: myThoughts.length, active: active.length, resolved: resolved.length, critical: critical.length };
  }, [myThoughts]);

  // Partner's active expectations for me
  const partnerActiveNeeds = useMemo(() => {
    return partnerThoughts.filter((t) => !t.is_deleted);
  }, [partnerThoughts]);

  // Submit thought
  const handleSubmit = async () => {
    if (!thoughtText.trim() || !profile || isAnalyzing) return;
    setIsAnalyzing(true);

    const similarPast = findSimilarThoughts(thoughtText);
    const input: ThoughtInput = {
      thought_text: thoughtText.trim(),
      timestamp: new Date().toISOString(),
      past_thoughts: similarPast.map((t) => ({
        text: t.thought_text, timestamp: t.created_at, frequency: t.frequency,
      })),
      is_deleted: false,
      context: contextText || undefined,
      user_name: profile.full_name,
    };

    const result = await resolveExpectation(input);

    const newThought: StoredThought = {
      id: genId(),
      user_id: profile.id,
      user_name: profile.full_name,
      thought_text: thoughtText.trim(),
      context: contextText,
      is_deleted: false,
      frequency: similarPast.length + 1,
      priority: result?.priority || 'medium',
      result,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedMine = [newThought, ...myThoughts];
    setMyThoughts(updatedMine);

    // Write back all thoughts (merge)
    const allOthers = readAllThoughts().filter((t) => t.user_id !== profile.id);
    writeAllThoughts([...updatedMine, ...allOthers]);

    setActiveResult(newThought);
    setThoughtText('');
    setContextText('');
    setIsAnalyzing(false);
  };

  // Mark as resolved (replaces delete)
  const handleResolve = async (thoughtId: string) => {
    const allThoughts = readAllThoughts();
    const thought = allThoughts.find((t) => t.id === thoughtId);
    if (!thought || !profile) return;

    // If already resolved, do nothing
    if (thought.is_deleted) return;

    const input: ThoughtInput = {
      thought_text: thought.thought_text,
      timestamp: new Date().toISOString(),
      past_thoughts: [],
      is_deleted: true,
      context: thought.context,
      user_name: thought.user_name || 'Partner',
    };

    const healingResult = await resolveExpectation(input);

    const updatedThoughts = allThoughts.map((t) =>
      t.id === thoughtId
        ? {
            ...t,
            is_deleted: true,
            updated_at: new Date().toISOString(),
            result: healingResult || t.result
              ? {
                  ...(t.result || ({} as ExpectationResolverResult)),
                  healing: {
                    is_resolved: true,
                    message: healingResult?.healing?.message || 'This issue has been resolved. Great progress! 💚',
                  },
                }
              : null,
          }
        : t
    );

    writeAllThoughts(updatedThoughts);
    
    // Refresh local states
    setMyThoughts(updatedThoughts.filter(t => t.user_id === profile.id));
    setPartnerThoughts(updatedThoughts.filter(t => t.user_id !== profile.id && t.user_id === profile.partner_id));

    if (activeResult?.id === thoughtId) {
      const resolved = updatedThoughts.find((t) => t.id === thoughtId);
      if (resolved) setActiveResult(resolved);
    }
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-8 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Header ── */}
        <section className="animate-rise-in">
          <button
            onClick={() => onNavigate('dashboard-before')}
            className="inline-flex items-center gap-2 text-sm font-semibold mb-6 transition-all hover:-translate-x-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div
            className="relative overflow-hidden rounded-[2.5rem] px-8 py-12 sm:px-12 shadow-2xl noise-overlay"
            style={{ background: 'linear-gradient(135deg, #2d1b4e 0%, #4a2c7a 30%, #6b3fa0 60%, #8b5cf6 100%)' }}
          >
            <div className="absolute top-0 right-0 h-72 w-72 bg-purple-400/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-fuchsia-400/10 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
                <Brain className="text-purple-200" size={30} />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 border border-white/20 shadow-sm mb-4">
                  <Sparkles size={12} className="mr-1.5 text-purple-200" /> Expectation Resolver™
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Turn Feelings Into Clarity
                </h1>
                <p className="mt-3 text-purple-100/80 text-base max-w-2xl leading-relaxed">
                  Share your thoughts — our AI tells your partner exactly how to respond.
                  Both of you can use this. Your partner sees guidance on how to behave, handle, and fulfil your expectations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual-Partner Tab Switcher ── */}
        <section className="stagger-1">
          <div className="flex gap-2 p-1.5 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button
              onClick={() => { setActiveTab('my-thoughts'); setActiveResult(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: activeTab === 'my-thoughts' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'my-thoughts' ? '#8b5cf6' : 'var(--text-muted)',
                boxShadow: activeTab === 'my-thoughts' ? 'var(--card-shadow)' : 'none',
              }}
            >
              <User size={16} /> My Thoughts
              {myStats.active > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
                  {myStats.active}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('partner-needs'); setActiveResult(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all relative"
              style={{
                backgroundColor: activeTab === 'partner-needs' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'partner-needs' ? '#d97757' : 'var(--text-muted)',
                boxShadow: activeTab === 'partner-needs' ? 'var(--card-shadow)' : 'none',
              }}
            >
              <HeartHandshake size={16} /> Partner's Needs
              {partnerActiveNeeds.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: '#d9775720', color: '#d97757' }}>
                  {partnerActiveNeeds.length}
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ── TAB: My Thoughts ── */}
        {activeTab === 'my-thoughts' && (
          <>
            {/* Stats */}
            <section className="stagger-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'My Thoughts', value: myStats.total, icon: MessageCircle, color: '#8b5cf6' },
                { label: 'Active', value: myStats.active, icon: Zap, color: '#d97757' },
                { label: 'Resolved', value: myStats.resolved, icon: Check, color: '#5c7c64' },
                { label: 'Critical', value: myStats.critical, icon: AlertTriangle, color: '#dc2626' },
              ].map((s) => (
                <div key={s.label} className="premium-card p-4 flex items-center gap-3 group hover:-translate-y-0.5 transition-all" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Input */}
            <section className="stagger-3">
              <div className="premium-card p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h2 className="text-lg font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Heart size={18} style={{ color: '#8b5cf6' }} /> What's on your mind?
                </h2>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                  Share a thought — your partner will receive AI guidance on how to respond to your needs
                </p>

                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='"Feeling ignored lately" or "Not sure about our future"'
                    rows={2}
                    maxLength={150}
                    className="input-base resize-none pr-14 text-base"
                    disabled={isAnalyzing}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!thoughtText.trim() || isAnalyzing}
                    className="absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                    style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                  >
                    {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>

                {/* Context chips */}
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Context (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_OPTIONS.map((ctx) => (
                      <button
                        key={ctx}
                        onClick={() => setContextText(contextText === ctx ? '' : ctx)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border hover:-translate-y-0.5"
                        style={{
                          backgroundColor: contextText === ctx ? '#8b5cf620' : 'var(--bg-tertiary)',
                          borderColor: contextText === ctx ? '#8b5cf6' : 'var(--border-primary)',
                          color: contextText === ctx ? '#8b5cf6' : 'var(--text-secondary)',
                        }}
                      >
                        {ctx}
                      </button>
                    ))}
                  </div>
                </div>

                {isAnalyzing && (
                  <div className="mt-6 rounded-2xl p-6 text-center animate-fade-in" style={{ backgroundColor: '#8b5cf60a' }}>
                    <div className="inline-flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin" />
                        <Brain size={14} className="absolute inset-0 m-auto text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Analyzing & generating partner guidance…</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Detecting emotions, patterns, and creating actionable recommendations</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Result + History */}
            <div className="grid lg:grid-cols-[1fr,380px] gap-8">
              <section className="stagger-4 space-y-6">
                {activeResult?.result ? (
                  <MyThoughtResult 
                    thought={activeResult} 
                    onCopy={handleCopyMessage} 
                    copied={copiedMessage} 
                    onResolve={handleResolve} 
                  />
                ) : (
                  <div className="space-y-6">
                    <RecommendationEngineSelector 
                      allActiveThoughts={allActiveThoughts}
                      myThoughts={myThoughts}
                      partnerThoughts={partnerThoughts}
                      partnerProfile={partnerProfile}
                      selectedRecoThought={selectedRecoThought}
                      setSelectedRecoThought={setSelectedRecoThought}
                      selectedRecoThoughtObj={selectedRecoThoughtObj}
                      recoDropdownOpen={recoDropdownOpen}
                      setRecoDropdownOpen={setRecoDropdownOpen}
                      handleGenerateReco={handleGenerateReco}
                      isLoadingReco={isLoadingReco}
                      recoResult={recoResult}
                      onCopy={handleCopyMessage}
                      copied={copiedMessage}
                      title="Strategy Deep-Dive"
                      description="Select one of your past thoughts to generate a comprehensive resolution strategy for you and your partner."
                      filter="mine"
                    />
                  </div>
                )}
              </section>

              <section className="stagger-5">
                <ThoughtHistoryList 
                  thoughts={myThoughts} 
                  activeId={activeResult?.id} 
                  onSelect={setActiveResult} 
                  onResolve={handleResolve}
                  label="My Thought History" 
                  color="#8b5cf6" 
                />
              </section>
            </div>
          </>
        )}

        {/* ── TAB: Partner's Needs (Guidance for ME) ── */}
        {activeTab === 'partner-needs' && (
          <>
            {!hasPartner ? (
              <section className="stagger-2">
                <div className="premium-card p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#d9775710' }}>
                    <Users size={36} style={{ color: '#d97757' }} />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Partner First</h3>
                  <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
                    Invite your partner to join MarriageWise. Once connected, you'll see their thoughts here with AI guidance on how to fulfil their expectations.
                  </p>
                  <button
                    onClick={() => onNavigate('quiz')}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: '#d97757' }}
                  >
                    Connect Partner <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
              </section>
            ) : (
              <>
                {/* Partner info banner */}
                <section className="stagger-2">
                  <div
                    className="premium-card p-6 flex items-center gap-4"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #d97757' }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: '#d97757' }}>
                      {(partnerProfile?.full_name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        {partnerProfile?.full_name || 'Your Partner'}'s Expectations
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {partnerActiveNeeds.length > 0
                          ? `${partnerActiveNeeds.length} active expectation${partnerActiveNeeds.length > 1 ? 's' : ''} — the AI has guidance for you on each one`
                          : 'No active expectations right now. Your partner hasn\'t shared any thoughts yet.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold" style={{ color: '#d97757' }}>{partnerActiveNeeds.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active</p>
                    </div>
                  </div>
                </section>

                {/* Partner's expectations list + Guidance display */}
                <div className="grid lg:grid-cols-[380px,1fr] gap-8">
                  {/* List of partner's thoughts */}
                  <section className="stagger-3">
                    <ThoughtHistoryList
                      thoughts={partnerThoughts}
                      activeId={activeResult?.id}
                      onSelect={setActiveResult}
                      onResolve={handleResolve}
                      label={`${partnerProfile?.full_name || 'Partner'}'s Thoughts`}
                      color="#d97757"
                    />
                  </section>

                  {/* Guidance panel */}
                  <section className="stagger-4 space-y-6">
                    {activeResult?.result ? (
                      <PartnerGuidanceDisplay 
                        thought={activeResult} 
                        onCopy={handleCopyMessage} 
                        copied={copiedMessage} 
                        partnerName={activeResult.user_name || partnerProfile?.full_name || 'Your Partner'} 
                        onResolve={handleResolve}
                      />
                    ) : (
                      <div className="space-y-6">
                        <RecommendationEngineSelector 
                          allActiveThoughts={allActiveThoughts}
                          myThoughts={myThoughts}
                          partnerThoughts={partnerThoughts}
                          partnerProfile={partnerProfile}
                          selectedRecoThought={selectedRecoThought}
                          setSelectedRecoThought={setSelectedRecoThought}
                          selectedRecoThoughtObj={selectedRecoThoughtObj}
                          recoDropdownOpen={recoDropdownOpen}
                          setRecoDropdownOpen={setRecoDropdownOpen}
                          handleGenerateReco={handleGenerateReco}
                          isLoadingReco={isLoadingReco}
                          recoResult={recoResult}
                          onCopy={handleCopyMessage}
                          copied={copiedMessage}
                          title="Expert Recommendation Engine"
                          description={`Select one of ${partnerProfile?.full_name || 'your partner'}'s recorded thoughts — AI will build a personalized plan for you to resolve it.`}
                          filter="partner"
                        />
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED: Thought History List
// ═══════════════════════════════════════════════════════════════

function ThoughtHistoryList({ thoughts, activeId, onSelect, onResolve, label, color }: {
  thoughts: StoredThought[];
  activeId?: string;
  onSelect: (t: StoredThought) => void;
  onResolve: (id: string) => void;
  label: string;
  color: string;
}) {
  return (
    <div className="premium-card overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
        <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock size={16} style={{ color }} /> {label}
        </h3>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{thoughts.length}</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {thoughts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No thoughts recorded yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            {thoughts.slice(0, 30).map((thought) => {
              const pConfig = priorityConfig[thought.priority] || priorityConfig.medium;
              const isActive = activeId === thought.id;
              return (
                <button
                  key={thought.id}
                  onClick={() => onSelect(thought)}
                  className="w-full p-4 text-left transition-all hover:bg-[var(--bg-tertiary)] group"
                  style={{ backgroundColor: isActive ? 'var(--bg-tertiary)' : undefined, borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{emotionEmoji[thought.result?.emotion?.type || 'unknown'] || '💭'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${thought.is_deleted ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>
                        {thought.thought_text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pConfig.bg, color: pConfig.color }}>{pConfig.label}</span>
                        {thought.is_deleted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(92,124,100,0.12)', color: '#5c7c64' }}>✓ Resolved</span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(thought.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {!thought.is_deleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onResolve(thought.id); }}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                          title="Mark as Resolved"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MY THOUGHT RESULT (what the user sees for their own thoughts)
// ═══════════════════════════════════════════════════════════════

function MyThoughtResult({ thought, onCopy, copied, onResolve }: {
  thought: StoredThought;
  onCopy: (msg: string) => void;
  copied: boolean;
  onResolve: (id: string) => void;
}) {
  const r = thought.result;
  if (!r) return null;

  const pConfig = priorityConfig[r.priority] || priorityConfig.medium;
  const PriorityIcon = pConfig.icon;
  const catBadge = categoryBadge[r.pattern.category] || categoryBadge.temporary;
  const intensitySegments = Array.from({ length: 10 }, (_, i) => i < r.emotion.intensity);

  return (
    <div className="space-y-6 animate-rise-in">
      {/* Header Card */}
      <div className="premium-card p-6 sm:p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ backgroundColor: pConfig.color }} />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-inner text-3xl">
                {emotionEmoji[r.emotion.type] || '💭'}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--text-muted)' }}>Original Thought</p>
                <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>"{thought.thought_text}"</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!thought.is_deleted && (
                <button 
                  onClick={() => onResolve(thought.id)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm" 
                  style={{ backgroundColor: 'var(--brand-emerald)', color: '#fff' }}
                >
                  <CheckCircle2 size={14} /> Mark Resolved
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ backgroundColor: pConfig.bg, borderColor: pConfig.color, color: pConfig.color }}>
              <PriorityIcon size={12} /> {pConfig.label} Priority
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ backgroundColor: catBadge.bg, borderColor: catBadge.color, color: catBadge.color }}>
              <Repeat size={12} /> {catBadge.label} Issue
            </div>
            {thought.context && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-500/20 bg-purple-500/5 text-purple-500">
                <Shield size={12} /> Context: {thought.context}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Healing Message Case */}
      {thought.is_deleted && r.healing?.is_resolved && (
        <div className="premium-card p-6 border-2 animate-scale-in bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <HeartHandshake size={24} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400 mb-1">Issue Resolved</h4>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {r.healing.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emotional Intelligence Analysis */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="premium-card p-6 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div>
            <h4 className="label-clinical mb-4 flex items-center gap-2" style={{ color: '#8b5cf6' }}>
              <Heart size={14} /> Emotion Intelligence
            </h4>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black capitalize" style={{ color: 'var(--text-primary)' }}>{r.emotion.type}</span>
              <span className="text-sm font-bold opacity-60">Level {r.emotion.intensity}/10</span>
            </div>
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>The primary driver behind this specific thought.</p>
          </div>
          <div className="flex gap-1.5 h-2">
            {intensitySegments.map((active, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-full transition-all duration-700" 
                style={{ 
                  backgroundColor: active ? (i < 4 ? '#5c7c64' : i < 7 ? '#d97757' : '#dc2626') : 'var(--border-primary)',
                  boxShadow: active ? `0 0 10px ${i < 4 ? '#5c7c6440' : i < 7 ? '#d9775740' : '#dc262640'}` : 'none'
                }} 
              />
            ))}
          </div>
        </div>

        <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h4 className="label-clinical mb-4 flex items-center gap-2" style={{ color: '#d97757' }}>
            <Target size={14} /> Hidden Expectation
          </h4>
          <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            "{r.hidden_expectation}"
          </p>
          <p className="mt-3 text-sm font-medium leading-relaxed opacity-70" style={{ color: 'var(--text-secondary)' }}>
            Converting your complaint into a clear emotional need to help your partner understand you better.
          </p>
        </div>
      </div>

      {/* Actionable Quick Fix */}
      <div className="premium-card p-6 sm:p-8 border-l-8" style={{ backgroundColor: 'var(--bg-secondary)', borderLeftColor: '#8b5cf6' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Zap size={20} className="text-purple-600" />
          </div>
          <h4 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Real-Time Actionable Fix</h4>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800">
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Recommended Action:</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{r.quick_fix.action}</p>
          </div>

          {r.quick_fix.message && (
            <div className="relative p-5 rounded-2xl bg-white dark:bg-[#1a1918] border-2 border-dashed border-purple-200 dark:border-purple-800 shadow-sm transition-all hover:shadow-md group">
              <div className="absolute -top-3 left-4 px-2 bg-[var(--bg-secondary)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Ready-to-Send Message</p>
              </div>
              <p className="text-base font-semibold italic text-slate-800 dark:text-slate-200 pr-10">"{r.quick_fix.message}"</p>
              <button 
                onClick={() => onCopy(r.quick_fix.message)} 
                className="absolute top-4 right-4 p-2 rounded-xl transition-all hover:scale-110 active:scale-95 bg-purple-600 text-white shadow-lg"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Partner Perspective (BIDIRECTIONAL) */}
      <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <User size={20} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400">Non-Blaming Partner Insight</h4>
            <p className="text-xs font-semibold opacity-60">How we are reframing this for your partner</p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Insight Reframing</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.partner_view.insight}</p>
          </div>
          <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-2">Recommended for them</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.partner_view.action}</p>
          </div>
        </div>
      </div>

      {/* Agreement Builder */}
      {r.agreement.required && r.agreement.rules.length > 0 && (
        <div className="premium-card p-6 bg-gradient-to-br from-[#fdfcfb] to-[#fbeee9] dark:from-[#22201f] dark:to-[#2d1d18] border-l-8 border-l-[#d97757]">
          <h4 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-[#d97757]">
            <Handshake size={20} /> Agreement Builder — Shared House Rules
          </h4>
          <div className="space-y-3">
            {r.agreement.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-[#d9775715]">
                <div className="w-8 h-8 rounded-full bg-[#d9775710] flex items-center justify-center shrink-0 border border-[#d9775720] text-sm font-black text-[#d97757]">
                  {i + 1}
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARTNER GUIDANCE DISPLAY (what the partner sees — how to behave)
// ═══════════════════════════════════════════════════════════════

function PartnerGuidanceDisplay({ thought, onCopy, copied, partnerName, onResolve }: {
  thought: StoredThought;
  onCopy: (msg: string) => void;
  copied: boolean;
  partnerName: string;
  onResolve: (id: string) => void;
}) {
  const r = thought.result;
  if (!r) return null;

  const pConfig = priorityConfig[r.priority] || priorityConfig.medium;
  const PriorityIcon = pConfig.icon;
  // In the new schema, we use partner_view and original thought to guide the partner
  const guidance = r.partner_view;

  return (
    <div className="space-y-6 animate-rise-in">
      {/* Header — what partner feels */}
      <div 
        className="premium-card p-6 sm:p-8 relative overflow-hidden" 
        style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '8px solid #d97757' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ backgroundColor: '#d97757' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#d9775710] flex items-center justify-center text-4xl shadow-inner shrink-0">
              {emotionEmoji[r.emotion.type] || '💭'}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#d97757]">Relationship Signal</p>
              <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>"{thought.thought_text}"</h3>
              <p className="text-xs font-semibold opacity-60">Expressed by {partnerName} on {new Date(thought.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {!thought.is_deleted && (
            <button 
              onClick={() => onResolve(thought.id)} 
              className="p-2.5 rounded-xl text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95 shadow-sm self-start"
              title="Mark as Resolved"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-[#d9775708] border-[#d9775730] text-[#d97757]">
              <PriorityIcon size={12} /> {pConfig.label} Priority Issue
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-purple-500/5 border-purple-500/20 text-purple-600">
              <Sparkles size={12} /> Emotion Score: {r.emotion.intensity}/10
            </div>
          </div>
        </div>

      {/* Resolved State */}
      {thought.is_deleted && (
        <div className="premium-card p-6 bg-emerald-500/5 border-2 border-emerald-500/20 animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-400">{partnerName} marked this as resolved.</p>
              <p className="text-xs opacity-70">Focus on maintaining this positive state.</p>
            </div>
          </div>
        </div>
      )}

      {/* The AI Insight Section */}
      <div className="premium-card p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '4px solid #8b5cf6' }}>
        <h4 className="label-clinical mb-4 flex items-center gap-2 text-purple-600">
          <Brain size={16} /> Heart Reading — AI Insight For You
        </h4>
        <div className="p-6 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 mb-6 group transition-all hover:bg-purple-100/50 dark:hover:bg-purple-800/20">
          <p className="text-lg font-bold leading-relaxed tracking-tight" style={{ color: 'var(--text-primary)' }}>
            "{guidance.insight}"
          </p>
          <p className="mt-4 text-xs font-semibold opacity-50 uppercase tracking-widest text-purple-700">Non-blaming emotional translation</p>
        </div>

        <div className="space-y-4">
          <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Immediate Solution</h5>
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-base font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>Your Action Plan:</p>
              <p className="text-sm font-bold leading-relaxed text-emerald-800 dark:text-emerald-400">{guidance.action}</p>
            </div>
            <Zap size={80} className="absolute -bottom-4 -right-4 opacity-10 text-emerald-400 rotate-12" />
          </div>
        </div>
      </div>

      {/* Shared Principles / Agreements */}
      {r.agreement.required && r.agreement.rules.length > 0 && (
        <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h4 className="label-clinical mb-5 flex items-center gap-2 text-[#d97757]">
            <Handshake size={16} /> Suggested Shared Promises
          </h4>
          <div className="grid gap-3">
            {r.agreement.rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border-l-4 border-l-[#d97757]">
                <div className="text-xs font-black text-[#d97757] shrink-0 mt-0.5">0{i + 1}</div>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Expectation Clarification */}
      <div className="premium-card p-6 bg-slate-900 text-white border-none shadow-2xl">
         <h4 className="label-clinical mb-3 flex items-center gap-2 text-slate-400">
            <Target size={14} className="text-slate-500" /> Root Requirement
          </h4>
          <p className="text-xl font-bold tracking-tight mb-2">"{r.hidden_expectation}"</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">This is what your partner truly needs in this moment.</p>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs font-medium italic opacity-40">"Always convert emotions into clarity, and clarity into action." — Expectation Resolver™</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION DISPLAY — Full action plan from selected thought
// ═══════════════════════════════════════════════════════════════

function RecommendationDisplay({ result, thought, onCopy, copied }: {
  result: RecommendationResult;
  thought: StoredThought;
  onCopy: (msg: string) => void;
  copied: boolean;
}) {
  const r = result;

  return (
    <div className="space-y-6 animate-rise-in">
      {/* Header */}
      <div
        className="premium-card p-6 sm:p-8 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '8px solid #8b5cf6' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ backgroundColor: '#8b5cf615', color: '#8b5cf6', border: '1px solid #8b5cf630' }}>
            <Sparkles size={11} className="mr-1.5" /> AI Recommendation Engine™
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-inner text-3xl">
              {emotionEmoji[thought.result?.emotion?.type || 'unknown'] || '💭'}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Full Strategy For</p>
              <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>"{thought.thought_text}"</p>
            </div>
          </div>
          <p className="text-sm font-bold leading-relaxed opacity-80" style={{ color: 'var(--text-secondary)' }}>
            {r.summary}
          </p>
        </div>
      </div>

      {/* Root Cause Analysis */}
      {r.root_cause && (
        <div className="premium-card p-6 border-2 border-dashed border-orange-200 dark:border-orange-900/40" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h4 className="label-clinical mb-3 flex items-center gap-2 text-orange-600">
            <Target size={16} /> Deep Psychological Root Cause
          </h4>
          <p className="text-base font-bold leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>{r.root_cause}</p>
        </div>
      )}

      {/* Immediate Steps */}
      <div className="grid sm:grid-cols-2 gap-5">
        {r.immediate_steps.length > 0 && (
          <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '4px solid #5c7c64' }}>
            <h4 className="label-clinical mb-6 flex items-center gap-2 text-emerald-600">
              <Zap size={16} /> Immediate De-escalation
            </h4>
            <div className="space-y-4">
              {r.immediate_steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-[10px] font-black text-emerald-600 border border-emerald-500/20">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{s.step}</p>
                    <p className="text-xs font-semibold mt-1 opacity-60">{s.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behavioral Changes */}
        {r.behavioral_changes.length > 0 && (
          <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '4px solid #d97757' }}>
            <h4 className="label-clinical mb-6 flex items-center gap-2 text-orange-600">
              <Footprints size={16} /> Behavioral Shifts
            </h4>
            <div className="space-y-4">
              {r.behavioral_changes.map((b, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-orange-100 dark:border-orange-900/20">
                  <p className="text-sm font-black mb-1.5" style={{ color: 'var(--text-primary)' }}>{b.change}</p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-70">
                    <span className="font-black text-orange-600/60 mr-1 uppercase">Sample:</span> {b.example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation Starters */}
      {r.conversation_starters.length > 0 && (
        <div className="premium-card p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '4px solid #8b5cf6' }}>
          <h4 className="label-clinical mb-6 flex items-center gap-2 text-purple-600">
            <MessageSquareText size={16} /> Soft-Entry Conversation Starters
          </h4>
          <div className="grid gap-3">
            {r.conversation_starters.map((msg, i) => (
              <div key={i} className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start justify-between gap-4 group transition-all hover:bg-purple-500/10">
                <div className="flex items-start gap-3">
                  <MessageCircle size={18} className="text-purple-400 shrink-0 mt-1" />
                  <p className="text-base font-bold italic tracking-tight" style={{ color: 'var(--text-primary)' }}>"{msg}"</p>
                </div>
                <button
                  onClick={() => onCopy(msg)}
                  className="p-2 rounded-xl bg-purple-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Plan & Avoidances */}
      <div className="grid sm:grid-cols-2 gap-5">
        {r.weekly_plan.length > 0 && (
          <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h4 className="label-clinical mb-5 flex items-center gap-2 text-blue-600">
              <Calendar size={16} /> 7-Day Resolution Cycle
            </h4>
            <div className="space-y-5">
              {r.weekly_plan.map((w, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0 font-black text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                      0{i + 1}
                    </div>
                    {i < r.weekly_plan.length - 1 && (
                      <div className="w-0.5 flex-1 bg-blue-500/10 rounded-full" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 mb-1.5 flex items-center gap-2">
                      <Clock size={10} /> {w.day}
                    </div>
                    <p className="text-sm font-extrabold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {w.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.things_to_avoid.length > 0 && (
          <div className="premium-card p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h4 className="label-clinical mb-5 flex items-center gap-2 text-red-600">
              <Ban size={16} /> Behavioral Roadblocks
            </h4>
            <div className="space-y-4">
              {r.things_to_avoid.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 group transition-all hover:bg-red-500/10">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Ban size={14} className="text-red-600" />
                  </div>
                  <p className="text-sm font-extrabold leading-tight text-red-900 dark:text-red-400">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Indicators */}
      {r.success_indicators.length > 0 && (
        <div className="premium-card p-6 bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[60px] rounded-full" />
          <h4 className="label-clinical mb-5 flex items-center gap-2 text-slate-400">
            <CheckCircle2 size={16} /> Positive Feedback Loops
          </h4>
          <div className="grid gap-2 relative z-10">
            {r.success_indicators.map((sign, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <p className="text-sm font-bold tracking-tight">{sign}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Encouragement */}
      {r.healing_message && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 mb-2 p-1.5 pr-4 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <HeartHandshake size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Growth Path</span>
          </div>
          <p className="max-w-md mx-auto text-base font-bold italic leading-relaxed text-slate-500">
            "{r.healing_message}"
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Recommendation Engine Selector
// ═══════════════════════════════════════════════════════════════

function RecommendationEngineSelector({
  allActiveThoughts,
  myThoughts,
  partnerThoughts,
  partnerProfile,
  selectedRecoThought,
  setSelectedRecoThought,
  selectedRecoThoughtObj,
  recoDropdownOpen,
  setRecoDropdownOpen,
  handleGenerateReco,
  isLoadingReco,
  recoResult,
  onCopy,
  copied,
  title,
  description,
  filter = 'all'
}: {
  allActiveThoughts: StoredThought[];
  myThoughts: StoredThought[];
  partnerThoughts: StoredThought[];
  partnerProfile: Profile | null;
  selectedRecoThought: string;
  setSelectedRecoThought: (id: string) => void;
  selectedRecoThoughtObj: StoredThought | null;
  recoDropdownOpen: boolean;
  setRecoDropdownOpen: (open: boolean) => void;
  handleGenerateReco: () => void;
  isLoadingReco: boolean;
  recoResult: RecommendationResult | null;
  onCopy: (msg: string) => void;
  copied: boolean;
  title: string;
  description: string;
  filter?: 'all' | 'mine' | 'partner';
}) {
  const showMine = filter === 'all' || filter === 'mine';
  const showPartner = filter === 'all' || filter === 'partner';

  return (
    <div className="space-y-6 animate-rise-in">
      <div
        className="premium-card p-6 sm:p-8 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '3px solid #8b5cf6' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/5 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-lg font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ListChecks size={20} style={{ color: '#8b5cf6' }} />
            {title}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>

          {/* Thought Selector Dropdown */}
          <div className="relative mb-5">
            <button
              onClick={() => setRecoDropdownOpen(!recoDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: recoDropdownOpen ? '#8b5cf6' : 'var(--border-primary)',
                color: selectedRecoThoughtObj ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {selectedRecoThoughtObj ? (
                  <>
                    <span className="text-lg shrink-0">{emotionEmoji[selectedRecoThoughtObj.result?.emotion?.type || 'unknown'] || '💭'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{selectedRecoThoughtObj.thought_text}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>by {selectedRecoThoughtObj.user_name} · {(priorityConfig[selectedRecoThoughtObj.priority] || priorityConfig.medium).label} priority</p>
                    </div>
                  </>
                ) : (
                  <span className="text-sm">Search or select a thought...</span>
                )}
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${recoDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Dropdown list */}
            {recoDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 max-h-[300px] overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
              >
                {allActiveThoughts.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No active thoughts recorded yet.</p>
                  </div>
                ) : (
                  <>
                    {/* My thoughts group */}
                    {showMine && myThoughts.filter(t => !t.is_deleted).length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>My Thoughts</p>
                        </div>
                        {myThoughts.filter(t => !t.is_deleted).map((t) => {
                          const pc = priorityConfig[t.priority] || priorityConfig.medium;
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedRecoThought(t.id); setRecoDropdownOpen(false); }}
                              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-[var(--bg-tertiary)]"
                              style={{ backgroundColor: selectedRecoThought === t.id ? 'var(--bg-tertiary)' : undefined }}
                            >
                              <span className="text-base shrink-0">{emotionEmoji[t.result?.emotion?.type || 'unknown'] || '💭'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.thought_text}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Partner's thoughts group */}
                    {showPartner && partnerThoughts.filter(t => !t.is_deleted).length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b border-t" style={{ borderColor: 'var(--border-primary)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#d97757' }}>{partnerProfile?.full_name || 'Partner'}'s Thoughts</p>
                        </div>
                        {partnerThoughts.filter(t => !t.is_deleted).map((t) => {
                          const pc = priorityConfig[t.priority] || priorityConfig.medium;
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedRecoThought(t.id); setRecoDropdownOpen(false); }}
                              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-[var(--bg-tertiary)]"
                              style={{ backgroundColor: selectedRecoThought === t.id ? 'var(--bg-tertiary)' : undefined }}
                            >
                              <span className="text-base shrink-0">{emotionEmoji[t.result?.emotion?.type || 'unknown'] || '💭'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.thought_text}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateReco}
            disabled={!selectedRecoThoughtObj || isLoadingReco}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#8b5cf6' }}
          >
            {isLoadingReco ? (
              <><RefreshCw size={16} className="animate-spin" /> Building Strategy…</>
            ) : (
              <><Sparkles size={16} /> Get AI Recommendations</>
            )}
          </button>
        </div>
      </div>

      {/* Recommendation Result Display Inline */}
      {(isLoadingReco || recoResult) && (
        <div className="animate-scale-in">
          {isLoadingReco ? (
            <div className="premium-card p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="inline-flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin" />
                  <Brain size={16} className="absolute inset-0 m-auto text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Building personalized recommendations…</p>
                  <p className="text-xs font-medium opacity-60">Analyzing root causes & generating action plan</p>
                </div>
              </div>
            </div>
          ) : recoResult && selectedRecoThoughtObj ? (
            <RecommendationDisplay
              result={recoResult}
              thought={selectedRecoThoughtObj}
              onCopy={onCopy}
              copied={copied}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
