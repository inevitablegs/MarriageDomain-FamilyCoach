import { useState } from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ServicesProps = {
  onAuthClick: () => void;
  onNavigate: (page: string) => void;
};

export function Services({ onAuthClick, onNavigate }: ServicesProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'pre_marriage' | 'post_marriage'>('pre_marriage');

  const preMarriageServices = [
    {
      name: 'Basic Compatibility Quiz',
      price: 0,
      isFree: true,
      description: 'Get a quick assessment of your relationship compatibility',
      features: [
        'Values alignment check',
        'Lifestyle compatibility',
        'Basic communication assessment',
        'Instant results',
      ],
    },
    {
      name: 'Advanced Compatibility Report',
      price: 499,
      isFree: false,
      description: 'Deep analysis with risk scoring and recommendations',
      features: [
        'Comprehensive personality analysis',
        'Detailed compatibility scoring',
        'Risk factor identification',
        'Personalized recommendations',
        'PDF report download',
      ],
    },
    {
      name: 'Red Flag Deep Analysis',
      price: 799,
      isFree: false,
      description: 'Identify potential warning signs early',
      features: [
        'Behavior pattern analysis',
        'Emotional maturity assessment',
        'Conflict style evaluation',
        'Warning indicators',
        '30-minute expert review',
      ],
    },
    {
      name: '1:1 Decision Clarity Session',
      price: 1999,
      isFree: false,
      description: 'Personal coaching to help you make the right decision',
      features: [
        '60-minute private session',
        'Expert marriage coach',
        'Personalized action plan',
        'Decision framework',
        'Follow-up email support',
      ],
    },
    {
      name: 'Pre-Marriage Readiness Program',
      price: 4999,
      isFree: false,
      description: 'Complete preparation for a successful marriage',
      features: [
        '8-week structured program',
        'Communication skills training',
        'Financial planning module',
        'Conflict resolution techniques',
        'Family integration guidance',
        'Lifetime resource access',
      ],
    },
    {
      name: 'Decision Confidence Score',
      price: 299,
      isFree: false,
      description: 'Final go/no-go indicator based on comprehensive analysis',
      features: [
        'All assessment data synthesis',
        'Clear confidence percentage',
        'Risk vs reward analysis',
        'Expert final recommendation',
      ],
    },
  ];

  const postMarriageServices = [
    {
      name: 'Conflict Resolution Program',
      price: 2999,
      isFree: false,
      description: 'Learn to handle disagreements constructively',
      features: [
        '4-week guided program',
        'Communication techniques',
        'De-escalation strategies',
        'Practice exercises',
        'Weekly coaching calls',
      ],
    },
    {
      name: 'Relationship Health Dashboard',
      price: 0,
      isFree: true,
      description: 'Track your relationship metrics over time',
      features: [
        'Weekly health check-ins',
        'Progress visualization',
        'Trend analysis',
        'Improvement suggestions',
      ],
    },
    {
      name: 'Emotional Intimacy Rebuild',
      price: 3999,
      isFree: false,
      description: 'Reconnect and deepen your emotional bond',
      features: [
        '6-week intensive program',
        'Vulnerability exercises',
        'Trust rebuilding activities',
        'Intimacy coaching',
        'Couple homework assignments',
      ],
    },
    {
      name: 'Crisis Recovery Plan',
      price: 7999,
      isFree: false,
      description: 'Emergency intervention for serious relationship issues',
      features: [
        'Immediate assessment',
        'Crisis intervention strategies',
        '4 emergency coaching sessions',
        '24/7 support access',
        'Customized recovery roadmap',
        '3-month follow-up',
      ],
    },
    {
      name: 'Premium Couple Coaching',
      price: 9999,
      isFree: false,
      description: 'Ongoing support for continuous growth',
      features: [
        'Monthly 1:1 sessions',
        'Personalized growth plans',
        'Priority support',
        'Resource library access',
        'Partner sessions available',
        '6-month commitment',
      ],
    },
  ];

  const services = selectedCategory === 'pre_marriage' ? preMarriageServices : postMarriageServices;

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the right support for your relationship journey
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => setSelectedCategory('pre_marriage')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedCategory === 'pre_marriage'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Before Marriage
            </button>
            <button
              onClick={() => setSelectedCategory('post_marriage')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedCategory === 'post_marriage'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              After Marriage
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                {service.isFree ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    FREE
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{service.price.toLocaleString()}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>

              <ul className="space-y-3 mb-8">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (user) {
                    onNavigate('dashboard');
                  } else {
                    onAuthClick();
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2"
              >
                {!user && !service.isFree && <Lock size={18} />}
                <span>{service.isFree ? 'Get Started' : user ? 'Book Now' : 'Sign In to Book'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
