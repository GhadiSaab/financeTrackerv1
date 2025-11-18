-- Migration: Add ticker_symbol column to investments table
-- Date: 2025-11-18
-- Description: Adds ticker_symbol field to track stock/ETF/crypto symbols

-- Add ticker_symbol column to investments table
ALTER TABLE investments
ADD COLUMN IF NOT EXISTS ticker_symbol TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investments_ticker_symbol ON investments(ticker_symbol);

-- Add comment to column
COMMENT ON COLUMN investments.ticker_symbol IS 'Stock ticker, ETF symbol, or cryptocurrency symbol (e.g., AAPL, VOO, BTC)';
