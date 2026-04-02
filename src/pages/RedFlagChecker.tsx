import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type RedFlagCheckerProps = {
  onNavigate: (page: string) => void;
};

type RedFlagQuestion = {
  id: string;
  category: string;
  question: string;
  severity: 'high' | 'medium' | 'low';
};

const redFlagQuestions: RedFlagQuestion[] = [
  {
    id: 'rf1',
    category: 'Emotional Control',
    question: 'Does your partner frequently lose their temper or have angry outbursts?',
    severity: 'high',
  },
  {
    id: 'rf2',
    category: 'Respect',
    question: 'Does your partner belittle, criticize, or mock you in front of others?',
    severity: 'high',
  },
  {
    id: 'rf3',
    category: 'Control',
    question: 'Does your partner try to control who you see or how you spend your time?',
    severity: 'high',
  },
  {
    id: 'rf4',
    category: 'Honesty',
    question: 'Have you caught your partner in significant lies or deception?',
    severity: 'high',
  },
  {
    id: 'rf5',
    category: 'Addiction',
    question: 'Does your partner have substance abuse or addiction issues they refuse to address?',
    severity: 'high',
  },
  {
    id: 'rf6',
    category: 'Financial',
    question: 'Does your partner hide financial information or have secret debts?',
    severity: 'medium',
  },
  {
    id: 'rf7',
    category: 'Communication',
    question: 'Does your partner give you the silent treatment or refuse to communicate during conflicts?',
    severity: 'medium',
  },
  {
    id: 'rf8',
    category: 'Family Pressure',
    question: 'Are you being pressured into this relationship by family or society?',
    severity: 'medium',
  },
  {
    id: 'rf9',
    category: 'Values',
    question: 'Do you have fundamentally different views on important life decisions?',
    severity: 'medium',
  },
  {
    id: 'rf10',
    category: 'Past Behavior',
    question: 'Has your partner shown a pattern of dishonesty in past relationships?',
    severity: 'medium',
  },
  {
    id: 'rf11',
    category: 'Lifestyle',
    question: 'Do you feel like you have to change who you are to make the relationship work?',
    severity: 'low',
  },
  {
    id: 'rf12',
    category: 'Compatibility',
    question: 'Do you have significantly different expectations about daily life?',
    severity: 'low',
  },
];

export function RedFlagChecker({ onNavigate }: RedFlagCheckerProps) {
  const { profile, loading } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
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

  const handleAnswer = async (answer: boolean) => {
    const newAnswers = { ...answers, [redFlagQuestions[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < redFlagQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await saveResults(newAnswers);
    }
  };

  const saveResults = async (finalAnswers: Record<string, boolean>) => {
    setSaving(true);
    try {
      const detectedFlags = redFlagQuestions.filter(q => finalAnswers[q.id] === true);

      for (const flag of detectedFlags) {
        await supabase.from('red_flags').insert({
          user_id: profile!.id,
          category: flag.category,
          severity: flag.severity,
          description: flag.question,
        });
      }

      setShowResults(true);
    } catch (error) {
      console.error('Error saving red flags:', error);
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const detectedFlags = redFlagQuestions.filter(q => answers[q.id] === true);
    const highSeverity = detectedFlags.filter(f => f.severity === 'high').length;
    const mediumSeverity = detectedFlags.filter(f => f.severity === 'medium').length;
    const lowSeverity = detectedFlags.filter(f => f.severity === 'low').length;

    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {highSeverity > 0 ? (
                <>
                  <XCircle className="text-red-500 mx-auto mb-4" size={64} />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Critical Warnings Detected
                  </h2>
                  <p className="text-gray-600">We found {detectedFlags.length} potential red flags</p>
                </>
              ) : detectedFlags.length > 0 ? (
                <>
                  <AlertTriangle className="text-orange-500 mx-auto mb-4" size={64} />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Areas of Concern
                  </h2>
                  <p className="text-gray-600">We found {detectedFlags.length} items to address</p>
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Looking Good!
                  </h2>
                  <p className="text-gray-600">No major red flags detected</p>
                </>
              )}
            </div>

            <div className="space-y-6 mb-8">
              {highSeverity > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="text-red-600" size={24} />
                    <h3 className="font-bold text-red-800 text-lg">
                      High Severity Issues ({highSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {detectedFlags
                      .filter(f => f.severity === 'high')
                      .map((flag, index) => (
                        <li key={index} className="text-red-700">
                          <span className="font-semibold">{flag.category}:</span> {flag.question}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 text-red-800 font-semibold">
                    These are serious concerns that require immediate professional attention.
                  </p>
                </div>
              )}

              {mediumSeverity > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="text-orange-600" size={24} />
                    <h3 className="font-bold text-orange-800 text-lg">
                      Medium Severity Issues ({mediumSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {detectedFlags
                      .filter(f => f.severity === 'medium')
                      .map((flag, index) => (
                        <li key={index} className="text-orange-700">
                          <span className="font-semibold">{flag.category}:</span> {flag.question}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 text-orange-800 font-semibold">
                    These issues should be addressed through open communication and possibly coaching.
                  </p>
                </div>
              )}

              {lowSeverity > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="text-yellow-600" size={24} />
                    <h3 className="font-bold text-yellow-800 text-lg">
                      Low Severity Issues ({lowSeverity})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {detectedFlags
                      .filter(f => f.severity === 'low')
                      .map((flag, index) => (
                        <li key={index} className="text-yellow-700">
                          <span className="font-semibold">{flag.category}:</span> {flag.question}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 text-yellow-800 font-semibold">
                    These are minor concerns that can be worked on together.
                  </p>
                </div>
              )}

              {detectedFlags.length === 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                  <p className="text-green-700">
                    Based on your responses, we didn't detect any major red flags in your
                    relationship. Continue nurturing healthy communication and addressing
                    small issues before they grow.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
              {detectedFlags.length > 0 && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  View Help In Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / redFlagQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {redFlagQuestions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              redFlagQuestions[currentQuestion].severity === 'high'
                ? 'bg-red-100 text-red-700'
                : redFlagQuestions[currentQuestion].severity === 'medium'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {redFlagQuestions[currentQuestion].category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {redFlagQuestions[currentQuestion].question}
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              No
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Answer honestly for the most accurate assessment
          </p>
        </div>
      </div>
    </div>
  );
}
