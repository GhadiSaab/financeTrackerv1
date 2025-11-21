import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cfwlkqzbwncbztmaeimc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd2xrcXpid25jYnp0bWFlaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzUwMjksImV4cCI6MjA3ODQxMTAyOX0.FxaxorxnJH7nEYzwE3em5-aUhmusTXb7LH8KoQmOGRU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Transaction {
  id: string;
  amount: number;
  date: string;
  category_id: string;
  description: string | null;
  merchant: string | null;
  transaction_type: 'income' | 'expense' | 'investment';
  notes: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget_limit: number;
  type: 'income' | 'expense';
  is_investment_category: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  name: string;
  asset_type: string;
  amount: number;
  purchase_date: string;
  current_value: number;
  last_updated: string;
  notes: string | null;
  ticker_symbol: string | null;
  created_at: string;
}

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  total_investments: number;
  savings_rate: number;
  report_data: any;
  pdf_url: string | null;
  generated_at: string;
}

export interface UserSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  provider_name: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
  last_synced_at: string | null;
  sync_frequency: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AccountHolding {
  id: string;
  connected_account_id: string;
  user_id: string;
  symbol: string;
  asset_name: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
  last_updated: string;
  created_at: string;
}

export interface AccountTransaction {
  id: string;
  connected_account_id: string;
  user_id: string;
  transaction_type: string;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  total_amount: number;
  fees: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'other';
  balance: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface NetWorthHistory {
  id: string;
  user_id: string;
  date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}
