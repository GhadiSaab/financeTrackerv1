CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    current_value DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);