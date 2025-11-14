CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_investments DECIMAL(10,2) DEFAULT 0,
    savings_rate DECIMAL(5,2),
    report_data JSONB,
    pdf_url TEXT,
    generated_at TIMESTAMP DEFAULT NOW()
);