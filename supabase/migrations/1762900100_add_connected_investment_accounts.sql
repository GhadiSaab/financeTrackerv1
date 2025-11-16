-- Migration: add_connected_investment_accounts
-- Created at: 1762900100
-- Purpose: Add support for connecting external investment accounts (e.g., Boursobank, brokers)

-- Create connected_accounts table
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name VARCHAR(255) NOT NULL, -- e.g., 'Boursobank', 'Interactive Brokers', 'Manual'
  account_name VARCHAR(255) NOT NULL, -- User-defined account nickname
  account_type VARCHAR(50) NOT NULL, -- e.g., 'stocks', 'crypto', 'bonds'
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_frequency VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'manual'
  credentials_encrypted TEXT, -- Encrypted credentials if needed (use Supabase Vault in production)
  metadata JSONB, -- Additional provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_holdings table to store individual positions
CREATE TABLE IF NOT EXISTS account_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL, -- Stock ticker, crypto symbol, etc.
  asset_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  average_cost DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 2) NOT NULL,
  gain_loss DECIMAL(20, 2),
  gain_loss_percent DECIMAL(10, 4),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_transactions table for tracking buy/sell activity
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'buy', 'sell', 'dividend', 'deposit', 'withdrawal'
  symbol VARCHAR(20),
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 8),
  total_amount DECIMAL(20, 2) NOT NULL,
  fees DECIMAL(20, 2) DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for account_holdings
CREATE POLICY "Users can view their own holdings"
  ON account_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings"
  ON account_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings"
  ON account_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings"
  ON account_holdings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for account_transactions
CREATE POLICY "Users can view their own account transactions"
  ON account_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own account transactions"
  ON account_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own account transactions"
  ON account_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own account transactions"
  ON account_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_provider ON connected_accounts(provider_name);
CREATE INDEX idx_account_holdings_account ON account_holdings(connected_account_id);
CREATE INDEX idx_account_holdings_user ON account_holdings(user_id);
CREATE INDEX idx_account_transactions_account ON account_transactions(connected_account_id);
CREATE INDEX idx_account_transactions_user ON account_transactions(user_id);
CREATE INDEX idx_account_transactions_date ON account_transactions(transaction_date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connected_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_connected_accounts_timestamp
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_accounts_timestamp();
