// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CustomTooltip, getChartColors } from './ChartComponents';
import { supabase, Transaction, Category, Investment } from '../lib/supabase';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import MonthlyComparison from './MonthlyComparison';
import BudgetProgress from './BudgetProgress';
import SmartInsights from './SmartInsights';
import SpendingStreak from './SpendingStreak';

export default function Dashboard() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const chartColors = getChartColors(resolvedTheme);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
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

      if (transData) setTransactions(transData);
      if (catData) setCategories(catData);
      if (invData) setInvestments(invData);

      // Get AI insights
      if (transData && catData) {
        const { data: insightsData } = await supabase.functions.invoke('ai-insights', {
          body: { transactions: transData, categories: catData, investments: invData }
        });

        if (insightsData?.data) {
          setInsights(insightsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : 0;

  // Animated counters - HOOKS MUST BE CALLED UNCONDITIONALLY
  const animatedIncome = useAnimatedCounter(totalIncome);
  const animatedExpenses = useAnimatedCounter(totalExpenses);
  const animatedSavings = useAnimatedCounter(netSavings);
  const animatedSavingsRate = useAnimatedCounter(parseFloat(savingsRate));

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

  const prevSavings = prevIncome - prevExpenses;

  // Calculate category spending for budget progress
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
    
    monthlyData.push({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
      income,
      expenses,
      savings: income - expenses
    });
  });

  // Category breakdown
  const categoryData = categories.map(cat => {
    const total = currentMonthTransactions
      .filter(t => t.category_id === cat.id)
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
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-xl md:rounded-2xl shadow-sm">
          <div className="p-3 md:p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300 mb-1">Income</p>
              <p className="text-lg md:text-2xl font-bold text-green-900 dark:text-green-100">${animatedIncome.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800/50 rounded-xl md:rounded-2xl shadow-sm">
          <div className="p-3 md:p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-red-700 dark:text-red-300 mb-1">Expenses</p>
              <p className="text-lg md:text-2xl font-bold text-red-900 dark:text-red-100">${animatedExpenses.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl md:rounded-2xl shadow-sm">
          <div className="p-3 md:p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Savings</p>
              <p className={`text-lg md:text-2xl font-bold ${netSavings >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-600 dark:text-red-400'}`}>
                ${animatedSavings.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl md:rounded-2xl shadow-sm">
          <div className="p-3 md:p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Rate</p>
              <p className="text-lg md:text-2xl font-bold text-purple-900 dark:text-purple-100">{animatedSavingsRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Mobile Optimized */}
      {monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Monthly Trends */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis stroke={chartColors.text} dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis stroke={chartColors.text} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Spending by Category</h3>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
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
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend with percentage bars */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
            <PieChart className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
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
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Monthly Comparison */}
          <MonthlyComparison
            currentMonth={{ income: totalIncome, expenses: totalExpenses, savings: netSavings }}
            previousMonth={{ income: prevIncome, expenses: prevExpenses, savings: prevSavings }}
          />

          {/* Spending Streak */}
          <SpendingStreak transactions={transactions} />
        </div>
      )}

      {/* Budget Progress & Smart Insights */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Budget Progress */}
          <BudgetProgress categories={categories} spending={categorySpending} />

          {/* Smart Insights */}
          <SmartInsights transactions={currentMonthTransactions} categories={categories} />
        </div>
      )}

      {/* AI Insights - Mobile Optimized */}
      {insights && (
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
                <div key={idx} className={`p-3 md:p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-400' :
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
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-medium ${
                    rec.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
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
      )}

      {/* Recent Transactions - Mobile Optimized */}
      {currentMonthTransactions.length > 0 && (
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
      )}
    </div>
  );
}
