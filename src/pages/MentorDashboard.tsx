import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  supabase,
  MentorAssignment,
  Mentor,
  Profile,
} from '../lib/supabase';
import {
  Users,
  MessageCircle,
  ArrowRight,
  Star,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { LiveChat } from '../components/LiveChat';

type MentorDashboardProps = {
  onNavigate: (page: string) => void;
};

type AssignedUser = {
  assignment: MentorAssignment;
  userProfile: Profile;
};

export function MentorDashboard({ onNavigate }: MentorDashboardProps) {
  const { profile } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatUser, setActiveChatUser] = useState<AssignedUser | null>(null);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      try {
        // Get mentor record for this user
        const { data: mentorData } = await supabase
          .from('mentors')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (mentorData) {
          setMentor(mentorData as Mentor);

          // Get assignments
          const { data: assignments } = await supabase
            .from('mentor_assignments')
            .select('*')
            .eq('mentor_id', (mentorData as Mentor).id)
            .eq('status', 'active');

          if (assignments && (assignments as MentorAssignment[]).length > 0) {
            // Load user profiles for each assignment
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('*');

            const profileMap = new Map<string, Profile>();
            if (allProfiles) {
              (allProfiles as Profile[]).forEach((p) => profileMap.set(p.id, p));
            }

            const users: AssignedUser[] = (assignments as MentorAssignment[])
              .map((assignment) => {
                const userProfile = profileMap.get(assignment.user_id);
                return userProfile ? { assignment, userProfile } : null;
              })
              .filter((x): x is AssignedUser => x !== null);

            setAssignedUsers(users);
          }
        }
      } catch (err) {
        console.error('Error loading mentor data:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile]);

  if (!profile) return null;

  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6' }}
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Loading mentor workspace…
          </p>
        </div>
      </div>
    );
  }

  // If a chat is active, show full-screen chat
  if (activeChatUser) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] py-6 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <LiveChat
            currentUserId={profile.id}
            currentUserName={mentor?.full_name || profile.full_name}
            otherUserId={activeChatUser.userProfile.id}
            otherUserName={activeChatUser.userProfile.full_name}
            assignmentId={activeChatUser.assignment.id}
            onBack={() => setActiveChatUser(null)}
            accentColor="#8b5cf6"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 px-8 py-12 shadow-2xl shadow-violet-900/20 sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-purple-400/10 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
              <Star size={13} className="mr-1.5" /> Mentor Dashboard
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Welcome, {mentor?.full_name || profile.full_name}
            </h1>
            <p className="mt-4 text-purple-100 text-lg max-w-xl leading-relaxed">
              {mentor?.specialization
                ? `Specialization: ${mentor.specialization}`
                : 'Connect with your assigned users and provide guidance on their relationship journey.'}
            </p>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid sm:grid-cols-3 gap-5">
          <MetricCard
            icon={<UserCheck size={22} />}
            label="Assigned Users"
            value={String(assignedUsers.length)}
            helper="Currently active"
            color="#8b5cf6"
          />
          <MetricCard
            icon={<MessageCircle size={22} />}
            label="Active Chats"
            value={String(assignedUsers.length)}
            helper="Conversations available"
            color="#7c3aed"
          />
          <MetricCard
            icon={<Users size={22} />}
            label="Status"
            value={mentor?.is_active ? 'Active' : 'Inactive'}
            helper="Your mentor status"
            color="#6d28d9"
          />
        </section>

        {/* Assigned Users */}
        <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2
            className="text-2xl font-extrabold mb-6 flex items-center gap-3"
            style={{ color: 'var(--text-primary)' }}
          >
            <Users className="text-violet-500" size={22} />
            Your Assigned Users
          </h2>

          {assignedUsers.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl border-2 border-dashed"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <Users size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                No users assigned yet
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                The admin will assign users to you. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedUsers.map((au) => (
                <UserCard
                  key={au.assignment.id}
                  user={au}
                  onChat={() => setActiveChatUser(au)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={15} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onChat }: { user: AssignedUser; onChat: () => void }) {
  return (
    <article
      className="premium-card p-6 flex flex-col transition-all hover:-translate-y-1"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}
        >
          {user.userProfile.full_name[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {user.userProfile.full_name}
          </p>
          <p
            className="text-xs font-medium capitalize truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {user.userProfile.relationship_status || 'User'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className="badge"
          style={{
            backgroundColor: user.assignment.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color: user.assignment.status === 'active' ? '#10b981' : '#d97706',
          }}
        >
          {user.assignment.status}
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Since {new Date(user.assignment.assigned_at).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={onChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm focus-ring"
          style={{ backgroundColor: '#8b5cf6' }}
        >
          <MessageCircle size={15} /> Chat <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  color: string;
}) {
  return (
    <article
      className="premium-card p-6 relative overflow-hidden group"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full opacity-20 -z-10 translate-x-1/2 -translate-y-1/2 transition-opacity group-hover:opacity-40 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="rounded-2xl p-3 shadow-inner"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {helper}
        </p>
      </div>
    </article>
  );
}
