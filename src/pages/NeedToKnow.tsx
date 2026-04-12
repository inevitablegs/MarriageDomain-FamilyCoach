import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Sparkles, Send, Bot, AlertCircle, ChevronRight, History, Trash2, X, Clock } from 'lucide-react';
import { NEED_TO_KNOW_CATEGORIES } from '../lib/needToKnowContent';
import { askLiveGeminiQuestion, ChatMessageDto } from '../lib/needToKnowAi';
import { useAuth } from '../contexts/AuthContext';
import { supabase, NeedToKnowChatSession } from '../lib/supabase';

type NeedToKnowProps = {
  onNavigate: (page: string) => void;
};

// Extremely robust text parser since we avoid external dependencies for this UI constraint
function renderMarkdown(text: string) {
  const blocks = text.split('\n\n');
  return blocks.map((block, bIdx) => {
    if (block.startsWith('## ')) {
      return <h2 key={bIdx} className="text-2xl sm:text-3xl font-extrabold mb-6 mt-8 tracking-tight" style={{ color: 'var(--text-primary)' }}>{block.replace('## ', '')}</h2>;
    }
    if (block.startsWith('### ')) {
      return <h3 key={bIdx} className="text-xl font-bold mb-3 mt-8" style={{ color: 'var(--text-primary)' }}>{block.replace('### ', '')}</h3>;
    }
    
    // Custom handling for Sub-points
    if (block.startsWith('Sub-points:')) {
      const lines = block.split('\n');
      return (
        <div key={bIdx} className="mb-6">
          <p className="font-semibold text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>{lines[0]}</p>
          <ul className="space-y-2 ml-2">
            {lines.slice(1).map((item, i) => {
              const cleanItem = item.replace(/^-\s*/, '');
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></div>
                  <div className="leading-relaxed font-medium text-[15px] text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: parseInline(cleanItem) }} />
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    
    // Handling generic lists if they start with dashes
    if (block.startsWith('- ')) {
       const items = block.split('\n');
       return (
        <ul key={bIdx} className="space-y-3 mb-6 ml-4">
          {items.map((item, i) => {
            const cleanItem = item.replace(/^-\s/, '');
            return (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></div>
                <div className="leading-relaxed font-medium text-[15px] text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: parseInline(cleanItem) }} />
              </li>
            );
          })}
        </ul>
      );
    }

    // Default paragraph (handles 👉 icons beautifully)
    return (
      <p key={bIdx} className={`mb-5 leading-relaxed font-medium text-[15.5px] ${block.startsWith('👉 Core risk:') ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50' : 'text-slate-600 dark:text-slate-400'}`} dangerouslySetInnerHTML={{ __html: parseInline(block) }} />
    );
  });
}

function parseInline(str: string): string {
  // Bold
  let s = str.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 800;">$1</strong>');
  // Italic
  s = s.replace(/\*(.*?)\*/g, '<em style="color: var(--text-primary);">$1</em>');
  // Handle the 👉 icon to make it bold and colorized
  s = s.replace(/👉/g, '<span class="text-violet-500 mr-1 text-lg">👉</span>');
  return s;
}

// Compact markdown renderer optimized for chat bubble output
function renderChatMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentList: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length === 0) return;
    elements.push(
      <ul key={key} className="space-y-1.5 my-2 ml-1">
        {currentList.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0"></div>
            <span className="text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: parseChatInline(item) }} />
          </li>
        ))}
      </ul>
    );
    currentList = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`list-${i}`);
      return;
    }
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^(?:-|\d+\.)\s*/, ''));
      return;
    }
    flushList(`list-${i}`);
    if (trimmed.startsWith('## ')) {
      elements.push(<h4 key={i} className="text-base font-extrabold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>{trimmed.replace('## ', '')}</h4>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h5 key={i} className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--text-primary)' }}>{trimmed.replace('### ', '')}</h5>);
    } else {
      elements.push(<p key={i} className="text-[14px] leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: parseChatInline(trimmed) }} />);
    }
  });
  flushList('list-end');
  return elements;
}

function parseChatInline(str: string): string {
  let s = str.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;">$1</strong>');
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  s = s.replace(/`(.*?)`/g, '<code style="background:rgba(139,92,246,0.1);padding:1px 5px;border-radius:4px;font-size:13px;">$1</code>');
  return s;
}

export function NeedToKnow({ onNavigate }: NeedToKnowProps) {
  const { profile } = useAuth();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(NEED_TO_KNOW_CATEGORIES[0].id);
  
  const [sessions, setSessions] = useState<Record<string, NeedToKnowChatSession>>({});
  const [currentQuery, setCurrentQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [archivedChats, setArchivedChats] = useState<NeedToKnowChatSession[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const aiModuleRef = useRef<HTMLDivElement>(null);
  const prevChatLengthRef = useRef(0);

  const activeCategory = useMemo(() => NEED_TO_KNOW_CATEGORIES.find(c => c.id === activeCategoryId)!, [activeCategoryId]);
  const activeSessionRow = sessions[activeCategoryId];
  const activeChat = activeSessionRow?.messages || [];

  // Load chat history from Database on mount
  useEffect(() => {
    if (!profile) return;
    
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from('need_to_know_chats')
        .select('*')
        .eq('user_id', profile.id);
        
      if (!error && data) {
        const sessionMap: Record<string, NeedToKnowChatSession> = {};
        (data as NeedToKnowChatSession[]).forEach(s => {
          sessionMap[s.category_id] = s;
        });
        setSessions(sessionMap);
      }
    };
    
    void loadSessions();
  }, [profile]);

  // Scroll to top of main content when changing categories
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeCategoryId]);

  // Observer to track if AI module is in view to toggle the FAB
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show FAB when AI module is NOT intersecting (i.e. scrolled away)
        setShowFab(!entry.isIntersecting);
      },
      { root: null, threshold: 0.05 }
    );
    
    if (aiModuleRef.current) observer.observe(aiModuleRef.current);
    return () => observer.disconnect();
  }, [activeCategoryId]);

  // Scroll chat to bottom only when genuinely actively chatting
  useEffect(() => {
    if (activeChat.length > prevChatLengthRef.current || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevChatLengthRef.current = activeChat.length;
  }, [activeChat.length, isTyping]);

  const handleClearChat = async () => {
    if (!profile || activeChat.length === 0) return;
    
    // Archive the current session before clearing
    if (activeSessionRow) {
      const archived: NeedToKnowChatSession = {
        ...activeSessionRow,
        id: `archived_${Date.now()}`,
        updated_at: new Date().toISOString()
      };
      await supabase.from('need_to_know_chats').insert(archived as any);
    }
    
    // Clear current session messages
    const clearedSession: NeedToKnowChatSession = {
      id: activeSessionRow?.id || `cs_${Date.now()}`,
      user_id: profile.id,
      category_id: activeCategoryId,
      messages: [],
      updated_at: new Date().toISOString()
    };
    setSessions(prev => ({ ...prev, [activeCategoryId]: clearedSession }));
    await supabase.from('need_to_know_chats').upsert(clearedSession as any);
  };

  const loadArchivedHistory = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('need_to_know_chats')
      .select('*')
      .eq('user_id', profile.id)
      .eq('category_id', activeCategoryId);
    if (data) {
      const archived = (data as NeedToKnowChatSession[]).filter(s => s.id.startsWith('archived_') && s.messages.length > 0);
      setArchivedChats(archived);
    }
    setShowHistoryModal(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || isTyping || !profile) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: currentQuery, created_at: new Date().toISOString() };
    
    const currentMessages = [...activeChat];
    currentMessages.push(userMessage);

    setSessions(prev => ({
      ...prev,
      [activeCategoryId]: {
        ...(prev[activeCategoryId] || { id: `cs_${Date.now()}`, user_id: profile.id, category_id: activeCategoryId, updated_at: new Date().toISOString() }),
        messages: currentMessages,
      }
    }));
    
    setCurrentQuery('');
    setIsTyping(true);

    try {
      const historyToPass: ChatMessageDto[] = activeChat.map(m => ({ role: m.role, content: m.content }));
      const aiResponseContent = await askLiveGeminiQuestion(activeCategoryId, historyToPass, userMessage.content);
      
      const assistantMessage = { id: Date.now().toString(), role: 'assistant' as const, content: aiResponseContent, created_at: new Date().toISOString() };
      const finalMessages = [...currentMessages, assistantMessage];
      
      const newSession: NeedToKnowChatSession = {
        id: activeSessionRow?.id || `cs_${Date.now()}`,
        user_id: profile.id,
        category_id: activeCategoryId,
        messages: finalMessages,
        updated_at: new Date().toISOString()
      };

      setSessions(prev => ({ ...prev, [activeCategoryId]: newSession }));
      await supabase.from('need_to_know_chats').upsert(newSession as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] flex flex-col md:flex-row transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r overflow-y-auto" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="p-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity mb-8"
            style={{ color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 mb-6" style={{ color: '#8b5cf6' }}>
            <AlertCircle size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Structural Dangers</h2>
          </div>

          <div className="space-y-2">
            {NEED_TO_KNOW_CATEGORIES.map(category => {
              const hasHistory = !!sessions[category.id] && sessions[category.id].messages.length > 0;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all font-bold ${
                    activeCategoryId === category.id 
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="flex-1 pr-2">{category.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasHistory && <History size={14} className={activeCategoryId === category.id ? 'opacity-80' : 'opacity-40'} />}
                      {activeCategoryId === category.id && <ChevronRight size={16} />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={mainScrollRef} className="flex-1 overflow-y-auto h-[calc(100vh-68px)]">
        <div className="max-w-4xl mx-auto p-6 sm:p-10 lg:p-12 animate-fade-in">
          
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl sm:leading-tight font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              {activeCategory.title}
            </h1>
            <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>
              {activeCategory.shortDesc}
            </p>

            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none pr-4">
               {renderMarkdown(activeCategory.extensiveContent)}
            </div>
          </div>

          {/* Ask AI Contextual Module */}
          <div ref={aiModuleRef} className="premium-card overflow-hidden flex flex-col h-[500px] mt-8" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '4px solid #8b5cf6' }}>
             <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-violet-50 dark:bg-violet-950/20" style={{ borderColor: 'var(--border-primary)' }}>
               <div className="flex items-center gap-2">
                 <Bot size={18} className="text-violet-600 dark:text-violet-400" />
                 <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Live AI Analysis</h3>
               </div>
               <div className="flex items-center gap-2">
                 <button
                   onClick={loadArchivedHistory}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
                 >
                   <Clock size={12} /> {activeChat.length > 0 ? 'Memory Active' : 'Past Sessions'}
                 </button>
                 {activeChat.length > 0 && (
                   <button
                     onClick={handleClearChat}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                   >
                     <Trash2 size={12} /> Clear
                   </button>
                 )}
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
               {activeChat.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center px-4">
                   <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-4">
                     <Sparkles size={28} className="text-violet-600 dark:text-violet-400" />
                   </div>
                   <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Specific Scenario Inquiry</h3>
                   <p className="text-sm font-medium max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                     Ask a specific question regarding '{activeCategory.title}'. The AI retains the memory of the conversation.
                   </p>
                 </div>
               ) : (
                 activeChat.map((msg) => (
                   <div key={msg.id} className={`flex max-w-[88%] ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                     {msg.role === 'assistant' && (
                       <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0 mr-3 mt-1">
                         <Bot size={16} className="text-violet-600 dark:text-violet-400" />
                       </div>
                     )}
                     <div className={`p-4 sm:p-5 rounded-2xl shadow-sm ${
                       msg.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-tr-sm text-[15px]' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700/50'
                     }`}>
                       {msg.role === 'assistant' 
                          ? renderChatMarkdown(msg.content)
                          : <p className="font-medium leading-relaxed">{msg.content}</p>
                       }
                     </div>
                   </div>
                 ))
               )}
               {isTyping && (
                 <div className="mr-auto flex items-start max-w-[85%]">
                   <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0 mr-3 mt-1">
                     <Bot size={16} className="text-violet-600 dark:text-violet-400" />
                   </div>
                   <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 rounded-tl-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 h-12">
                     <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                 </div>
               )}
               <div ref={chatEndRef} />
             </div>

             <div className="p-4 border-t bg-slate-50 dark:bg-slate-900" style={{ borderColor: 'var(--border-primary)' }}>
               <form onSubmit={handleSendMessage} className="relative">
                 <input 
                   type="text"
                   value={currentQuery}
                   onChange={(e) => setCurrentQuery(e.target.value)}
                   placeholder="Detail your exact situation and strictly probe the AI..."
                   className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-5 pr-14 py-4 text-[15px] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-400"
                   disabled={isTyping}
                 />
                 <button 
                   type="submit"
                   disabled={isTyping || !currentQuery.trim()}
                   className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-violet-600 text-white rounded-lg shadow hover:bg-violet-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                 >
                   <Send size={18} />
                 </button>
               </form>
             </div>
          </div>
          
        </div>
      </div>
      
      {/* Floating Ask AI Button */}
      <button
        onClick={() => aiModuleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full shadow-2xl transition-all duration-300 transform ${
          showFab 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-16 opacity-0 scale-90 pointer-events-none'
        } focus-ring`}
      >
        <Bot size={20} className="animate-pulse" /> Ask AI
      </button>

      {/* Archived History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div 
            className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2">
                <History size={18} className="text-violet-500" />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Cleared Chat History</h2>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[65vh] p-5 space-y-6">
              {archivedChats.length === 0 ? (
                <div className="text-center py-12">
                  <History size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No cleared chat history for this topic yet.</p>
                </div>
              ) : (
                archivedChats.map((session, sIdx) => (
                  <div key={session.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Session {sIdx + 1} · {new Date(session.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full" style={{ color: 'var(--text-secondary)' }}>
                        {session.messages.length} messages
                      </span>
                    </div>
                    <div className="space-y-3">
                      {session.messages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-xl text-[13px] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-violet-600 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                          }`}>
                            {msg.role === 'assistant' ? renderChatMarkdown(msg.content) : <p className="font-medium">{msg.content}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
