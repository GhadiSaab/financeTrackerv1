// @ts-nocheck
import { useEffect, useState } from 'react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate summary statistics
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your financial activity for {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Income</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${totalIncome.toFixed(2)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Expenses</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${totalExpenses.toFixed(2)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Net Savings</dt>
                  <dd className="flex items-baseline">
                    <div className={`text-2xl font-semibold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netSavings.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Savings Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{savingsRate}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis stroke={chartColors.text} dataKey="month" />
              <YAxis stroke={chartColors.text} />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Financial Insights</h3>
            </div>
            <div className="space-y-3">
              {insights.insights?.slice(0, 3).map((insight: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-400' :
                  insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                }`}>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{insight.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Money-Saving Tips</h3>
            </div>
            <div className="space-y-3">
              {insights.recommendations?.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{rec.title}</h4>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Save ${rec.potential_savings}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                    rec.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    rec.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {rec.difficulty} to implement
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Transactions</h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentMonthTransactions.slice(0, 5).map((transaction) => {
            const category = categories.find(c => c.id === transaction.category_id);
            return (
              <li key={transaction.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      <span style={{ color: category?.color }}>
                        {transaction.transaction_type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.description || 'Uncategorized'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{category?.name} • {new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
                    {transaction.transaction_type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
