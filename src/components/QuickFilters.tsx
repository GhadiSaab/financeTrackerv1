import { Calendar, TrendingDown, TrendingUp, Sparkles, TrendingUpDown } from 'lucide-react';

interface QuickFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  const filters = [
    { id: 'all', label: 'All', icon: Sparkles, color: 'blue' },
    { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'red' },
    { id: 'income', label: 'Income', icon: TrendingUp, color: 'green' },
    { id: 'investment', label: 'Investments', icon: TrendingUpDown, color: 'purple' },
    { id: 'today', label: 'Today', icon: Calendar, color: 'indigo' },
    { id: 'week', label: 'This Week', icon: Calendar, color: 'violet' },
    { id: 'month', label: 'This Month', icon: Calendar, color: 'cyan' },
  ];

  const colorMap = {
    blue: {
      active: 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500',
      inactive: 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    red: {
      active: 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500',
      inactive: 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20'
    },
    green: {
      active: 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500',
      inactive: 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    purple: {
      active: 'bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500',
      inactive: 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20'
    },
    indigo: {
      active: 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500',
      inactive: 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
    },
    violet: {
      active: 'bg-violet-600 dark:bg-violet-500 text-white border-violet-600 dark:border-violet-500',
      inactive: 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20'
    },
    cyan: {
      active: 'bg-cyan-600 dark:bg-cyan-500 text-white border-cyan-600 dark:border-cyan-500',
      inactive: 'bg-white dark:bg-gray-800 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        const colors = colorMap[filter.color as keyof typeof colorMap];

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
