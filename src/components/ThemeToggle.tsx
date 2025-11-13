import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button p-2 text-slate-600 dark:text-slate-200"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
        {theme === 'dark' && <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
        {theme === 'system' && <Monitor className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl shadow-2xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl overflow-hidden z-50">
          {themes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm backdrop-blur-xl transition-colors ${
                  theme === t.value
                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
