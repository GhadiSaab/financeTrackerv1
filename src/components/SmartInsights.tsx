import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { Transaction, Category } from '../lib/supabase';

interface SmartInsightsProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function SmartInsights({ transactions, categories }: SmartInsightsProps) {
  const generateInsights = () => {
    const insights: Array<{
      type: 'success' | 'warning' | 'info' | 'tip';
      icon: any;
      title: string;
      description: string;
      color: string;
    }> = [];

    // Calculate spending patterns
    const expenses = transactions.filter(t => t.transaction_type === 'expense');
    const income = transactions.filter(t => t.transaction_type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // Category spending analysis
    const categorySpending: { [key: string]: number } = {};
    expenses.forEach(t => {
      if (t.category_id) {
        categorySpending[t.category_id] = (categorySpending[t.category_id] || 0) + t.amount;
      }
    });

    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      const category = categories.find(c => c.id === topCategory[0]);
      const percentage = ((topCategory[1] / totalExpenses) * 100).toFixed(0);
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Top Spending Category',
        description: `${percentage}% of your expenses went to ${category?.name || 'Unknown'}. Consider reviewing if this aligns with your priorities.`,
        color: 'blue'
      });
    }

    // Savings rate insight
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Excellent Savings!',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep up the great work! Financial experts recommend 20% or more.`,
        color: 'green'
      });
    } else if (savingsRate < 10 && savingsRate > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Low Savings Rate',
        description: `You're only saving ${savingsRate.toFixed(0)}% of your income. Try to identify areas where you can cut back to reach the 20% goal.`,
        color: 'yellow'
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Spending More Than Earning',
        description: `Your expenses exceed your income by $${Math.abs(totalIncome - totalExpenses).toFixed(0)}. Review your budget to get back on track.`,
        color: 'red'
      });
    }

    // Transaction frequency insight
    const avgDailyTransactions = transactions.length / 30;
    if (avgDailyTransactions < 1) {
      insights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Track More Frequently',
        description: `You're averaging ${avgDailyTransactions.toFixed(1)} transactions per day. Regular tracking helps you stay on top of your finances!`,
        color: 'purple'
      });
    }

    // Budget compliance
    const budgetCategories = categories.filter(c => c.budget_limit && c.budget_limit > 0);
    const overBudgetCount = budgetCategories.filter(cat => {
      const spent = categorySpending[cat.id] || 0;
      return spent > (cat.budget_limit || 0);
    }).length;

    if (overBudgetCount > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Budget Alert',
        description: `You're over budget in ${overBudgetCount} ${overBudgetCount === 1 ? 'category' : 'categories'}. Review your spending to stay on track.`,
        color: 'orange'
      });
    } else if (budgetCategories.length > 0) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'On Track!',
        description: `Great job! You're staying within budget across all categories. Keep it up!`,
        color: 'green'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  const colorMap = {
    blue: {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    green: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      border: 'border-green-200 dark:border-green-800/50',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40'
    },
    yellow: {
      bg: 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
      border: 'border-yellow-200 dark:border-yellow-800/50',
      text: 'text-yellow-900 dark:text-yellow-100',
      icon: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
    },
    red: {
      bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
      border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40'
    },
    purple: {
      bg: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      border: 'border-purple-200 dark:border-purple-800/50',
      text: 'text-purple-900 dark:text-purple-100',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40'
    },
    orange: {
      bg: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
      border: 'border-orange-200 dark:border-orange-800/50',
      text: 'text-orange-900 dark:text-orange-100',
      icon: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40'
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          Smart Insights
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const colors = colorMap[insight.color as keyof typeof colorMap];
          const Icon = insight.icon;

          return (
            <div
              key={index}
              className={`bg-gradient-to-r ${colors.bg} border ${colors.border} p-4 rounded-xl transition-all hover:shadow-md`}
            >
              <div className="flex gap-3">
                <div className={`p-2 ${colors.iconBg} rounded-lg h-fit flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>
                    {insight.title}
                  </h4>
                  <p className={`text-xs ${colors.text} opacity-80`}>
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
