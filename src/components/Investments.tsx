// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase, Investment } from '../lib/supabase';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Link as LinkIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import ConnectedAccounts from './ConnectedAccounts';

export default function Investments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'connected'>('manual');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'Stocks',
    amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: '',
    notes: '',
    ticker_symbol: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setInvestments([]);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) {
        toast.error('Please sign in to add or edit investments.');
        return;
      }

      // Validate ticker symbol uniqueness if provided
      if (formData.ticker_symbol && formData.ticker_symbol.trim()) {
        const { data: existingInvestments } = await supabase
          .from('investments')
          .select('id, ticker_symbol')
          .eq('user_id', user.id)
          .eq('ticker_symbol', formData.ticker_symbol.trim().toUpperCase());

        // Check if ticker exists and it's not the current investment being edited
        if (existingInvestments && existingInvestments.length > 0) {
          if (!editingInvestment || existingInvestments[0].id !== editingInvestment.id) {
            toast.error(`Ticker symbol ${formData.ticker_symbol.toUpperCase()} already exists in your portfolio!`);
            return;
          }
        }
      }

      const investmentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        current_value: parseFloat(formData.current_value || formData.amount),
        ticker_symbol: formData.ticker_symbol ? formData.ticker_symbol.trim().toUpperCase() : null,
        user_id: user.id
      };

      if (editingInvestment) {
        const { error } = await supabase
          .from('investments')
          .update(investmentData)
          .eq('id', editingInvestment.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('investments')
          .insert([investmentData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingInvestment(null);
      resetForm();
      loadData();
      toast.success(editingInvestment ? 'Investment updated successfully!' : 'Investment added successfully!');
    } catch (error) {
      console.error('Error saving investment:', error);
      toast.error('Failed to save investment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;

    try {
      if (!user) return;

      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      loadData();
      toast.success('Investment deleted successfully!');
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast.error('Failed to delete investment');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      asset_type: 'Stocks',
      amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      current_value: '',
      notes: '',
      ticker_symbol: ''
    });
  };

  const openEditModal = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      asset_type: investment.asset_type,
      amount: investment.amount.toString(),
      purchase_date: investment.purchase_date,
      current_value: investment.current_value.toString(),
      notes: investment.notes || '',
      ticker_symbol: investment.ticker_symbol || ''
    });
    setShowAddModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Calculate portfolio statistics
  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalGain / totalInvested * 100).toFixed(2) : 0;

  // Portfolio breakdown by asset type
  const assetTypeBreakdown: { [key: string]: number } = {};
  investments.forEach(inv => {
    assetTypeBreakdown[inv.asset_type] = (assetTypeBreakdown[inv.asset_type] || 0) + Number(inv.current_value);
  });

  const pieData = Object.entries(assetTypeBreakdown).map(([type, value]) => ({
    name: type,
    value
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Investment Portfolio</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your investments and portfolio performance</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Manual Entries
          </button>
          <button
            onClick={() => setActiveTab('connected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'connected'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Connected Accounts
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'connected' ? (
        <ConnectedAccounts />
      ) : (
        <>
          {/* Add Investment Button */}
          <div className="flex justify-end">
            <button
              onClick={() => { setShowAddModal(true); setEditingInvestment(null); resetForm(); }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Investment
            </button>
          </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">${totalInvested.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">${totalCurrentValue.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gain/Loss</p>
          <p className={`text-2xl font-bold mt-2 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Return</p>
          <p className={`text-2xl font-bold mt-2 flex items-center ${Number(totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(totalReturn) >= 0 ? <TrendingUp className="w-6 h-6 mr-1" /> : <TrendingDown className="w-6 h-6 mr-1" />}
            {totalReturn}%
          </p>
        </div>
      </div>

      {/* Portfolio Allocation */}
      {pieData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Investments List */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invested</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gain/Loss</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Return</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 dark:bg-gray-800 divide-y divide-gray-200">
            {investments.map((investment) => {
              const gain = Number(investment.current_value) - Number(investment.amount);
              const returnPct = ((gain / Number(investment.amount)) * 100).toFixed(2);
              
              return (
                <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{investment.name}</div>
                      {investment.ticker_symbol && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                          {investment.ticker_symbol}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Since {new Date(investment.purchase_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {investment.asset_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    ${Number(investment.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    ${Number(investment.current_value).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={Number(returnPct) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Number(returnPct) >= 0 ? '+' : ''}{returnPct}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(investment)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(investment.id)}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Type</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option>Stocks</option>
                  <option>Bonds</option>
                  <option>Index Fund</option>
                  <option>ETF</option>
                  <option>Cryptocurrency</option>
                  <option>REIT</option>
                  <option>Savings</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Ticker Symbol - conditional based on asset type */}
              {(['Stocks', 'ETF', 'Cryptocurrency'].includes(formData.asset_type)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ticker Symbol {(['Stocks', 'ETF'].includes(formData.asset_type)) && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.ticker_symbol}
                    onChange={(e) => setFormData({ ...formData, ticker_symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g., AAPL, VOO, BTC"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter the stock ticker or crypto symbol (must be unique in your portfolio)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Invested</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Date</label>
                <input
                  type="date"
                  required
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingInvestment(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingInvestment ? 'Update' : 'Add'} Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
