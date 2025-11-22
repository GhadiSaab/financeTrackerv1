// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase, Account, Investment, NetWorthHistory } from '../lib/supabase';
import { Plus, Pencil, Trash2, Wallet, CreditCard, Landmark, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Accounts() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [history, setHistory] = useState<NetWorthHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'checking',
        balance: '',
        color: '#3b82f6',
        icon: 'wallet'
    });

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [accRes, invRes, histRes] = await Promise.all([
                supabase.from('accounts').select('*').eq('user_id', user.id).order('balance', { ascending: false }),
                supabase.from('investments').select('*').eq('user_id', user.id),
                supabase.from('net_worth_history').select('*').eq('user_id', user.id).order('date', { ascending: true })
            ]);

            if (accRes.data) setAccounts(accRes.data);
            if (invRes.data) setInvestments(invRes.data);
            if (histRes.data) setHistory(histRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load accounts data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const accountData = {
                ...formData,
                balance: parseFloat(formData.balance),
                user_id: user.id
            };

            if (editingAccount) {
                const { error } = await supabase
                    .from('accounts')
                    .update(accountData)
                    .eq('id', editingAccount.id);
                if (error) throw error;
                toast.success('Account updated successfully');
            } else {
                const { error } = await supabase
                    .from('accounts')
                    .insert([accountData]);
                if (error) throw error;
                toast.success('Account added successfully');
            }

            setShowAddModal(false);
            setEditingAccount(null);
            resetForm();
            loadData();
            updateNetWorthHistory();
        } catch (error) {
            console.error('Error saving account:', error);
            toast.error('Failed to save account');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (error) throw error;
            toast.success('Account deleted successfully');
            loadData();
            updateNetWorthHistory();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        }
    };

    const updateNetWorthHistory = async () => {
        // This would typically be a backend function, but we'll do a simple client-side update for now
        // In a real app, you'd want to run this periodically or via database triggers
        const totalAssets = accounts.reduce((sum, acc) => acc.type !== 'loan' && acc.type !== 'credit_card' ? sum + Number(acc.balance) : sum, 0) +
            investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
        const totalLiabilities = accounts.reduce((sum, acc) => acc.type === 'loan' || acc.type === 'credit_card' ? sum + Number(acc.balance) : sum, 0);

        const today = new Date().toISOString().split('T')[0];

        // Check if we already have an entry for today
        const { data: existing } = await supabase
            .from('net_worth_history')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        const historyData = {
            user_id: user.id,
            date: today,
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            net_worth: totalAssets - totalLiabilities
        };

        if (existing) {
            await supabase.from('net_worth_history').update(historyData).eq('id', existing.id);
        } else {
            await supabase.from('net_worth_history').insert([historyData]);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'checking',
            balance: '',
            color: '#3b82f6',
            icon: 'wallet'
        });
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type,
            balance: account.balance.toString(),
            color: account.color || '#3b82f6',
            icon: account.icon || 'wallet'
        });
        setShowAddModal(true);
    };

    const totalAssets = accounts.reduce((sum, acc) => ['checking', 'savings', 'other'].includes(acc.type) ? sum + acc.balance : sum, 0) +
        investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalLiabilities = accounts.reduce((sum, acc) => ['credit_card', 'loan'].includes(acc.type) ? sum + acc.balance : sum, 0);
    const netWorth = totalAssets - totalLiabilities;

    const getIcon = (type: string) => {
        switch (type) {
            case 'checking': return <Wallet className="w-5 h-5" />;
            case 'savings': return <Landmark className="w-5 h-5" />;
            case 'credit_card': return <CreditCard className="w-5 h-5" />;
            case 'loan': return <DollarSign className="w-5 h-5" />;
            default: return <Wallet className="w-5 h-5" />;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Net Worth & Accounts</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your assets, liabilities, and overall net worth</p>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setEditingAccount(null); resetForm(); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                </button>
            </div>

            {/* Net Worth Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">${totalAssets.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Cash + Investments</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Liabilities</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">${totalLiabilities.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Loans + Credit Cards</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Worth</p>
                    <p className={`text-2xl font-bold mt-2 ${netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${netWorth.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Assets - Liabilities</p>
                </div>
            </div>

            {/* Net Worth Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Net Worth History</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                formatter={(value) => `$${Number(value).toFixed(2)}`}
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="net_worth" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNetWorth)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" /> Assets
                    </h3>
                    {accounts.filter(a => ['checking', 'savings', 'other'].includes(a.type)).map(account => (
                        <div key={account.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
                                    {getIcon(account.type)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">${account.balance.toFixed(2)}</p>
                                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                    <button onClick={() => openEditModal(account)} className="text-blue-500 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Investment Summary as an Asset Card */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Investments</p>
                                <p className="text-xs text-gray-500">Stocks, Crypto, etc.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                                ${investments.reduce((sum, inv) => sum + inv.current_value, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Liabilities */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" /> Liabilities
                    </h3>
                    {accounts.filter(a => ['credit_card', 'loan'].includes(a.type)).map(account => (
                        <div key={account.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`}>
                                    {getIcon(account.type)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">${account.balance.toFixed(2)}</p>
                                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                    <button onClick={() => openEditModal(account)} className="text-blue-500 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {accounts.filter(a => ['credit_card', 'loan'].includes(a.type)).length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                            No liabilities tracked yet. Great job!
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingAccount ? 'Edit Account' : 'Add New Account'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="e.g. Main Checking"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                >
                                    <option value="checking">🏦 Checking</option>
                                    <option value="savings">💰 Savings</option>
                                    <option value="credit_card">💳 Credit Card</option>
                                    <option value="loan">📋 Loan</option>
                                    <option value="other">📁 Other Asset</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Balance</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                        className="w-full text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    {editingAccount ? 'Save Changes' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
