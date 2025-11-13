import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SupabaseClient } from '@supabase/supabase-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function seedDefaultCategories(supabase: SupabaseClient, userId?: string) {
  if (!userId) return;

  // Only count the current user's categories since RLS scopes queries
  const { count, error: countError } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    // If counting fails, do not attempt to seed blindly
    return;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const defaultCategories = [
    // Expenses
    { name: 'Groceries', color: '#10B981', icon: 'shopping-bag', budget_limit: 400, type: 'expense' },
    { name: 'Rent', color: '#6366F1', icon: 'home', budget_limit: 1500, type: 'expense' },
    { name: 'Utilities', color: '#F59E0B', icon: 'bolt', budget_limit: 250, type: 'expense' },
    { name: 'Dining', color: '#EF4444', icon: 'utensils', budget_limit: 250, type: 'expense' },
    { name: 'Transport', color: '#3B82F6', icon: 'car', budget_limit: 150, type: 'expense' },
    { name: 'Health', color: '#14B8A6', icon: 'heart', budget_limit: 150, type: 'expense' },
    { name: 'Entertainment', color: '#8B5CF6', icon: 'film', budget_limit: 120, type: 'expense' },
    { name: 'Subscriptions', color: '#06B6D4', icon: 'badge-check', budget_limit: 60, type: 'expense' },
    { name: 'Travel', color: '#0EA5E9', icon: 'airplane', budget_limit: 300, type: 'expense' },
    // Income
    { name: 'Salary', color: '#16A34A', icon: 'banknotes', budget_limit: 0, type: 'income' },
    { name: 'Investments', color: '#22C55E', icon: 'chart-bar', budget_limit: 0, type: 'income' },
    { name: 'Freelance', color: '#84CC16', icon: 'briefcase', budget_limit: 0, type: 'income' },
  ].map(category => ({
    ...category,
    user_id: userId,
  }));

  await supabase.from('categories').insert(defaultCategories as any[]);
}
