import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  Receipt, 
  TrendingUp, 
  FileText, 
  Sparkles
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import UserMenu from './components/UserMenu';
import MobileNav from './components/MobileNav';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Investments from './components/Investments';
import Reports from './components/Reports';
import DataInput from './components/DataInput';
import './App.css';

function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: PieChart, label: 'Analytics' },
    { path: '/investments', icon: TrendingUp, label: 'Investments' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/input', icon: Sparkles, label: 'Smart Input' },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-white/50 dark:border-white/10 bg-opacity-80 dark:bg-opacity-60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-purple-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold gradient-text block leading-tight">
                  FinanceTracker
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 hidden sm:block">
                  AI guided clarity
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation - Only show if authenticated */}
            {user && (
              <div className="hidden md:ml-10 md:flex md:space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-600 dark:text-indigo-200 shadow-md shadow-indigo-500/20'
                          : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-indigo-500 dark:text-indigo-200' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Theme Toggle and User Menu */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user && <UserMenu />}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Component to handle home route redirect
function HomeRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Dashboard />;
}

// Auth Callback Component for email verification
function AuthCallback() {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your email has been successfully verified. You can now access all features.
          </p>
          <Link
            to="/"
            className="inline-block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="app-shell overflow-hidden">
      <div className="background-grid" aria-hidden="true"></div>
      <div className="background-glow glow-one" aria-hidden="true"></div>
      <div className="background-glow glow-two" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'dark:bg-slate-900/80 dark:text-white',
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#14b8a6',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#f87171',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 space-y-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<HomeRoute />} />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investments"
              element={
                <ProtectedRoute>
                  <Investments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/input"
              element={
                <ProtectedRoute>
                  <DataInput />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {user && <MobileNav />}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
