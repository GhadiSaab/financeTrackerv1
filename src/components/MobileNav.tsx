import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Sparkles, 
  FileText,
  PieChart
} from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/input', icon: Sparkles, label: 'Add' },
    { path: '/analytics', icon: PieChart, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-500 active:scale-95'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
              )}
              <div className={`p-2 rounded-xl transition-all ${
                isActive ? 'bg-blue-50 dark:bg-blue-950/50' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
