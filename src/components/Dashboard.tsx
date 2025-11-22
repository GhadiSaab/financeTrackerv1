// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CustomTooltip, getChartColors } from './ChartComponents';
import { supabase, Transaction, Category, Investment, Account } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import MonthlyComparison from './MonthlyComparison';
import BudgetProgress from './BudgetProgress';
import SmartInsights from './SmartInsights';
import SpendingStreak from './SpendingStreak';
import SummaryCards from './SummaryCards';
import FinancialMetrics from './FinancialMetrics';

export default function Dashboard() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const chartColors = getChartColors(resolvedTheme);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();

      // Subscribe to real-time changes for transactions
      const transactionSubscription = supabase
        .channel('dashboard-transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Reload data when transactions change
            loadData();
          }
        )
        .subscribe();

      // Subscribe to real-time changes for categories
      const categorySubscription = supabase
        .channel('dashboard-categories')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadData();
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        transactionSubscription.unsubscribe();
        categorySubscription.unsubscribe();
      };
    } else {
      setTransactions([]);
      setCategories([]);
      setInvestments([]);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Load categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      // Load investments
      const { data: invData } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);

      // Load accounts
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (transData) setTransactions(transData);
      if (catData) setCategories(catData);
      if (invData) setInvestments(invData);
      if (accData) setAccounts(accData);

      // Get AI insights (with fallback)
      if (transData && catData) {
        try {
          const { data: insightsData } = await supabase.functions.invoke('ai-insights', {
            body: { transactions: transData, categories: catData, investments: invData }
          });

          if (insightsData?.data) {
            setInsights(insightsData.data);
          } else {
            // Generate local fallback insights
            setInsights(generateLocalInsights(transData, catData, invData || []));
          }
        } catch {
          // Generate local fallback insights on error
          setInsights(generateLocalInsights(transData, catData, invData || []));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate local insights when AI edge function is unavailable
  const generateLocalInsights = (trans: Transaction[], cats: Category[], invs: Investment[]) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthTrans = trans.filter(t => t.date.startsWith(currentMonth));

    const income = thisMonthTrans.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = thisMonthTrans.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category analysis
    const catSpending: { [key: string]: number } = {};
    thisMonthTrans.filter(t => t.transaction_type === 'expense').forEach(t => {
      if (t.category_id) catSpending[t.category_id] = (catSpending[t.category_id] || 0) + t.amount;
    });
    const topCatId = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCatId ? cats.find(c => c.id === topCatId[0]) : null;

    const insights = [];
    const recommendations = [];

    // Generate insights based on data
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'Strong Savings Rate',
        message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. This exceeds the recommended 20% target.`
      });
    } else if (savingsRate >= 0 && savingsRate < 20) {
      insights.push({
        type: 'info',
        title: 'Room for Improvement',
        message: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for 20% by reducing discretionary spending.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Spending Alert',
        message: `You're spending more than you earn this month. Review your expenses to get back on track.`
      });
    }

    if (topCategory && topCatId) {
      const percentage = ((topCatId[1] / expenses) * 100).toFixed(0);
      insights.push({
        type: 'info',
        title: `Top Category: ${topCategory.name}`,
        message: `${percentage}% of your spending ($${topCatId[1].toFixed(0)}) went to ${topCategory.name}. Is this aligned with your priorities?`
      });
    }

    if (invs.length === 0 && savingsRate > 10) {
      insights.push({
        type: 'info',
        title: 'Consider Investing',
        message: `You have positive savings but no investments. Starting small can lead to significant long-term growth.`
      });
    }

    // Generate recommendations
    if (savingsRate < 20 && income > 0) {
      const needed = (0.2 * income) - savings;
      recommendations.push({
        title: 'Increase Savings',
        description: `Find $${needed.toFixed(0)} to cut from your expenses to reach a 20% savings rate.`,
        potential_savings: needed.toFixed(0),
        difficulty: needed < 100 ? 'easy' : needed < 300 ? 'medium' : 'hard'
      });
    }

    if (topCategory && topCatId && topCatId[1] > expenses * 0.3) {
      recommendations.push({
        title: `Reduce ${topCategory.name} Spending`,
        description: `This category takes up ${((topCatId[1] / expenses) * 100).toFixed(0)}% of your budget. Try cutting it by 20%.`,
        potential_savings: (topCatId[1] * 0.2).toFixed(0),
        difficulty: 'medium'
      });
    }

    const recurringExpenses = thisMonthTrans.filter(t => t.is_recurring && t.transaction_type === 'expense');
    if (recurringExpenses.length > 0) {
      const recurringTotal = recurringExpenses.reduce((s, t) => s + t.amount, 0);
      recommendations.push({
        title: 'Audit Subscriptions',
        description: `You have $${recurringTotal.toFixed(0)} in recurring expenses. Review and cancel unused subscriptions.`,
        potential_savings: (recurringTotal * 0.15).toFixed(0),
        difficulty: 'easy'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Build Emergency Fund',
        description: 'Aim for 3-6 months of expenses saved. Automate transfers to a high-yield savings account.',
        potential_savings: '50',
        difficulty: 'easy'
      });
    }

    return { insights: insights.slice(0, 3), recommendations: recommendations.slice(0, 3) };
  };

  // Calculate summary statistics - MUST BE BEFORE HOOKS
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  const totalIncome = currentMonthTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate investment transactions (new approach)
  const investmentTransactions = currentMonthTransactions
    .filter(t => t.transaction_type === 'investment')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate total investments from both sources
  // 1. Manual investments from investments table (portfolio value)
  const portfolioInvestmentsValue = investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);

  // 2. Investment transactions (new transaction type)
  const investmentTransactionsValue = investmentTransactions;

  // Total investments = portfolio + investment transactions
  const totalInvestmentsValue = portfolioInvestmentsValue + investmentTransactionsValue;

  // Savings = Income - Expenses - Investments
  const netSavings = totalIncome - totalExpenses - investmentTransactionsValue;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : 0;

  // Animated counters - HOOKS MUST BE CALLED UNCONDITIONALLY
  const animatedIncome = useAnimatedCounter(totalIncome);
  const animatedExpenses = useAnimatedCounter(totalExpenses);
  const animatedSavings = useAnimatedCounter(netSavings);
  const animatedSavingsRate = useAnimatedCounter(parseFloat(savingsRate));
  const animatedInvestments = useAnimatedCounter(totalInvestmentsValue);
  const animatedPortfolioInvestments = useAnimatedCounter(portfolioInvestmentsValue);
  const animatedInvestmentTransactions = useAnimatedCounter(investmentTransactionsValue);

  // Calculate Net Worth
  const totalAssets = accounts.reduce((sum, acc) => ['checking', 'savings', 'other'].includes(acc.type) ? sum + Number(acc.balance) : sum, 0) +
    investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalLiabilities = accounts.reduce((sum, acc) => ['credit_card', 'loan'].includes(acc.type) ? sum + Number(acc.balance) : sum, 0);
  const netWorth = totalAssets - totalLiabilities;

  const animatedNetWorth = useAnimatedCounter(netWorth);

  // Loading state check AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate previous month data for comparison
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const prevMonthStr = previousMonth.toISOString().substring(0, 7);
  const previousMonthTransactions = transactions.filter(t => t.date.startsWith(prevMonthStr));

  const prevIncome = previousMonthTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevExpenses = previousMonthTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevInvestments = previousMonthTransactions
    .filter(t => t.transaction_type === 'investment')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevSavings = prevIncome - prevExpenses - prevInvestments;

  // Calculate category spending for budget progress (only expenses, not investments)
  const categorySpending: { [key: string]: number } = {};
  currentMonthTransactions.forEach(t => {
    if (t.category_id && t.transaction_type === 'expense') {
      categorySpending[t.category_id] = (categorySpending[t.category_id] || 0) + Number(t.amount);
    }
  });

  // Prepare chart data
  const monthlyData: any[] = [];
  const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().slice(-6);

  months.forEach(month => {
    const monthTrans = transactions.filter(t => t.date.startsWith(month));
    const income = monthTrans.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTrans.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const investments = monthTrans.filter(t => t.transaction_type === 'investment').reduce((s, t) => s + Number(t.amount), 0);

    monthlyData.push({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
      income,
      expenses,
      savings: income - expenses - investments
    });
  });

  // Calculate Average Spending by Day of Week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const spendingByDay = new Array(7).fill(0);
  const countsByDay = new Array(7).fill(0);

  transactions.forEach(t => {
    if (t.transaction_type === 'expense') {
      const date = new Date(t.date);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      spendingByDay[day] += Number(t.amount);
      countsByDay[day]++;
    }
  });

  // To get a true "average per day", we need to know how many of each weekday passed in the date range.
  // For simplicity and robustness with sparse data, we'll average over the unique dates present in the transactions for that weekday.
  // Or better: Total Spending / Count of transactions? No, that's average transaction size.
  // We want Average Daily Spending.
  // Let's calculate: Total Spending on Day X / Number of unique dates that were Day X in the dataset.

  const uniqueDatesByDay = new Array(7).fill(0).map(() => new Set<string>());
  transactions.forEach(t => {
    if (t.transaction_type === 'expense') {
      const date = new Date(t.date);
      const day = date.getDay();
      uniqueDatesByDay[day].add(t.date);
    }
  });

  const dailyAverageData = daysOfWeek.map((day, index) => ({
    day,
    amount: uniqueDatesByDay[index].size > 0 ? spendingByDay[index] / uniqueDatesByDay[index].size : 0
  }));

  // Category breakdown (only expense transactions)
  const categoryData = categories
    .map(cat => {
      const total = currentMonthTransactions
        .filter(t => t.category_id === cat.id && t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color
      };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h1>
        <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <SummaryCards
        income={animatedIncome}
        expenses={animatedExpenses}
        savings={animatedSavings}
        savingsRate={animatedSavingsRate}
        investments={animatedInvestments}
        portfolioValue={animatedPortfolioInvestments}
        investmentTransactionsValue={animatedInvestmentTransactions}
        investmentCount={investments.length}
        netWorth={animatedNetWorth}
      />

      {/* Quick Financial Metrics */}
      {transactions.length > 0 && (
        <FinancialMetrics
          transactions={transactions}
          categories={categories}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netSavings={netSavings}
        />
      )}

      {/* Charts Row - Mobile Optimized */}
      {monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Monthly Trends */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Income vs Expenses</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                      border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" fill="#10b981" fillOpacity={0.9} name="Income" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="expenses" fill="#ef4444" fillOpacity={0.9} name="Expenses" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Spending by Day of Week */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Avg. Spending by Day</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyAverageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                      border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" fillOpacity={0.9} name="Avg Spending" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Spending by Category</h3>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={2}
                        strokeWidth={2}
                        stroke={resolvedTheme === 'dark' ? '#111827' : '#ffffff'}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `$${Number(value).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                          border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '0.75rem',
                          fontSize: '0.875rem',
                          padding: '8px 12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend with percentage bars */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {categoryData
                    .sort((a, b) => b.value - a.value)
                    .map((category, index) => {
                      const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                      const percentage = ((category.value / total) * 100).toFixed(1);
                      return (
                        <div key={index} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-900"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {category.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {percentage}%
                              </span>
                              <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                                ${category.value.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500 dark:text-gray-400">
                <p className="text-sm">No category data available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl md:rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Transaction Data Yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Start tracking your finances by adding your first transaction!
            </p>
            <Link
              to="/input"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Add Transaction
            </Link>
          </div>
        </div>
      )}

      {/* New Widgets Section */}
      {
        transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Monthly Comparison */}
            <MonthlyComparison
              currentMonth={{ income: totalIncome, expenses: totalExpenses, savings: netSavings }}
              previousMonth={{ income: prevIncome, expenses: prevExpenses, savings: prevSavings }}
            />

            {/* Spending Streak */}
            <SpendingStreak transactions={transactions} />
          </div>
        )
      }

      {/* Budget Progress & Smart Insights */}
      {
        transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Budget Progress */}
            <BudgetProgress categories={categories} spending={categorySpending} />

            {/* Smart Insights */}
            <SmartInsights transactions={currentMonthTransactions} categories={categories} />
          </div>
        )
      }

      {/* AI Insights - Mobile Optimized */}
      {
        insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Insights */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Financial Insights</h3>
              </div>
              <div className="space-y-2 md:space-y-3">
                {insights.insights?.slice(0, 3).map((insight: any, idx: number) => (
                  <div key={idx} className={`p-3 md:p-4 rounded-lg border-l-4 ${insight.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-400' :
                    insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500 dark:border-yellow-400' :
                      insight.type === 'alert' ? 'bg-red-50 dark:bg-red-950/30 border-red-500 dark:border-red-400' :
                        'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-400'
                    }`}>
                    <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">{insight.title}</h4>
                    <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-1">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-3">
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Money-Saving Tips</h3>
              </div>
              <div className="space-y-2 md:space-y-3">
                {insights.recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">{rec.title}</h4>
                      <span className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap ml-2">
                        +${rec.potential_savings}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{rec.description}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-medium ${rec.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                      rec.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      }`}>
                      {rec.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Recent Transactions - Mobile Optimized */}
      {
        currentMonthTransactions.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {currentMonthTransactions.slice(0, 5).map((transaction) => {
                const category = categories.find(c => c.id === transaction.category_id);
                return (
                  <li key={transaction.id} className="px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <div
                          className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: category?.color + '20' }}
                        >
                          <span style={{ color: category?.color }}>
                            {transaction.transaction_type === 'income' ? <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />}
                          </span>
                        </div>
                        <div className="ml-3 min-w-0">
                          <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">{transaction.description || 'Uncategorized'}</p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{category?.name} • {new Date(transaction.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className={`text-base md:text-lg font-bold flex-shrink-0 ${transaction.transaction_type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(0)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 md:px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <Link
                to="/transactions"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all transactions →
              </Link>
            </div>
          </div>
        )
      }
    </div >
  );
}
