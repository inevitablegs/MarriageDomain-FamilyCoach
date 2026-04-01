import { Heart, Shield, Users, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LandingProps = {
  onNavigate: (page: string) => void;
  onAuthClick: () => void;
};

export function Landing({ onNavigate, onAuthClick }: LandingProps) {
  const { user } = useAuth();

  const handleCTAClick = () => {
    if (user) {
      onNavigate('quiz');
    } else {
      onAuthClick();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Build a Marriage That Lasts
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Expert guidance for couples before and after marriage. Make informed decisions,
            strengthen your bond, and navigate challenges with confidence.
          </p>
          <button
            onClick={handleCTAClick}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {user ? 'Take Free Quiz' : 'Get Started Free'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Heart className="text-blue-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Before Marriage</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Make the right decision with compatibility assessments, red flag detection,
              and personalized guidance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Compatibility Quiz</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Red Flag Analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Decision Confidence Score</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Shield className="text-green-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">After Marriage</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Navigate challenges, improve communication, and keep your relationship
              thriving through all seasons.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Conflict Resolution</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Health Tracking</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Expert Coaching</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Users className="text-orange-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Personalized Support</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Get AI-powered insights and one-on-one coaching tailored to your unique
              relationship dynamics.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">AI Recommendations</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">1:1 Coaching Sessions</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Couple Workshops</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 mb-20 border-l-4 border-red-500">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Common Mistakes That Lead to Divorce
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="font-semibold text-red-700 mb-1">High Severity</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Choosing based on looks alone</li>
                    <li>• Ignoring fundamental red flags</li>
                    <li>• Values and belief misalignment</li>
                    <li>• Emotional immaturity issues</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-orange-700 mb-1">Medium Severity</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Family pressure decisions</li>
                    <li>• Poor communication skills</li>
                    <li>• Financial transparency issues</li>
                    <li>• Lifestyle mismatch</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => onNavigate('services')}
                className="mt-4 text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                Learn how to avoid these mistakes →
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Take our free compatibility quiz or explore our premium services designed
            to strengthen your relationship at every stage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCTAClick}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Take Free Quiz
            </button>
            <button
              onClick={() => onNavigate('services')}
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              View All Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
