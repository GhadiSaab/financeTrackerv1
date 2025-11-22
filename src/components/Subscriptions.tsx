import { useEffect, useState } from 'react';
import { supabase, Transaction, Category } from '../lib/supabase';
import { Repeat, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Subscriptions() {
    const { user } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setSubscriptions([]);
            setCategories([]);
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            // Fetch recurring transactions
            const { data: subData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_recurring', true)
                .order('amount', { ascending: false });

            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id);

            if (subData) setSubscriptions(subData);
            if (catData) setCategories(catData);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecurring = async (transaction: Transaction) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ is_recurring: !transaction.is_recurring })
                .eq('id', transaction.id)
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success(transaction.is_recurring ? 'Subscription cancelled' : 'Subscription reactivated');
            loadData();
        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Failed to update subscription');
        }
    };

    // Get unique subscriptions by description (avoid counting duplicates)
    const uniqueSubscriptions = subscriptions.reduce((acc, sub) => {
        const key = `${sub.description}-${sub.merchant}-${sub.amount}`;
        if (!acc.has(key)) {
            acc.set(key, sub);
        }
        return acc;
    }, new Map<string, Transaction>());

    const uniqueSubsList = Array.from(uniqueSubscriptions.values());

    // Calculate totals from unique subscriptions only
    const totalMonthlyExpenses = uniqueSubsList
        .filter(sub => sub.transaction_type === 'expense')
        .reduce((sum, sub) => sum + Number(sub.amount), 0);

    const totalMonthlyIncome = uniqueSubsList
        .filter(sub => sub.transaction_type === 'income')
        .reduce((sum, sub) => sum + Number(sub.amount), 0);

    const totalMonthly = totalMonthlyExpenses;
    const totalYearly = totalMonthly * 12;
    const netMonthly = totalMonthlyExpenses - totalMonthlyIncome;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscriptions</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your recurring expenses and income</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Monthly Cost</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">${totalMonthly.toFixed(2)}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Total recurring monthly expenses</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800/50 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Yearly Projection</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">${totalYearly.toFixed(2)}</p>
                    <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">Estimated annual cost</p>
                </div>
            </div>

            {/* Subscriptions List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Subscriptions</h3>
                </div>

                {uniqueSubsList.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {uniqueSubsList.map((sub) => {
                            const category = categories.find(c => c.id === sub.category_id);
                            return (
                                <div key={sub.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${sub.transaction_type === 'income'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                            }`}>
                                            {sub.description?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{sub.description}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: category?.color + '20', color: category?.color }}
                                                >
                                                    {category?.name || 'Uncategorized'}
                                                </span>
                                                <span>•</span>
                                                <span>{sub.merchant || 'No merchant'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${sub.transaction_type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {sub.transaction_type === 'income' ? '+' : ''}${Number(sub.amount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">per month</p>
                                        <button
                                            onClick={() => toggleRecurring(sub)}
                                            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-end gap-1 ml-auto"
                                        >
                                            <XCircle className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Repeat className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subscriptions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Mark transactions as "Recurring" when adding them to see them here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
