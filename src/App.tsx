import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { Landing } from './pages/Landing';
import { Services } from './pages/Services';
import { Dashboard } from './pages/Dashboard';
import { CompatibilityQuiz } from './pages/CompatibilityQuiz';
import { RedFlagChecker } from './pages/RedFlagChecker';
import { HealthTracker } from './pages/HealthTracker';

type Page = 'home' | 'services' | 'dashboard' | 'quiz' | 'red-flags' | 'health-tracker';
type AppPage = Page | 'auth-before' | 'auth-after';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const { loading, user } = useAuth();

  const handleNavigate = (page: string) => {
    if (page === 'quiz' || page === 'red-flags' || page === 'health-tracker' || page === 'dashboard') {
      if (!user) {
        setCurrentPage(page === 'health-tracker' ? 'auth-after' : 'auth-before');
        return;
      }
    }
    setCurrentPage(page as AppPage);
    window.scrollTo(0, 0);
  };

  const handleAuthClick = () => setCurrentPage('auth-before');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAuthClick={handleAuthClick}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {currentPage === 'home' && (
        <Landing onNavigate={handleNavigate} />
      )}

      {currentPage === 'auth-before' && (
        <Auth
          mode="before"
          onBack={() => handleNavigate('home')}
          onSuccess={() => handleNavigate('dashboard')}
        />
      )}

      {currentPage === 'auth-after' && (
        <Auth
          mode="after"
          onBack={() => handleNavigate('home')}
          onSuccess={() => handleNavigate('dashboard')}
        />
      )}

      {currentPage === 'services' && (
        <Services onAuthClick={handleAuthClick} onNavigate={handleNavigate} />
      )}

      {currentPage === 'dashboard' && user && (
        <Dashboard onNavigate={handleNavigate} />
      )}

      {currentPage === 'quiz' && user && (
        <CompatibilityQuiz onNavigate={handleNavigate} />
      )}

      {currentPage === 'red-flags' && user && (
        <RedFlagChecker onNavigate={handleNavigate} />
      )}

      {currentPage === 'health-tracker' && user && (
        <HealthTracker onNavigate={handleNavigate} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
