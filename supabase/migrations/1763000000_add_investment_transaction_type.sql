-- Add CHECK constraint to allow 'investment' transaction type
-- This migration adds support for tracking investments as a transaction type

-- Add constraint to ensure transaction_type is valid
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_transaction_type_check
CHECK (transaction_type IN ('income', 'expense', 'investment'));

-- Add comment to document the change
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction: income, expense, or investment';
