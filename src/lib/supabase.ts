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
  transaction_type: 'income' | 'expense';
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
