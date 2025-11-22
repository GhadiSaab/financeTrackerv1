-- Goals Table Schema for Supabase
-- Run this in your Supabase SQL Editor to create the goals table

-- Create the goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deadline DATE,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies so users can only access their own goals

-- Policy: Users can view their own goals
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own goals
CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own goals
CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own goals
CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at_trigger
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goals_updated_at();
