-- Migration: add_investment_category_flag
-- Created at: 1762900000
-- Purpose: Add flag to mark categories as investment-related to exclude from regular expense calculations

-- Add is_investment_category column to categories table
ALTER TABLE categories
ADD COLUMN is_investment_category BOOLEAN DEFAULT FALSE;

-- Create an index for better query performance
CREATE INDEX idx_categories_investment_flag ON categories(is_investment_category);

-- Update any existing "Investment" or "Investments" category to be marked as investment
UPDATE categories
SET is_investment_category = TRUE
WHERE LOWER(name) LIKE '%invest%';
