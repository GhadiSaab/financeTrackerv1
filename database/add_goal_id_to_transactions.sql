-- Migration: Add goal_id to transactions table
-- Run this in your Supabase SQL Editor to enable goal tracking on transactions

-- Add goal_id column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Create index for faster goal-based queries
CREATE INDEX IF NOT EXISTS transactions_goal_id_idx ON transactions(goal_id);

-- Optional: Create a function to automatically update goal amounts when transactions are added
CREATE OR REPLACE FUNCTION update_goal_on_transaction_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if goal_id is set
    IF NEW.goal_id IS NOT NULL THEN
        UPDATE goals
        SET current_amount = current_amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-update goals when transactions are inserted
DROP TRIGGER IF EXISTS trigger_update_goal_on_insert ON transactions;
CREATE TRIGGER trigger_update_goal_on_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_on_transaction_insert();

-- Also handle when transactions are deleted (subtract from goal)
CREATE OR REPLACE FUNCTION update_goal_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.goal_id IS NOT NULL THEN
        UPDATE goals
        SET current_amount = GREATEST(0, current_amount - OLD.amount),
            updated_at = NOW()
        WHERE id = OLD.goal_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal_on_delete ON transactions;
CREATE TRIGGER trigger_update_goal_on_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_on_transaction_delete();

-- Handle updates (if goal_id changes or amount changes)
CREATE OR REPLACE FUNCTION update_goal_on_transaction_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If goal changed or was removed, subtract from old goal
    IF OLD.goal_id IS NOT NULL AND (OLD.goal_id != NEW.goal_id OR NEW.goal_id IS NULL) THEN
        UPDATE goals
        SET current_amount = GREATEST(0, current_amount - OLD.amount),
            updated_at = NOW()
        WHERE id = OLD.goal_id;
    END IF;

    -- If new goal is set, add to new goal
    IF NEW.goal_id IS NOT NULL THEN
        -- If same goal but amount changed
        IF OLD.goal_id = NEW.goal_id AND OLD.amount != NEW.amount THEN
            UPDATE goals
            SET current_amount = current_amount + (NEW.amount - OLD.amount),
                updated_at = NOW()
            WHERE id = NEW.goal_id;
        -- If different goal, add full amount
        ELSIF OLD.goal_id IS NULL OR OLD.goal_id != NEW.goal_id THEN
            UPDATE goals
            SET current_amount = current_amount + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.goal_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal_on_update ON transactions;
CREATE TRIGGER trigger_update_goal_on_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_on_transaction_update();
