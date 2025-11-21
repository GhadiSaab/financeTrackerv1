// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase, Goal } from '../lib/supabase';
import { Plus, Pencil, Trash2, Target, Calendar, Trophy, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Goals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        current_amount: '0',
        deadline: '',
        color: '#3b82f6',
        icon: 'target'
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
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .order('deadline', { ascending: true });

            if (error) throw error;
            if (data) setGoals(data);
        } catch (error) {
            console.error('Error loading goals:', error);
            toast.error('Failed to load goals');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const goalData = {
                ...formData,
                target_amount: parseFloat(formData.target_amount),
                current_amount: parseFloat(formData.current_amount),
                deadline: formData.deadline || null,
                user_id: user.id
            };

            if (editingGoal) {
                const { error } = await supabase
                    .from('goals')
                    .update(goalData)
                    .eq('id', editingGoal.id);
                if (error) throw error;
                toast.success('Goal updated successfully');
            } else {
                const { error } = await supabase
                    .from('goals')
                    .insert([goalData]);
                if (error) throw error;
                toast.success('Goal added successfully');
            }

            setShowAddModal(false);
            setEditingGoal(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving goal:', error);
            toast.error('Failed to save goal');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            toast.success('Goal deleted successfully');
            loadData();
        } catch (error) {
            console.error('Error deleting goal:', error);
            toast.error('Failed to delete goal');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            target_amount: '',
            current_amount: '0',
            deadline: '',
            color: '#3b82f6',
            icon: 'target'
        });
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            current_amount: goal.current_amount.toString(),
            deadline: goal.deadline || '',
            color: goal.color || '#3b82f6',
            icon: goal.icon || 'target'
        });
        setShowAddModal(true);
    };

    const handleContribute = async (goal: Goal, amount: number) => {
        try {
            const newAmount = goal.current_amount + amount;
            const { error } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', goal.id);

            if (error) throw error;
            toast.success(`Added $${amount} to ${goal.name}`);
            loadData();
        } catch (error) {
            console.error('Error updating goal:', error);
            toast.error('Failed to update goal');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Goals</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set targets and track your savings progress</p>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setEditingGoal(null); resetForm(); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                    const isCompleted = progress >= 100;

                    return (
                        <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        {isCompleted ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(goal)} className="text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(goal.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
                                {goal.deadline && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                                        <Calendar className="w-3 h-3" /> Target: {new Date(goal.deadline).toLocaleDateString()}
                                    </p>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-900 dark:text-white">${goal.current_amount.toLocaleString()}</span>
                                        <span className="text-gray-500 dark:text-gray-400">of ${goal.target_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Quick Add</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleContribute(goal, 10)}
                                        className="flex-1 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        +$10
                                    </button>
                                    <button
                                        onClick={() => handleContribute(goal, 50)}
                                        className="flex-1 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        +$50
                                    </button>
                                    <button
                                        onClick={() => handleContribute(goal, 100)}
                                        className="flex-1 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        +$100
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No goals yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Start saving for something special today!</p>
                        <button
                            onClick={() => { setShowAddModal(true); setEditingGoal(null); resetForm(); }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Create First Goal
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingGoal ? 'Edit Goal' : 'New Financial Goal'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Emergency Fund"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Saved Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.current_amount}
                                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
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
                                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
