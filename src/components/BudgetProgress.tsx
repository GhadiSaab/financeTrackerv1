import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Category } from '../lib/supabase';

interface BudgetProgressProps {
  categories: Category[];
  spending: { [key: string]: number };
}

export default function BudgetProgress({ categories, spending }: BudgetProgressProps) {
  const categoriesWithBudget = categories.filter(cat => cat.budget_limit && cat.budget_limit > 0);

  if (categoriesWithBudget.length === 0) {
    return null;
  }

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { status: 'over', color: 'red', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'yellow', icon: AlertTriangle };
    return { status: 'good', color: 'green', icon: CheckCircle };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500 dark:bg-red-400';
    if (percentage >= 80) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  const getBarBackground = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-50 dark:bg-red-950/20';
    if (percentage >= 80) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return 'bg-green-50 dark:bg-green-950/20';
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Budget Progress
        </h3>
      </div>

      <div className="space-y-4">
        {categoriesWithBudget.map((category) => {
          const spent = spending[category.id] || 0;
          const budget = category.budget_limit || 0;
          const percentage = Math.min((spent / budget) * 100, 100);
          const remaining = Math.max(budget - spent, 0);
          const { status, color, icon: Icon } = getBudgetStatus(spent, budget);

          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ${spent.toFixed(0)} / ${budget.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className={`relative h-3 rounded-full overflow-hidden ${getBarBackground(percentage)}`}>
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(percentage)}`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage >= 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {percentage.toFixed(0)}% used
                </span>
                {status === 'over' ? (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    ${(spent - budget).toFixed(0)} over budget!
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    ${remaining.toFixed(0)} remaining
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
