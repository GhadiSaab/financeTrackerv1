import { useEffect, useState } from 'react';
import { supabase, Transaction, Category } from '../lib/supabase';
import { Plus, Pencil, Trash2, Filter, Search, Download, DollarSign, TrendingUp, Calendar, Tag, FileText, Store, Repeat } from 'lucide-react';
import toast from 'react-hot-toast';
import SwipeableTransactionRow from './SwipeableTransactionRow';
import { useIsMobile } from '../hooks/useMediaQuery';
import { seedDefaultCategories } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import QuickFilters from './QuickFilters';
import QuickAddButton from './QuickAddButton';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState('all');
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    description: '',
    merchant: '',
    transaction_type: 'expense' as 'income' | 'expense' | 'investment',
    notes: '',
    is_recurring: false
  });

  useEffect(() => {
    if (user) {
      loadData(true);
    } else {
      setTransactions([]);
      setCategories([]);
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType, filterCategory, quickFilter]);

  const loadData = async (attemptSeed = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (transData) setTransactions(transData);
      if (catData) setCategories(catData);

      // Seed default categories if none exist
      if (attemptSeed && (!catData || catData.length === 0)) {
        await seedDefaultCategories(supabase, user.id);
        const { data: newCats } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
        if (newCats) setCategories(newCats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply quick filters
    if (quickFilter === 'expense' || quickFilter === 'income' || quickFilter === 'investment') {
      filtered = filtered.filter(t => t.transaction_type === quickFilter);
    } else if (quickFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date === today);
    } else if (quickFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (quickFilter === 'month') {
      const monthStart = new Date().toISOString().substring(0, 7);
      filtered = filtered.filter(t => t.date.startsWith(monthStart));
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.merchant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category_id === filterCategory);
    }

    setFilteredTransactions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) {
        toast.error('Please sign in to add or edit transactions.');
        return;
      }
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingTransaction(null);
      resetForm();
      loadData();
      toast.success(editingTransaction ? 'Transaction updated successfully!' : 'Transaction added successfully!');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      if (!user) return;

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      loadData();
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      description: '',
      merchant: '',
      transaction_type: 'expense',
      notes: '',
      is_recurring: false
    });
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      date: transaction.date,
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      merchant: transaction.merchant || '',
      transaction_type: transaction.transaction_type,
      notes: transaction.notes || '',
      is_recurring: transaction.is_recurring || false
    });
    setShowAddModal(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Merchant', 'Category', 'Type', 'Amount', 'Recurring'];
    const rows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.category_id);
      return [
        t.date,
        t.description || '',
        t.merchant || '',
        category?.name || 'Uncategorized',
        t.transaction_type,
        t.amount,
        t.is_recurring ? 'Yes' : 'No'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your income and expenses</p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              toast.error('Please sign in to add transactions.');
              return;
            }
            setShowAddModal(true);
            setEditingTransaction(null);
            resetForm();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
          disabled={!user}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Quick Filters */}
      <QuickFilters activeFilter={quickFilter} onFilterChange={setQuickFilter} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="investment">Investment</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Desktop View - Table */}
        {!isMobile && (
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.description || 'No description'}</div>
                          {transaction.is_recurring && (
                            <Repeat className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        {transaction.merchant && <div className="text-gray-500 dark:text-gray-400">{transaction.merchant}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: category?.color + '20', color: category?.color }}
                        >
                          {category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.transaction_type === 'income' ? 'bg-green-100 text-green-800' :
                            transaction.transaction_type === 'investment' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span className={
                          transaction.transaction_type === 'income' ? 'text-green-600' :
                            transaction.transaction_type === 'investment' ? 'text-purple-600' :
                              'text-gray-900 dark:text-gray-100'
                        }>
                          {transaction.transaction_type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile View - Swipeable Cards */}
        {isMobile && (
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.category_id);
              return (
                <SwipeableTransactionRow
                  key={transaction.id}
                  onDelete={() => handleDelete(transaction.id)}
                >
                  <div className="p-4 active:bg-gray-50 dark:active:bg-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {transaction.description || 'No description'}
                          </div>
                          {transaction.is_recurring && (
                            <Repeat className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        {transaction.merchant && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{transaction.merchant}</div>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <div className={`font-semibold text-sm ${transaction.transaction_type === 'income' ? 'text-green-600' :
                            transaction.transaction_type === 'investment' ? 'text-purple-600' :
                              'text-gray-900 dark:text-gray-100'
                          }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: category?.color + '20', color: category?.color }}
                        >
                          {category?.name || 'Uncategorized'}
                        </span>
                      </div>
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </SwipeableTransactionRow>
              );
            })}
          </div>
        )}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No transactions found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Mobile Optimized */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 p-5 md:p-6 rounded-t-3xl md:rounded-t-2xl z-10">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {editingTransaction ? 'Update your transaction details' : 'Record a new transaction'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
              {/* Amount & Type Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    <DollarSign className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      inputMode="decimal"
                      enterKeyHint="done"
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    <TrendingUp className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    Type
                  </label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as any })}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="expense">💸 Expense</option>
                    <option value="income">💰 Income</option>
                    <option value="investment">📈 Investment</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Calendar className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Tag className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.filter(c => c.type === formData.transaction_type).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Description
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this transaction for?"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Merchant */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Store className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Merchant
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Starbucks, Amazon"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Recurring Transaction</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Repeat this transaction monthly</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingTransaction(null); }}
                  className="flex-1 px-6 py-4 md:py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 md:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 rounded-xl shadow-lg shadow-blue-500/30 text-base font-bold text-white active:scale-[0.98] transition-all"
                >
                  {editingTransaction ? '✓ Update' : '+ Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Button */}
      <QuickAddButton
        onAddTransaction={(type) => {
          if (!user) {
            toast.error('Please sign in to add transactions.');
            return;
          }
          setFormData({
            ...formData,
            transaction_type: type,
            date: new Date().toISOString().split('T')[0]
          });
          setEditingTransaction(null);
          setShowAddModal(true);
        }}
      />
    </div>
  );
}
