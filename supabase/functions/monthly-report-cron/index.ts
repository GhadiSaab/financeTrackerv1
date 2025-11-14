Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get current month and year
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const month = lastMonth.getMonth() + 1;
        const year = lastMonth.getFullYear();

        console.log(`Generating report for ${year}-${month}`);

        // Fetch all transactions
        const transactionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/transactions?select=*&order=date.desc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!transactionsResponse.ok) {
            throw new Error('Failed to fetch transactions');
        }

        const transactions = await transactionsResponse.json();

        // Fetch categories
        const categoriesResponse = await fetch(
            `${supabaseUrl}/rest/v1/categories?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const categories = await categoriesResponse.json();

        // Fetch investments
        const investmentsResponse = await fetch(
            `${supabaseUrl}/rest/v1/investments?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const investments = await investmentsResponse.json();

        // Generate report data
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

        let totalIncome = 0;
        let totalExpenses = 0;
        let totalInvestments = 0;

        monthTransactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.transaction_type === 'income') {
                totalIncome += amount;
            } else {
                totalExpenses += amount;
            }
        });

        if (investments && investments.length > 0) {
            totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value || inv.amount), 0);
        }

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0;

        // Create category breakdown
        const categoryBreakdown = {};
        monthTransactions.forEach(t => {
            if (t.transaction_type === 'expense') {
                const category = categories.find(c => c.id === t.category_id);
                const catName = category?.name || 'Uncategorized';
                categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + parseFloat(t.amount);
            }
        });

        // Save report to database
        const reportData = {
            month,
            year,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            total_investments: totalInvestments,
            savings_rate: parseFloat(savingsRate),
            report_data: {
                category_breakdown: categoryBreakdown,
                transaction_count: monthTransactions.length,
                top_categories: Object.entries(categoryBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, amount]) => ({ name, amount }))
            }
        };

        // Check if report already exists
        const existingReportResponse = await fetch(
            `${supabaseUrl}/rest/v1/monthly_reports?month=eq.${month}&year=eq.${year}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const existingReports = await existingReportResponse.json();

        let saveResponse;
        if (existingReports && existingReports.length > 0) {
            // Update existing report
            saveResponse = await fetch(
                `${supabaseUrl}/rest/v1/monthly_reports?id=eq.${existingReports[0].id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(reportData)
                }
            );
        } else {
            // Create new report
            saveResponse = await fetch(
                `${supabaseUrl}/rest/v1/monthly_reports`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(reportData)
                }
            );
        }

        if (!saveResponse.ok) {
            const errorText = await saveResponse.text();
            throw new Error(`Failed to save report: ${errorText}`);
        }

        const savedReport = await saveResponse.json();

        console.log(`Report generated successfully for ${year}-${month}`);

        return new Response(JSON.stringify({
            success: true,
            report: savedReport,
            message: `Monthly report generated for ${year}-${month}`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Monthly report cron error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CRON_JOB_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
