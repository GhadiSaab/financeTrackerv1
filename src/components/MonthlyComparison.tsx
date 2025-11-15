import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface MonthlyComparisonProps {
  currentMonth: {
    income: number;
    expenses: number;
    savings: number;
  };
  previousMonth: {
    income: number;
    expenses: number;
    savings: number;
  };
}

export default function MonthlyComparison({ currentMonth, previousMonth }: MonthlyComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculateChange(currentMonth.income, previousMonth.income);
  const expensesChange = calculateChange(currentMonth.expenses, previousMonth.expenses);
  const savingsChange = calculateChange(currentMonth.savings, previousMonth.savings);

  const ComparisonItem = ({
    label,
    current,
    change,
    isPositiveGood = true,
    color
  }: {
    label: string;
    current: number;
    change: number;
    isPositiveGood?: boolean;
    color: string;
  }) => {
    const isIncrease = change > 0;
    const isGood = isPositiveGood ? isIncrease : !isIncrease;
    const absChange = Math.abs(change);

    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className={`text-xl md:text-2xl font-bold ${color}`}>
            ${current.toFixed(0)}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
          change === 0
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            : isGood
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {change !== 0 && (
            isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
          )}
          {absChange.toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Comparison
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>vs Last Month</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      <div className="space-y-3">
        <ComparisonItem
          label="Total Income"
          current={currentMonth.income}
          change={incomeChange}
          isPositiveGood={true}
          color="text-green-600 dark:text-green-400"
        />
        <ComparisonItem
          label="Total Expenses"
          current={currentMonth.expenses}
          change={expensesChange}
          isPositiveGood={false}
          color="text-red-600 dark:text-red-400"
        />
        <ComparisonItem
          label="Net Savings"
          current={currentMonth.savings}
          change={savingsChange}
          isPositiveGood={true}
          color="text-blue-600 dark:text-blue-400"
        />
      </div>
    </div>
  );
}
