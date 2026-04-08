import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  Profile,
  Mentor,
  MentorAssignment,
} from '../lib/supabase';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Link2,
  ArrowLeft,
  X,
  Check,
  AlertCircle,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';

type AdminDashboardProps = {
  onNavigate: (page: string) => void;
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Mentor form
  const [showCreateMentor, setShowCreateMentor] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    email: '',
    password: '',
    fullName: '',
    specialization: '',
    bio: '',
  });
  const [showMentorPassword, setShowMentorPassword] = useState(false);
  const [mentorFormError, setMentorFormError] = useState('');
  const [mentorFormSuccess, setMentorFormSuccess] = useState('');
  const [creatingMentor, setCreatingMentor] = useState(false);

  // Assign Mentor modal
  const [assignModal, setAssignModal] = useState<{ userId: string; userName: string } | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'mentors' | 'users' | 'assignments'>('overview');

  const loadData = useCallback(async () => {
    try {
      const [profilesRes, mentorsRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('mentors').select('*'),
        supabase.from('mentor_assignments').select('*'),
      ]);

      if (profilesRes.data) setUsers((profilesRes.data as Profile[]).filter((p) => p.role !== 'admin'));
      if (mentorsRes.data) setMentors(mentorsRes.data as Mentor[]);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data as MentorAssignment[]);
    } catch (err) {
      console.error('Admin: failed to load data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateMentor = async () => {
    setMentorFormError('');
    setMentorFormSuccess('');

    if (!mentorForm.email || !mentorForm.password || !mentorForm.fullName) {
      setMentorFormError('Email, password, and full name are required.');
      return;
    }
    if (mentorForm.password.length < 6) {
      setMentorFormError('Password must be at least 6 characters.');
      return;
    }

    setCreatingMentor(true);
    try {
      // 1. Create user account via supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: mentorForm.email,
        password: mentorForm.password,
        options: { data: { full_name: mentorForm.fullName } },
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Failed to create user account');

      const userId = authData.user.id as string;

      // 2. Create profile with role=mentor
      await supabase.from('profiles').upsert(
        {
          id: userId,
          email: mentorForm.email,
          full_name: mentorForm.fullName,
          relationship_status: 'single',
          role: 'mentor',
        },
        { onConflict: 'id' }
      );

      // 3. Create mentor record
      await supabase.from('mentors').insert({
        user_id: userId,
        full_name: mentorForm.fullName,
        email: mentorForm.email,
        specialization: mentorForm.specialization || 'General',
        bio: mentorForm.bio || '',
        is_active: true,
      });

      // Sign out the mentor session (admin is not signed in via Supabase)
      // Since admin uses env-based auth, this sign-up created a session we need to clear
      await supabase.auth.signOut();

      setMentorFormSuccess(`Mentor "${mentorForm.fullName}" created successfully!`);
      setMentorForm({ email: '', password: '', fullName: '', specialization: '', bio: '' });
      await loadData();
    } catch (err) {
      setMentorFormError(err instanceof Error ? err.message : 'Failed to create mentor');
    } finally {
      setCreatingMentor(false);
    }
  };

  const handleAssignMentor = async () => {
    if (!assignModal || !selectedMentorId) return;

    setAssigning(true);
    try {
      // Deactivate any existing assignment for this user
      const existing = assignments.filter(
        (a) => a.user_id === assignModal.userId && a.status === 'active'
      );
      for (const a of existing) {
        await supabase
          .from('mentor_assignments')
          .update({ status: 'inactive' })
          .eq('id', a.id);
      }

      // Create new assignment
      await supabase.from('mentor_assignments').insert({
        user_id: assignModal.userId,
        mentor_id: selectedMentorId,
        assigned_at: new Date().toISOString(),
        status: 'active',
      });

      setAssignModal(null);
      setSelectedMentorId('');
      await loadData();
    } catch (err) {
      console.error('Failed to assign mentor:', err);
    } finally {
      setAssigning(false);
    }
  };

  const getMentorForUser = (userId: string) => {
    const assignment = assignments.find((a) => a.user_id === userId && a.status === 'active');
    if (!assignment) return null;
    return mentors.find((m) => m.id === assignment.mentor_id) || null;
  };

  const getUserCountForMentor = (mentorId: string) => {
    return assignments.filter((a) => a.mentor_id === mentorId && a.status === 'active').length;
  };

  const regularUsers = users.filter((u) => u.role !== 'mentor');

  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(100,116,139,0.2)', borderTopColor: '#64748b' }}
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Loading admin panel…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-800 via-zinc-700 to-slate-800 px-8 py-12 shadow-2xl sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
              <ShieldCheck size={13} className="mr-1.5" /> Admin Control Center
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="mt-4 text-slate-300 text-lg max-w-xl leading-relaxed">
              Manage mentors, assign coaches to users, and monitor platform activity.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid sm:grid-cols-4 gap-5">
          <StatCard icon={<Users size={22} />} label="Total Users" value={String(regularUsers.length)} color="#3b82f6" />
          <StatCard icon={<Star size={22} />} label="Mentors" value={String(mentors.length)} color="#8b5cf6" />
          <StatCard icon={<Link2 size={22} />} label="Active Assignments" value={String(assignments.filter((a) => a.status === 'active').length)} color="#10b981" />
          <StatCard icon={<ShieldCheck size={22} />} label="Platform Status" value="Online" color="#64748b" />
        </section>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 rounded-full border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
          {(['overview', 'mentors', 'users', 'assignments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize ${
                activeTab === tab ? 'text-white shadow-sm' : ''
              }`}
              style={
                activeTab === tab
                  ? { backgroundColor: '#475569', color: '#fff' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => { setActiveTab('mentors'); setShowCreateMentor(true); }}
                  className="w-full flex items-center justify-between rounded-xl px-5 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm focus-ring"
                  style={{ backgroundColor: '#8b5cf6' }}
                >
                  <span className="flex items-center gap-2"><UserPlus size={16} /> Create New Mentor</span>
                  <ArrowLeft size={15} className="rotate-180" />
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full flex items-center justify-between rounded-xl px-5 py-4 text-sm font-bold border transition-all hover:-translate-y-0.5 focus-ring"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span className="flex items-center gap-2"><Users size={16} /> View All Users</span>
                  <ArrowLeft size={15} className="rotate-180" />
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="w-full flex items-center justify-between rounded-xl px-5 py-4 text-sm font-bold border transition-all hover:-translate-y-0.5 focus-ring"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span className="flex items-center gap-2"><Link2 size={16} /> Manage Assignments</span>
                  <ArrowLeft size={15} className="rotate-180" />
                </button>
              </div>
            </section>

            {/* Recent activity */}
            <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>
                Platform Summary
              </h2>
              <div className="space-y-4">
                <SummaryRow label="Registered Users" value={String(regularUsers.length)} />
                <SummaryRow label="Active Mentors" value={String(mentors.filter((m) => m.is_active).length)} />
                <SummaryRow label="Active Assignments" value={String(assignments.filter((a) => a.status === 'active').length)} />
                <SummaryRow label="Unassigned Users" value={String(regularUsers.filter((u) => !getMentorForUser(u.id)).length)} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mentors' && (
          <section className="space-y-6">
            {/* Create Mentor */}
            <div className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  <UserPlus className="text-violet-500" size={22} />
                  {showCreateMentor ? 'Create New Mentor' : 'Mentors'}
                </h2>
                <button
                  onClick={() => { setShowCreateMentor(!showCreateMentor); setMentorFormError(''); setMentorFormSuccess(''); }}
                  className="text-sm font-bold px-4 py-2 rounded-lg transition-colors focus-ring"
                  style={{ color: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)' }}
                >
                  {showCreateMentor ? 'Cancel' : '+ New Mentor'}
                </button>
              </div>

              {showCreateMentor && (
                <div className="animate-fade-in space-y-4 mb-8 p-6 rounded-2xl border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name *</label>
                      <input
                        type="text"
                        value={mentorForm.fullName}
                        onChange={(e) => setMentorForm({ ...mentorForm, fullName: e.target.value })}
                        className="input-base"
                        placeholder="Dr. Priya Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Email *</label>
                      <input
                        type="email"
                        value={mentorForm.email}
                        onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                        className="input-base"
                        placeholder="mentor@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Password *</label>
                      <div className="relative">
                        <input
                          type={showMentorPassword ? 'text' : 'password'}
                          value={mentorForm.password}
                          onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                          className="input-base pr-11"
                          placeholder="••••••••"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowMentorPassword(!showMentorPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {showMentorPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Specialization</label>
                      <input
                        type="text"
                        value={mentorForm.specialization}
                        onChange={(e) => setMentorForm({ ...mentorForm, specialization: e.target.value })}
                        className="input-base"
                        placeholder="Marriage Counseling, Conflict Resolution..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Bio</label>
                    <input
                      type="text"
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                      className="input-base"
                      placeholder="Brief description of the mentor..."
                    />
                  </div>

                  {mentorFormError && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm animate-fade-in"
                      style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}>
                      <AlertCircle size={17} className="shrink-0 mt-0.5" />
                      <p className="font-medium">{mentorFormError}</p>
                    </div>
                  )}

                  {mentorFormSuccess && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3 border text-sm animate-fade-in"
                      style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                      <Check size={17} className="shrink-0 mt-0.5" />
                      <p className="font-medium">{mentorFormSuccess}</p>
                    </div>
                  )}

                  <button
                    onClick={() => void handleCreateMentor()}
                    disabled={creatingMentor}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                    style={{ backgroundColor: '#8b5cf6' }}
                  >
                    {creatingMentor ? 'Creating…' : 'Create Mentor Account'}
                  </button>
                </div>
              )}

              {/* Mentors list */}
              {mentors.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                  <Star size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    No mentors created yet. Click "+ New Mentor" to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                        <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Name</th>
                        <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</th>
                        <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Specialization</th>
                        <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Users</th>
                        <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mentors.map((m) => (
                        <tr key={m.id} className="border-b transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                          <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                                {m.full_name[0]?.toUpperCase()}
                              </div>
                              {m.full_name}
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{m.email}</td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{m.specialization}</td>
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>{getUserCountForMentor(m.id)}</td>
                          <td className="py-3 px-4">
                            <span className="badge" style={{
                              backgroundColor: m.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: m.is_active ? '#10b981' : '#ef4444',
                            }}>
                              {m.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Users className="text-blue-500" size={22} />
              All Users ({regularUsers.length})
            </h2>

            {regularUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                <Users size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No users registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                      <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>User</th>
                      <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</th>
                      <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Assigned Mentor</th>
                      <th className="text-left py-3 px-4 font-bold uppercase text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularUsers.map((u) => {
                      const assignedMentor = getMentorForUser(u.id);
                      return (
                        <tr key={u.id} className="border-b transition-colors" style={{ borderColor: 'var(--border-primary)' }}>
                          <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                {u.full_name[0]?.toUpperCase() || 'U'}
                              </div>
                              {u.full_name}
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="badge capitalize" style={{
                              backgroundColor: u.relationship_status === 'married' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                              color: u.relationship_status === 'married' ? '#10b981' : '#6366f1',
                            }}>
                              {u.relationship_status}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: assignedMentor ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {assignedMentor ? (
                              <span className="font-semibold">{assignedMentor.full_name}</span>
                            ) : (
                              <span className="italic">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => { setAssignModal({ userId: u.id, userName: u.full_name }); setSelectedMentorId(''); }}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors focus-ring"
                              style={{ color: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)' }}
                            >
                              {assignedMentor ? 'Reassign' : 'Assign'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'assignments' && (
          <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Link2 className="text-emerald-500" size={22} />
              Mentor Assignments ({assignments.filter((a) => a.status === 'active').length} active)
            </h2>

            {assignments.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                <Link2 size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No assignments yet. Go to Users tab to assign mentors.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments
                  .filter((a) => a.status === 'active')
                  .map((a) => {
                    const user = users.find((u) => u.id === a.user_id);
                    const mentor = mentors.find((m) => m.id === a.mentor_id);
                    return (
                      <div
                        key={a.id}
                        className="premium-card p-5"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {user?.full_name[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>User</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ backgroundColor: 'rgba(139,92,246,0.06)' }}>
                          <Link2 size={12} style={{ color: '#8b5cf6' }} />
                          <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>assigned to</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                            {mentor?.full_name[0]?.toUpperCase() || 'M'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{mentor?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Mentor</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* Back */}
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

      {/* Assign Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: 'rgba(8,12,20,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setAssignModal(null)}
        >
          <div
            className="premium-card p-8 w-full max-w-md animate-scale-in"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Assign Mentor
              </h3>
              <button onClick={() => setAssignModal(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Assign a mentor to <strong style={{ color: 'var(--text-primary)' }}>{assignModal.userName}</strong>
            </p>

            {mentors.length === 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                No mentors available. Create one first.
              </p>
            ) : (
              <>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="input-base mb-5"
                >
                  <option value="">Select a mentor…</option>
                  {mentors.filter((m) => m.is_active).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} — {m.specialization} ({getUserCountForMentor(m.id)} users)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => void handleAssignMentor()}
                  disabled={!selectedMentorId || assigning}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                  style={{ backgroundColor: '#8b5cf6' }}
                >
                  {assigning ? 'Assigning…' : 'Confirm Assignment'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <article className="premium-card p-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full opacity-20 -z-10 translate-x-1/2 -translate-y-1/2 transition-opacity group-hover:opacity-40 pointer-events-none" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between mb-4">
        <div className="rounded-2xl p-3 shadow-inner" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
