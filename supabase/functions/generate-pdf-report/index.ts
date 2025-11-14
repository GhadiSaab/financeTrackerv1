Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { month, year, transactions, categories, investments } = await req.json();

        if (!month || !year) {
            throw new Error('Month and year are required');
        }

        // Filter transactions for the specific month
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const monthTransactions = transactions?.filter(t => t.date.startsWith(monthStr)) || [];

        // Calculate statistics
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryBreakdown = {};

        monthTransactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.transaction_type === 'income') {
                totalIncome += amount;
            } else {
                totalExpenses += amount;
                const catId = t.category_id;
                const category = categories?.find(c => c.id === catId);
                const catName = category?.name || 'Uncategorized';
                
                categoryBreakdown[catName] = {
                    total: (categoryBreakdown[catName]?.total || 0) + amount,
                    count: (categoryBreakdown[catName]?.count || 0) + 1,
                    budget: category?.budget_limit || 0,
                    color: category?.color || '#999999'
                };
            }
        });

        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(2) : 0;

        // Calculate investment performance
        let investmentSummary = null;
        if (investments && investments.length > 0) {
            const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const totalCurrentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value || inv.amount), 0);
            
            investmentSummary = {
                total_invested: totalInvested,
                current_value: totalCurrentValue,
                total_gain: totalCurrentValue - totalInvested,
                return_percentage: ((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2)
            };
        }

        // Generate HTML report
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
        
        const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Financial Report - ${monthName} ${year}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1e293b; margin-bottom: 10px; }
        .subtitle { color: #64748b; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .summary-card.income { border-color: #10b981; }
        .summary-card.expense { border-color: #ef4444; }
        .summary-card h3 { font-size: 14px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
        .summary-card .amount { font-size: 28px; font-weight: bold; color: #1e293b; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1e293b; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .category-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .category-name { display: flex; align-items: center; gap: 10px; }
        .category-color { width: 12px; height: 12px; border-radius: 50%; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; background: #3b82f6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Monthly Financial Report</h1>
        <p class="subtitle">${monthName} ${year}</p>
        
        <div class="summary">
            <div class="summary-card income">
                <h3>Total Income</h3>
                <div class="amount">$${totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card expense">
                <h3>Total Expenses</h3>
                <div class="amount">$${totalExpenses.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <h3>Net Savings</h3>
                <div class="amount" style="color: ${netSavings >= 0 ? '#10b981' : '#ef4444'}">$${netSavings.toFixed(2)}</div>
            </div>
        </div>

        <div class="section">
            <h2>Key Metrics</h2>
            <table>
                <tr>
                    <td><strong>Savings Rate</strong></td>
                    <td>${savingsRate}%</td>
                </tr>
                <tr>
                    <td><strong>Transactions Count</strong></td>
                    <td>${monthTransactions.length}</td>
                </tr>
                <tr>
                    <td><strong>Average Transaction</strong></td>
                    <td>$${(totalExpenses / (monthTransactions.filter(t => t.transaction_type === 'expense').length || 1)).toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>Spending by Category</h2>
            ${Object.entries(categoryBreakdown).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => `
                <div class="category-item">
                    <div class="category-name">
                        <div class="category-color" style="background: ${data.color}"></div>
                        <span><strong>${name}</strong> (${data.count} transactions)</span>
                    </div>
                    <div style="text-align: right;">
                        <strong>$${data.total.toFixed(2)}</strong>
                        ${data.budget > 0 ? `<div style="font-size: 12px; color: #64748b;">Budget: $${data.budget.toFixed(2)}</div>` : ''}
                    </div>
                </div>
                ${data.budget > 0 ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (data.total / data.budget * 100))}%; background: ${data.total > data.budget ? '#ef4444' : '#10b981'}"></div>
                    </div>
                ` : ''}
            `).join('')}
        </div>

        ${investmentSummary ? `
        <div class="section">
            <h2>Investment Portfolio</h2>
            <table>
                <tr>
                    <td><strong>Total Invested</strong></td>
                    <td>$${investmentSummary.total_invested.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Current Value</strong></td>
                    <td>$${investmentSummary.current_value.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Total Gain/Loss</strong></td>
                    <td style="color: ${investmentSummary.total_gain >= 0 ? '#10b981' : '#ef4444'}">
                        $${investmentSummary.total_gain.toFixed(2)} (${investmentSummary.return_percentage}%)
                    </td>
                </tr>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} by Personal Finance Tracker</p>
        </div>
    </div>
</body>
</html>`;

        // In production, you would convert this to PDF using a service
        // For now, return HTML and metadata for client-side PDF generation
        
        const reportData = {
            month,
            year,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_savings: netSavings,
            savings_rate: parseFloat(savingsRate),
            category_breakdown: categoryBreakdown,
            investment_summary: investmentSummary,
            transaction_count: monthTransactions.length,
            html_report: htmlReport
        };

        return new Response(JSON.stringify({
            data: reportData
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PDF_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
