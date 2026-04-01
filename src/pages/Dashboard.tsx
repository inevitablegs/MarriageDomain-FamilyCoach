import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, CompatibilityAssessment, RedFlag, RelationshipHealth } from '../lib/supabase';
import {
  Heart,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Calendar,
  Award,
  Activity,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AIRecommendations } from '../components/AIRecommendations';
import { AssessmentData, RedFlagData, HealthData } from '../lib/ai';

type DashboardProps = {
  onNavigate: (page: string) => void;
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<CompatibilityAssessment[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [healthRecords, setHealthRecords] = useState<RelationshipHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboardData();
  }, [profile?.id]);

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      const [assessmentsData, redFlagsData, healthData] = await Promise.all([
        supabase
          .from('compatibility_assessments')
          .select('*')
          .eq('user_id', profile.id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('red_flags')
          .select('*')
          .eq('user_id', profile.id)
          .order('detected_at', { ascending: false }),
        supabase
          .from('relationship_health')
          .select('*')
          .eq('user_id', profile.id)
          .order('recorded_at', { ascending: false })
          .limit(5),
      ]);

      if (assessmentsData.data) setAssessments(assessmentsData.data);
      if (redFlagsData.data) setRedFlags(redFlagsData.data);
      if (healthData.data) setHealthRecords(healthData.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const latestAssessment = assessments[0];
  const highSeverityFlags = redFlags.filter(f => f.severity === 'high').length;
  const latestHealth = healthRecords[0];
  const mediumSeverityFlags = redFlags.filter(f => f.severity === 'medium').length;
  const lowSeverityFlags = redFlags.filter(f => f.severity === 'low').length;

  const assessmentData: AssessmentData | undefined = latestAssessment
    ? {
        values_score: latestAssessment.values_score,
        lifestyle_score: latestAssessment.lifestyle_score,
        communication_score: latestAssessment.communication_score,
        total_score: latestAssessment.total_score,
        relationship_status: profile?.relationship_status || 'single',
      }
    : undefined;

  const redFlagData: RedFlagData | undefined = redFlags.length > 0
    ? {
        high_severity: redFlags.filter(f => f.severity === 'high').length,
        medium_severity: redFlags.filter(f => f.severity === 'medium').length,
        low_severity: redFlags.filter(f => f.severity === 'low').length,
        categories: [...new Set(redFlags.map(f => f.category))],
      }
    : undefined;

  const healthData: HealthData | undefined = latestHealth
    ? {
        emotional_score: latestHealth.emotional_score,
        communication_score: latestHealth.communication_score,
        intimacy_score: latestHealth.intimacy_score,
        conflict_score: latestHealth.conflict_score,
        overall_score: latestHealth.overall_score,
      }
    : undefined;

  const relationshipHealthLabel = latestHealth
    ? latestHealth.overall_score >= 80
      ? 'Strong'
      : latestHealth.overall_score >= 60
        ? 'Stable'
        : 'Needs Attention'
    : 'Not Tracked';

  const latestActivityDate = [
    assessments[0]?.completed_at,
    redFlags[0]?.detected_at,
    healthRecords[0]?.recorded_at,
  ]
    .filter(Boolean)
    .map((value) => new Date(String(value)).getTime())
    .sort((a, b) => b - a)[0];

  const assessmentHistory = assessments.map((assessment) => {
    const responses = assessment.responses as Record<string, unknown> | undefined;
    const reportSummary = (responses?.report_summary as Record<string, unknown> | undefined) || undefined;
    const categoryScores = (reportSummary?.category_scores as Record<string, number> | undefined) || undefined;

    return {
      ...assessment,
      weightedRisk: typeof reportSummary?.weighted_risk_percent === 'number' ? reportSummary.weighted_risk_percent : null,
      categoryScores,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 px-6 py-8 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-cyan-200 text-sm font-semibold tracking-wide uppercase">Relationship Command Center</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2">Welcome back, {profile?.full_name}</h1>
              <p className="text-cyan-100 mt-2">
                Status: <span className="font-semibold capitalize">{profile?.relationship_status}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 min-w-52">
              <p className="text-xs text-cyan-100 uppercase tracking-wide">Latest Activity</p>
              <p className="text-lg font-semibold mt-1">
                {latestActivityDate ? new Date(latestActivityDate).toLocaleString() : 'No activity yet'}
              </p>
            </div>
          </div>
        </div>

        {(assessmentData || redFlagData || healthData) && (
          <div className="mb-8">
            <AIRecommendations
              assessmentData={assessmentData}
              redFlagData={redFlagData}
              healthData={healthData}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ClipboardList className="text-blue-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{assessments.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Assessments Completed</h3>
            <p className="text-xs text-gray-500 mt-1">Track progress across repeated couple assessments.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{highSeverityFlags}</span>
            </div>
            <h3 className="text-gray-600 font-medium">High Priority Alerts</h3>
            <p className="text-xs text-gray-500 mt-1">Immediate areas needing focused intervention.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'}
              </span>
            </div>
            <h3 className="text-gray-600 font-medium">Latest Compatibility</h3>
            <p className="text-xs text-gray-500 mt-1">Weighted match from the most recent report.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-violet-100 p-3 rounded-xl">
                <Activity className="text-violet-600" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{relationshipHealthLabel}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Relationship Health</h3>
            <p className="text-xs text-gray-500 mt-1">
              {latestHealth ? `Overall ${latestHealth.overall_score}% from last health check.` : 'Start health tracking to monitor consistency.'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Heart className="text-rose-500" />
              <span>Quick Actions</span>
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('quiz')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition text-left flex items-center justify-between"
              >
                <span>Start Couple Assessment</span>
                <Award size={20} />
              </button>
              <button
                onClick={() => onNavigate('red-flags')}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-700 transition text-left flex items-center justify-between"
              >
                <span>Check for Red Flags</span>
                <AlertTriangle size={20} />
              </button>
              {profile?.relationship_status === 'married' && (
                <button
                  onClick={() => onNavigate('health-tracker')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition text-left flex items-center justify-between"
                >
                  <span>Track Relationship Health</span>
                  <TrendingUp size={20} />
                </button>
              )}
              <button
                onClick={() => onNavigate('services')}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-xl font-semibold hover:bg-blue-50 transition text-left flex items-center justify-between"
              >
                <span>Browse All Services</span>
                <Calendar size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            {assessments.length === 0 && redFlags.length === 0 && healthRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activity yet. Start by taking a compatibility quiz!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.slice(0, 3).map((assessment) => (
                  <div key={assessment.id} className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                    <p className="font-semibold text-gray-800">Compatibility Assessment</p>
                    <p className="text-sm text-gray-600">Score: {assessment.total_score}%</p>
                    <p className="text-xs text-gray-500">
                      {new Date(assessment.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {redFlags.slice(0, 2).map((flag) => (
                  <div key={flag.id} className="rounded-xl border border-red-100 bg-red-50/40 px-4 py-3">
                    <p className="font-semibold text-gray-800">Red Flag Detected</p>
                    <p className="text-sm text-gray-600">{flag.category}</p>
                    <p className="text-xs text-gray-500">
                      Severity: <span className="capitalize">{flag.severity}</span>
                    </p>
                  </div>
                ))}
                {healthRecords.slice(0, 2).map((health) => (
                  <div key={health.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                    <p className="font-semibold text-gray-800">Health Check-in</p>
                    <p className="text-sm text-gray-600">Overall: {health.overall_score}%</p>
                    <p className="text-xs text-gray-500">{new Date(health.recorded_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-800">Assessment Report History</h2>
            <button
              onClick={() => onNavigate('quiz')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Take New Assessment
            </button>
          </div>

          {assessmentHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <p className="text-gray-600 font-medium">No assessment reports yet.</p>
              <p className="text-sm text-gray-500 mt-1">Start your first couple assessment to build your report history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentHistory.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Report #{assessmentHistory.length - index}</p>
                      <p className="text-lg font-semibold text-slate-900">Compatibility: {item.total_score}%</p>
                      <p className="text-sm text-slate-600">{new Date(item.completed_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                        {item.assessment_type}
                      </span>
                      {item.weightedRisk !== null && (
                        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                          Weighted Risk {item.weightedRisk}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Values</p>
                      <p className="text-lg font-bold text-slate-900">{item.values_score}%</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Lifestyle</p>
                      <p className="text-lg font-bold text-slate-900">{item.lifestyle_score}%</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Communication</p>
                      <p className="text-lg font-bold text-slate-900">{item.communication_score}%</p>
                    </div>
                  </div>

                  {item.categoryScores && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Category Breakdown</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(item.categoryScores).map(([name, score]) => (
                          <span key={name} className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {name}: {score}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" /> Alert Distribution
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">High</span><span className="font-semibold text-red-700">{highSeverityFlags}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Medium</span><span className="font-semibold text-amber-700">{mediumSeverityFlags}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Low</span><span className="font-semibold text-emerald-700">{lowSeverityFlags}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-600" /> Performance Snapshot
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Values</p>
                <p className="text-2xl font-bold text-gray-900">{latestAssessment ? `${latestAssessment.values_score}%` : 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Lifestyle</p>
                <p className="text-2xl font-bold text-gray-900">{latestAssessment ? `${latestAssessment.lifestyle_score}%` : 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Communication</p>
                <p className="text-2xl font-bold text-gray-900">{latestAssessment ? `${latestAssessment.communication_score}%` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {redFlags.filter(f => f.severity === 'high').length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span>High Priority Warnings</span>
            </h3>
            <p className="text-red-700 mb-4">
              We've detected {highSeverityFlags} high-severity red flag(s) in your relationship.
              Consider booking a 1:1 session for personalized guidance.
            </p>
            <button
              onClick={() => onNavigate('services')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Get Expert Help
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
