import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Circle } from 'lucide-react';
import { supabase, ChatMessage } from '../lib/supabase';

type LiveChatProps = {
  currentUserId: string;
  currentUserName: string;
  otherUserId: string;
  otherUserName: string;
  assignmentId: string;
  onBack?: () => void;
  accentColor?: string;
};

export function LiveChat({
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
  assignmentId,
  onBack,
  accentColor = '#8b5cf6',
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('assignment_id', assignmentId);

    if (data) {
      const sorted = (data as ChatMessage[]).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sorted);
    }
  }, [assignmentId]);

  // Initial load + polling
  useEffect(() => {
    void loadMessages();
    const interval = setInterval(() => void loadMessages(), 2000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        assignment_id: assignmentId,
        message: text,
        timestamp: new Date().toISOString(),
        read: false,
      });
      setNewMessage('');
      await loadMessages();
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const dateStr = formatDate(msg.timestamp);
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groupedMessages.push({ date: dateStr, msgs: [] });
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  }

  return (
    <div
      className="flex flex-col rounded-[1.5rem] border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        height: '600px',
        maxHeight: '80vh',
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70 focus-ring"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {otherUserName[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {otherUserName}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <Circle size={7} fill="#22c55e" className="text-green-500" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <Send size={22} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
              >
                {group.date}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
            </div>

            {group.msgs.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                    style={
                      isMine
                        ? { backgroundColor: accentColor, color: '#fff' }
                        : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }
                    }
                  >
                    {!isMine && (
                      <p className="text-[10px] font-bold mb-0.5" style={{ color: accentColor }}>
                        {otherUserName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={`text-[10px] mt-1 text-right font-medium ${
                        isMine ? 'text-white/60' : ''
                      }`}
                      style={isMine ? {} : { color: 'var(--text-muted)' }}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message..."
            className="input-base flex-1 !py-3 !rounded-xl"
            style={{ fontSize: '14px' }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!newMessage.trim() || sending}
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-ring shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
