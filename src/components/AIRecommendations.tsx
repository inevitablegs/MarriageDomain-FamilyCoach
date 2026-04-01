import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getAIRecommendations, AssessmentData, RedFlagData, HealthData } from '../lib/ai';

type AIRecommendationsProps = {
  assessmentData?: AssessmentData;
  redFlagData?: RedFlagData;
  healthData?: HealthData;
};

export function AIRecommendations({ assessmentData, redFlagData, healthData }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [assessmentData, redFlagData, healthData]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getAIRecommendations(assessmentData, redFlagData, healthData);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">AI-Powered Insights</h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
          <div className="h-4 bg-blue-200 rounded w-5/6"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="text-blue-600" size={24} />
        <h3 className="text-lg font-bold text-gray-800">AI-Powered Recommendations</h3>
      </div>
      <ul className="space-y-3">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start space-x-3">
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </span>
            <span className="text-gray-700 leading-relaxed">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
