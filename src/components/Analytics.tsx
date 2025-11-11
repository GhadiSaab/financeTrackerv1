// @ts-nocheck
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CustomTooltip, getChartColors } from './ChartComponents';
import { supabase, Transaction, Category } from '../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Analytics() {
  const { resolvedTheme } = useTheme();
  const chartColors = getChartColors(resolvedTheme);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });
      
      const { data: catData } = await supabase
        .from('categories')
        .select('*');
      
      if (transData) setTransactions(transData);
      if (catData) setCategories(catData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Filter transactions by time range
  const monthsBack = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
  const filteredTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);

  // Monthly trend data
  const monthlyTrend: any[] = [];
  const months = [...new Set(filteredTransactions.map(t => t.date.substring(0, 7)))].sort();
  
  months.forEach(month => {
    const monthTrans = filteredTransactions.filter(t => t.date.startsWith(month));
    const income = monthTrans.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTrans.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    
    monthlyTrend.push({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      income,
      expenses,
      savings: income - expenses
    });
  });

  // Category spending
  const categorySpending = categories.map(cat => {
    const total = filteredTransactions
      .filter(t => t.category_id === cat.id && t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      name: cat.name,
      value: total,
      color: cat.color,
      budget: cat.budget_limit,
      percentage: 0
    };
  }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const totalSpending = categorySpending.reduce((sum, c) => sum + c.value, 0);
  categorySpending.forEach(c => c.percentage = (c.value / totalSpending * 100));

  // Income vs Expense comparison
  const totalIncome = filteredTransactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filteredTransactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : 0;

  // Average spending by day of week
  const dayOfWeekSpending = Array(7).fill(0).map((_, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], amount: 0, count: 0 }));
  filteredTransactions.filter(t => t.transaction_type === 'expense').forEach(t => {
    const day = new Date(t.date).getDay();
    dayOfWeekSpending[day].amount += Number(t.amount);
    dayOfWeekSpending[day].count += 1;
  });
  dayOfWeekSpending.forEach(d => d.amount = d.count > 0 ? d.amount / d.count : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detailed insights into your spending patterns</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Income</p>
              <p className="text-3xl font-bold text-green-900 mt-2">${totalIncome.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Expenses</p>
              <p className="text-3xl font-bold text-red-900 mt-2">${totalExpenses.toFixed(2)}</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Net Savings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">${netSavings.toFixed(2)}</p>
              <p className="text-sm text-blue-700 mt-1">{savingsRate}% savings rate</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Monthly Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis stroke={chartColors.text} dataKey="month" />
            <YAxis stroke={chartColors.text} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categorySpending}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categorySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Category Details</h3>
          <div className="space-y-4">
            {categorySpending.slice(0, 8).map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">${cat.value.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  ></div>
                </div>
                {cat.budget > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Budget: ${cat.budget.toFixed(2)}</span>
                    <span className={`text-xs ${cat.value > cat.budget ? 'text-red-600' : 'text-green-600'}`}>
                      {((cat.value / cat.budget) * 100).toFixed(0)}% used
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending by Day of Week */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Average Spending by Day of Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayOfWeekSpending}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis stroke={chartColors.text} dataKey="day" />
            <YAxis stroke={chartColors.text} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="amount" fill="#3b82f6" name="Average Spending" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
