CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'shopping-cart',
    budget_limit DECIMAL(10,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'expense',
    created_at TIMESTAMP DEFAULT NOW()
);