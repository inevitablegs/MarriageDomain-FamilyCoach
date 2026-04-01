import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, RelationshipHealth } from '../lib/supabase';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type HealthTrackerProps = {
  onNavigate: (page: string) => void;
};

export function HealthTracker({ onNavigate }: HealthTrackerProps) {
  const { profile, loading: authLoading } = useAuth();
  const [healthRecords, setHealthRecords] = useState<RelationshipHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to track your relationship health</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    emotional_score: 50,
    communication_score: 50,
    intimacy_score: 50,
    conflict_score: 50,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHealthRecords();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const overallScore = Math.round(
        (formData.emotional_score +
          formData.communication_score +
          formData.intimacy_score +
          formData.conflict_score) / 4
      );

      const { error } = await supabase.from('relationship_health').insert({
        user_id: profile!.id,
        emotional_score: formData.emotional_score,
        communication_score: formData.communication_score,
        intimacy_score: formData.intimacy_score,
        conflict_score: formData.conflict_score,
        overall_score: overallScore,
        notes: formData.notes,
      });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        emotional_score: 50,
        communication_score: 50,
        intimacy_score: 50,
        conflict_score: 50,
        notes: '',
      });
      loadHealthRecords();
    } catch (error) {
      console.error('Error saving health record:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health records...</p>
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
    if (trend === 'up') return <TrendingUp className="text-green-500" size={20} />;
    if (trend === 'down') return <TrendingDown className="text-red-500" size={20} />;
    return <Minus className="text-gray-400" size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Relationship Health Tracker</h1>
            <p className="text-gray-600">Monitor and improve your relationship over time</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Record New Entry
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Health Check</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emotional Connection ({formData.emotional_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.emotional_score}
                    onChange={(e) => setFormData({ ...formData, emotional_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">How connected do you feel emotionally?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication Quality ({formData.communication_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.communication_score}
                    onChange={(e) => setFormData({ ...formData, communication_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">How well are you communicating?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intimacy Level ({formData.intimacy_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.intimacy_score}
                    onChange={(e) => setFormData({ ...formData, intimacy_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">How satisfied are you with intimacy?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict Management ({formData.conflict_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.conflict_score}
                    onChange={(e) => setFormData({ ...formData, conflict_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">How well are you handling conflicts?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Any thoughts or observations..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {latestRecord && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Current Health Score</h2>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">{latestRecord.overall_score}%</div>
                <p className="text-sm text-gray-500">
                  {new Date(latestRecord.recorded_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Emotional Connection</h3>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-blue-600">{latestRecord.emotional_score}%</span>
                    <TrendIcon trend={getTrend(latestRecord.emotional_score, previousRecord?.emotional_score)} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${latestRecord.emotional_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Communication</h3>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-green-600">{latestRecord.communication_score}%</span>
                    <TrendIcon trend={getTrend(latestRecord.communication_score, previousRecord?.communication_score)} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${latestRecord.communication_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-pink-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Intimacy</h3>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-pink-600">{latestRecord.intimacy_score}%</span>
                    <TrendIcon trend={getTrend(latestRecord.intimacy_score, previousRecord?.intimacy_score)} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${latestRecord.intimacy_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Conflict Management</h3>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-orange-600">{latestRecord.conflict_score}%</span>
                    <TrendIcon trend={getTrend(latestRecord.conflict_score, previousRecord?.conflict_score)} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${latestRecord.conflict_score}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {latestRecord.notes && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{latestRecord.notes}</p>
              </div>
            )}
          </div>
        )}

        {healthRecords.length > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">History</h2>
            <div className="space-y-4">
              {healthRecords.slice(1).map((record) => (
                <div key={record.id} className="border-l-4 border-gray-300 pl-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </p>
                    <p className="font-bold text-gray-700">{record.overall_score}%</p>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {healthRecords.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Heart className="text-gray-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Yet</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your relationship health to see trends and improvements over time.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Create First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
