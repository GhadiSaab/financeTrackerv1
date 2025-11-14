Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { transactions, categories, investments } = await req.json();

        if (!transactions || !Array.isArray(transactions)) {
            throw new Error('Transactions data is required');
        }

        // Calculate spending patterns
        const categorySpending = {};
        const monthlySpending = {};
        let totalExpenses = 0;
        let totalIncome = 0;

        transactions.forEach(t => {
            if (t.transaction_type === 'expense') {
                totalExpenses += parseFloat(t.amount);
                const catName = categories?.find(c => c.id === t.category_id)?.name || 'Uncategorized';
                categorySpending[catName] = (categorySpending[catName] || 0) + parseFloat(t.amount);
                
                const monthKey = t.date.substring(0, 7);
                monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + parseFloat(t.amount);
            } else if (t.transaction_type === 'income') {
                totalIncome += parseFloat(t.amount);
            }
        });

        // Generate insights
        const insights = [];

        // Spending pattern analysis
        const topSpendingCategory = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topSpendingCategory) {
            insights.push({
                type: 'warning',
                title: 'Top Spending Category',
                message: `Your highest spending is in ${topSpendingCategory[0]} with $${topSpendingCategory[1].toFixed(2)}. Consider setting a budget limit for this category.`,
                category: 'spending_pattern'
            });
        }

        // Savings rate analysis
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1);
        if (parseFloat(savingsRate) < 20) {
            insights.push({
                type: 'alert',
                title: 'Low Savings Rate',
                message: `Your current savings rate is ${savingsRate}%. Financial experts recommend saving at least 20% of your income. Try reducing discretionary spending.`,
                category: 'savings'
            });
        } else {
            insights.push({
                type: 'success',
                title: 'Great Savings Rate',
                message: `You're saving ${savingsRate}% of your income! Keep up the good work. Consider increasing your investment contributions.`,
                category: 'savings'
            });
        }

        // Money-saving recommendations
        const recommendations = [];
        
        // Food spending
        const foodSpending = categorySpending['Food & Dining'] || 0;
        if (foodSpending > 400) {
            recommendations.push({
                title: 'Reduce Dining Out',
                description: `You spent $${foodSpending.toFixed(2)} on food this period. Try meal prepping to save $200-300 monthly.`,
                potential_savings: 250,
                difficulty: 'easy'
            });
        }

        // Transportation
        const transportSpending = categorySpending['Transportation'] || 0;
        if (transportSpending > 250) {
            recommendations.push({
                title: 'Optimize Transportation',
                description: `Consider carpooling or public transit to reduce your $${transportSpending.toFixed(2)} transportation costs.`,
                potential_savings: 100,
                difficulty: 'medium'
            });
        }

        // Subscription audit
        const entertainmentSpending = categorySpending['Entertainment'] || 0;
        if (entertainmentSpending > 150) {
            recommendations.push({
                title: 'Review Subscriptions',
                description: 'Audit your streaming services and subscriptions. Cancel unused ones to save money.',
                potential_savings: 50,
                difficulty: 'easy'
            });
        }

        // Investment analysis
        let investmentInsights = null;
        if (investments && investments.length > 0) {
            const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const totalCurrentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value || inv.amount), 0);
            const portfolioGrowth = ((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2);

            investmentInsights = {
                total_invested: totalInvested,
                current_value: totalCurrentValue,
                growth_percentage: parseFloat(portfolioGrowth),
                growth_amount: totalCurrentValue - totalInvested
            };

            if (parseFloat(portfolioGrowth) > 10) {
                insights.push({
                    type: 'success',
                    title: 'Strong Investment Performance',
                    message: `Your portfolio has grown by ${portfolioGrowth}%. Consider rebalancing to lock in gains.`,
                    category: 'investment'
                });
            }
        }

        // Unusual spending detection
        const monthKeys = Object.keys(monthlySpending).sort();
        if (monthKeys.length >= 2) {
            const lastMonth = monthlySpending[monthKeys[monthKeys.length - 1]];
            const previousMonth = monthlySpending[monthKeys[monthKeys.length - 2]];
            const percentChange = ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1);

            if (Math.abs(parseFloat(percentChange)) > 20) {
                insights.push({
                    type: 'info',
                    title: 'Spending Pattern Change',
                    message: `Your spending ${parseFloat(percentChange) > 0 ? 'increased' : 'decreased'} by ${Math.abs(parseFloat(percentChange))}% compared to last month. Review your recent purchases.`,
                    category: 'trend'
                });
            }
        }

        return new Response(JSON.stringify({
            data: {
                insights,
                recommendations,
                summary: {
                    total_income: totalIncome,
                    total_expenses: totalExpenses,
                    net_savings: totalIncome - totalExpenses,
                    savings_rate: parseFloat(savingsRate),
                    category_breakdown: categorySpending
                },
                investment_analysis: investmentInsights
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Insights error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'INSIGHTS_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
