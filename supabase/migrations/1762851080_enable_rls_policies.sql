-- Migration: enable_rls_policies
-- Created at: 1762851080

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Categories policies (allow both anon and service_role)
CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Transactions policies
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Investments policies
CREATE POLICY "Allow all operations on investments" ON investments
  FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Monthly reports policies
CREATE POLICY "Allow all operations on monthly_reports" ON monthly_reports
  FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- User settings policies
CREATE POLICY "Allow all operations on user_settings" ON user_settings
  FOR ALL
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Create indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_monthly_reports_date ON monthly_reports(year DESC, month DESC);;