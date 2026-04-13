import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Mentor, MentorAssignment } from '../lib/supabase';
import { LiveChat } from '../components/LiveChat';
import { MessageCircleHeart, ArrowLeft } from 'lucide-react';

type ChatPageProps = {
  onNavigate: (page: string) => void;
};

export function ChatPage({ onNavigate }: ChatPageProps) {
  const { profile } = useAuth();
  const [assignedMentor, setAssignedMentor] = useState<Mentor | null>(null);
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        const { data: assignmentData } = await supabase
          .from('mentor_assignments')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'active');

        if (assignmentData && (assignmentData as MentorAssignment[]).length > 0) {
          const assignment = (assignmentData as MentorAssignment[])[0];
          setMentorAssignment(assignment);

          const { data: mentorData } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', assignment.mentor_id)
            .maybeSingle();

          if (mentorData) {
            setAssignedMentor(mentorData as Mentor);
          }
        }
      } catch (err) {
        console.error('Error loading chat data:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [profile]);

  if (!profile) return null;

  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center animate-pulse">
          <MessageCircleHeart size={40} className="mx-auto mb-4" style={{ color: '#d97757', opacity: 0.5 }} />
          <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!assignedMentor || !mentorAssignment) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-md text-center">
          <MessageCircleHeart size={64} className="mx-auto mb-6 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-extrabold mb-2 font-display" style={{ color: 'var(--text-primary)' }}>No Mentor Assigned</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>You don't have an active mentor assignment yet. Please wait for the admin to assign a mentor to your account.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
        <LiveChat
          currentUserId={profile.id}
          currentUserName={profile.full_name}
          otherUserId={assignedMentor.user_id} // Mentors have a user_id pointing to their auth profile
          otherUserName={assignedMentor.full_name}
          assignmentId={mentorAssignment.id}
          onBack={() => onNavigate('dashboard')}
          accentColor="#d97757"
        />
      </div>
    </div>
  );
}
