import { useMemo } from 'react';
import { Transaction, Category } from '../lib/supabase';
import {
  Calculator,
  Clock,
  Store,
  Flame,
  Shield,
  TrendingUp,
  Calendar,
  Percent
} from 'lucide-react';

interface FinancialMetricsProps {
  transactions: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}

interface MetricCard {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'cyan';
  trend?: 'up' | 'down' | 'neutral';
}

export default function FinancialMetrics({
  transactions,
  categories,
  totalIncome,
  totalExpenses,
  netSavings
}: FinancialMetricsProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    // Current month transactions
    const currentMonthTrans = transactions.filter(t => t.date.startsWith(currentMonth));
    const currentMonthExpenses = currentMonthTrans
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 1. Daily Budget Remaining
    const dailyBudget = daysRemaining > 0
      ? (totalIncome - currentMonthExpenses) / daysRemaining
      : 0;

    // 2. Top Merchants Analysis
    const merchantSpending: { [key: string]: number } = {};
    currentMonthTrans
      .filter(t => t.transaction_type === 'expense' && t.merchant)
      .forEach(t => {
        const merchant = t.merchant || 'Unknown';
        merchantSpending[merchant] = (merchantSpending[merchant] || 0) + Number(t.amount);
      });
    const topMerchant = Object.entries(merchantSpending)
      .sort((a, b) => b[1] - a[1])[0];

    // 3. Expense Velocity (compared to same point last month)
    const dayOfMonth = now.getDate();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.toISOString().substring(0, 7);
    const lastMonthSamePeriod = transactions
      .filter(t => {
        if (!t.date.startsWith(lastMonthStr)) return false;
        const transDay = parseInt(t.date.split('-')[2]);
        return transDay <= dayOfMonth && t.transaction_type === 'expense';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const velocityChange = lastMonthSamePeriod > 0
      ? ((currentMonthExpenses - lastMonthSamePeriod) / lastMonthSamePeriod) * 100
      : 0;

    // 4. Recurring Expenses Percentage
    const recurringExpenses = currentMonthTrans
      .filter(t => t.is_recurring && t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const recurringPercent = currentMonthExpenses > 0
      ? (recurringExpenses / currentMonthExpenses) * 100
      : 0;

    // 5. Financial Health Score (0-100)
    let healthScore = 50; // Start at 50
    // Savings rate contribution (max +30)
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    healthScore += Math.min(30, savingsRate * 1.5);
    // Spending velocity contribution (max +/-20)
    if (velocityChange < 0) healthScore += Math.min(20, Math.abs(velocityChange) * 0.5);
    else healthScore -= Math.min(20, velocityChange * 0.3);
    // Budget adherence (simplified)
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 6. Average Transaction Size
    const avgTransactionSize = currentMonthTrans.length > 0
      ? currentMonthExpenses / currentMonthTrans.filter(t => t.transaction_type === 'expense').length
      : 0;

    // 7. Transactions This Week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= oneWeekAgo && t.transaction_type === 'expense';
    });
    const weeklyTotal = weeklyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      dailyBudget,
      daysRemaining,
      topMerchant,
      velocityChange,
      recurringPercent,
      recurringExpenses,
      healthScore,
      avgTransactionSize,
      weeklyTotal,
      weeklyCount: weeklyTransactions.length
    };
  }, [transactions, totalIncome, totalExpenses, netSavings]);

  const cards: MetricCard[] = [
    {
      title: 'Daily Budget',
      value: `$${Math.max(0, metrics.dailyBudget).toFixed(0)}`,
      subtitle: `${metrics.daysRemaining} days remaining`,
      icon: Calculator,
      color: metrics.dailyBudget > 50 ? 'emerald' : metrics.dailyBudget > 0 ? 'amber' : 'rose'
    },
    {
      title: 'Health Score',
      value: `${metrics.healthScore.toFixed(0)}`,
      subtitle: metrics.healthScore >= 70 ? 'Great!' : metrics.healthScore >= 50 ? 'Good' : 'Needs work',
      icon: Shield,
      color: metrics.healthScore >= 70 ? 'emerald' : metrics.healthScore >= 50 ? 'amber' : 'rose'
    },
    {
      title: 'Spending Pace',
      value: `${metrics.velocityChange >= 0 ? '+' : ''}${metrics.velocityChange.toFixed(0)}%`,
      subtitle: 'vs last month same period',
      icon: TrendingUp,
      color: metrics.velocityChange <= 0 ? 'emerald' : metrics.velocityChange < 20 ? 'amber' : 'rose',
      trend: metrics.velocityChange < 0 ? 'down' : metrics.velocityChange > 0 ? 'up' : 'neutral'
    },
    {
      title: 'This Week',
      value: `$${metrics.weeklyTotal.toFixed(0)}`,
      subtitle: `${metrics.weeklyCount} transactions`,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Recurring',
      value: `${metrics.recurringPercent.toFixed(0)}%`,
      subtitle: `$${metrics.recurringExpenses.toFixed(0)} fixed costs`,
      icon: Percent,
      color: 'violet'
    },
    {
      title: 'Top Merchant',
      value: metrics.topMerchant ? `$${metrics.topMerchant[1].toFixed(0)}` : '-',
      subtitle: metrics.topMerchant ? metrics.topMerchant[0] : 'No data',
      icon: Store,
      color: 'cyan'
    }
  ];

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      icon: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-600 dark:text-emerald-400'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      icon: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
      value: 'text-blue-600 dark:text-blue-400'
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      icon: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
      value: 'text-violet-600 dark:text-violet-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      value: 'text-amber-600 dark:text-amber-400'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      icon: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      value: 'text-rose-600 dark:text-rose-400'
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-500/10',
      icon: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      value: 'text-cyan-600 dark:text-cyan-400'
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-lg mr-3">
          <Flame className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Quick Metrics</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time financial pulse</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card, index) => {
          const colors = colorClasses[card.color];
          const Icon = card.icon;

          return (
            <div
              key={index}
              className={`${colors.bg} rounded-xl p-3 md:p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${colors.icon}`}>
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                  {card.title}
                </span>
              </div>
              <div className={`text-lg md:text-xl font-bold ${colors.value}`}>
                {card.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
