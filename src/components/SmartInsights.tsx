import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target, Calendar, Repeat, ArrowUpRight, ShieldCheck } from 'lucide-react';
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
      action?: string;
      color: string;
    }> = [];

    if (transactions.length === 0) return insights;

    // Calculate spending patterns
    const expenses = transactions.filter(t => t.transaction_type === 'expense');
    const income = transactions.filter(t => t.transaction_type === 'income');
    const investments = transactions.filter(t => t.transaction_type === 'investment');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = investments.reduce((sum, t) => sum + t.amount, 0);

    // Get current month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthExpenses = expenses.filter(t => {
      const d = new Date(t.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Category spending analysis
    const categorySpending: { [key: string]: { total: number; count: number; transactions: Transaction[] } } = {};
    expenses.forEach(t => {
      if (t.category_id) {
        if (!categorySpending[t.category_id]) {
          categorySpending[t.category_id] = { total: 0, count: 0, transactions: [] };
        }
        categorySpending[t.category_id].total += t.amount;
        categorySpending[t.category_id].count += 1;
        categorySpending[t.category_id].transactions.push(t);
      }
    });

    // Day of week analysis
    const daySpending: { [key: number]: number } = {};
    thisMonthExpenses.forEach(t => {
      const day = new Date(t.date).getDay();
      daySpending[day] = (daySpending[day] || 0) + t.amount;
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const highestSpendingDay = Object.entries(daySpending).sort((a, b) => b[1] - a[1])[0];

    // 1. Month-over-month comparison
    if (lastMonthTotal > 0 && thisMonthTotal > 0) {
      const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

      if (percentChange > 15) {
        insights.push({
          type: 'warning',
          icon: TrendingUp,
          title: 'Spending Up This Month',
          description: `You've spent ${percentChange.toFixed(0)}% more than last month ($${thisMonthTotal.toFixed(0)} vs $${lastMonthTotal.toFixed(0)}). Review your recent purchases to stay on track.`,
          action: 'Review expenses',
          color: 'orange'
        });
      } else if (percentChange < -10) {
        insights.push({
          type: 'success',
          icon: TrendingDown,
          title: 'Great Job Cutting Costs!',
          description: `You've reduced spending by ${Math.abs(percentChange).toFixed(0)}% compared to last month. You're saving $${Math.abs(thisMonthTotal - lastMonthTotal).toFixed(0)} extra!`,
          color: 'green'
        });
      }
    }

    // 2. Top spending category with actionable advice
    const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1].total - a[1].total);
    if (sortedCategories.length > 0) {
      const [topCatId, topCatData] = sortedCategories[0];
      const category = categories.find(c => c.id === topCatId);
      const percentage = ((topCatData.total / totalExpenses) * 100).toFixed(0);

      if (category) {
        const avgTransaction = topCatData.total / topCatData.count;
        insights.push({
          type: 'info',
          icon: Target,
          title: `${category.name}: $${topCatData.total.toFixed(0)} (${percentage}%)`,
          description: `Your biggest expense category with ${topCatData.count} transactions averaging $${avgTransaction.toFixed(0)} each.${Number(percentage) > 30 ? ' Consider setting a budget limit to control this spending.' : ''}`,
          color: 'blue'
        });
      }
    }

    // 3. Savings rate with specific guidance
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;

    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        icon: ShieldCheck,
        title: `Saving ${savingsRate.toFixed(0)}% of Income`,
        description: `Excellent! You're beating the recommended 20% savings rate. ${investmentRate > 0 ? `Plus ${investmentRate.toFixed(0)}% going to investments.` : 'Consider investing some savings for long-term growth.'}`,
        color: 'green'
      });
    } else if (savingsRate >= 10 && savingsRate < 20) {
      const needed = (0.2 * totalIncome) - netSavings;
      insights.push({
        type: 'info',
        icon: ArrowUpRight,
        title: `Savings Rate: ${savingsRate.toFixed(0)}%`,
        description: `You're saving, but aim for 20%. Cutting $${needed.toFixed(0)}/month would hit the target. Look at your top 2 expense categories for opportunities.`,
        action: 'Find $' + needed.toFixed(0) + ' to save',
        color: 'blue'
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Low Savings Rate',
        description: `Only ${savingsRate.toFixed(0)}% of income saved. Review subscriptions and dining expenses first - these are often the easiest to reduce.`,
        action: 'Audit subscriptions',
        color: 'yellow'
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Spending Exceeds Income',
        description: `You're spending $${Math.abs(netSavings).toFixed(0)} more than you earn. Create a strict budget immediately and cut non-essential expenses.`,
        action: 'Create budget',
        color: 'red'
      });
    }

    // 4. Recurring expenses detection
    const recurringTransactions = transactions.filter(t => t.is_recurring);
    const recurringTotal = recurringTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (recurringTotal > 0 && totalIncome > 0) {
      const recurringPercent = (recurringTotal / totalIncome) * 100;
      if (recurringPercent > 30) {
        insights.push({
          type: 'warning',
          icon: Repeat,
          title: 'High Recurring Costs',
          description: `${recurringPercent.toFixed(0)}% of your income ($${recurringTotal.toFixed(0)}) goes to recurring bills. Audit subscriptions and negotiate lower rates on utilities.`,
          action: 'Review subscriptions',
          color: 'orange'
        });
      }
    }

    // 5. Weekend spending insight
    if (highestSpendingDay) {
      const dayNum = parseInt(highestSpendingDay[0]);
      const dayAmount = highestSpendingDay[1];
      const dailyAvg = thisMonthTotal / (now.getDate());

      if (dayAmount > dailyAvg * 2 && (dayNum === 0 || dayNum === 6 || dayNum === 5)) {
        insights.push({
          type: 'tip',
          icon: Calendar,
          title: `${dayNames[dayNum]} Spending Spike`,
          description: `You spend the most on ${dayNames[dayNum]}s ($${dayAmount.toFixed(0)} this month). Plan activities with a budget or try free alternatives.`,
          color: 'purple'
        });
      }
    }

    // 6. Budget compliance
    const budgetCategories = categories.filter(c => c.budget_limit && c.budget_limit > 0);
    const overBudgetCategories = budgetCategories.filter(cat => {
      const spent = categorySpending[cat.id]?.total || 0;
      return spent > (cat.budget_limit || 0);
    });

    if (overBudgetCategories.length > 0) {
      const overBudgetNames = overBudgetCategories.map(c => c.name).join(', ');
      const totalOver = overBudgetCategories.reduce((sum, cat) => {
        const spent = categorySpending[cat.id]?.total || 0;
        return sum + (spent - (cat.budget_limit || 0));
      }, 0);

      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Over Budget',
        description: `You've exceeded your budget in ${overBudgetNames} by $${totalOver.toFixed(0)} total. Pause non-essential purchases in these categories.`,
        action: 'Freeze spending',
        color: 'red'
      });
    } else if (budgetCategories.length > 0) {
      const totalBudget = budgetCategories.reduce((sum, c) => sum + (c.budget_limit || 0), 0);
      const totalSpentInBudgeted = budgetCategories.reduce((sum, c) => sum + (categorySpending[c.id]?.total || 0), 0);
      const remaining = totalBudget - totalSpentInBudgeted;

      if (remaining > 0) {
        insights.push({
          type: 'success',
          icon: Target,
          title: 'Within All Budgets',
          description: `Great discipline! You have $${remaining.toFixed(0)} remaining across your budgeted categories. Keep it up!`,
          color: 'green'
        });
      }
    }

    // 7. Investment encouragement (if not investing)
    if (totalInvestments === 0 && savingsRate > 10) {
      insights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Start Investing',
        description: `You're saving ${savingsRate.toFixed(0)}% of income. Consider investing a portion for compound growth - even $50/month can grow significantly over time.`,
        action: 'Learn about investing',
        color: 'purple'
      });
    }

    return insights.slice(0, 4); // Return top 4 most relevant insights
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Smart Insights
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add some transactions to get personalized financial insights and recommendations.
        </p>
      </div>
    );
  }

  const colorMap = {
    blue: {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
      border: 'border-blue-200/50 dark:border-blue-700/30',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      action: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    green: {
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
      border: 'border-emerald-200/50 dark:border-emerald-700/30',
      text: 'text-emerald-900 dark:text-emerald-100',
      subtext: 'text-emerald-700 dark:text-emerald-300',
      icon: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      action: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    yellow: {
      bg: 'from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40',
      border: 'border-amber-200/50 dark:border-amber-700/30',
      text: 'text-amber-900 dark:text-amber-100',
      subtext: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      action: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    red: {
      bg: 'from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40',
      border: 'border-rose-200/50 dark:border-rose-700/30',
      text: 'text-rose-900 dark:text-rose-100',
      subtext: 'text-rose-700 dark:text-rose-300',
      icon: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/50',
      action: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    purple: {
      bg: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
      border: 'border-violet-200/50 dark:border-violet-700/30',
      text: 'text-violet-900 dark:text-violet-100',
      subtext: 'text-violet-700 dark:text-violet-300',
      icon: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50',
      action: 'bg-violet-600 hover:bg-violet-700 text-white'
    },
    orange: {
      bg: 'from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40',
      border: 'border-orange-200/50 dark:border-orange-700/30',
      text: 'text-orange-900 dark:text-orange-100',
      subtext: 'text-orange-700 dark:text-orange-300',
      icon: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      action: 'bg-orange-600 hover:bg-orange-700 text-white'
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
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
                  <p className={`text-xs ${colors.subtext} leading-relaxed`}>
                    {insight.description}
                  </p>
                  {insight.action && (
                    <button className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg ${colors.action} transition-colors`}>
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
