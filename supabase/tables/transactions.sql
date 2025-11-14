CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category_id UUID,
    description TEXT,
    merchant VARCHAR(255),
    transaction_type VARCHAR(20) DEFAULT 'expense',
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);