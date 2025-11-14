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
        const { text } = await req.json();

        if (!text) {
            throw new Error('Text input is required');
        }

        // Category keywords for auto-categorization
        const categoryKeywords = {
            'Food & Dining': ['restaurant', 'food', 'grocery', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'starbucks', 'mcdonalds', 'pizza', 'sushi', 'grocery'],
            'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'metro', 'bus', 'train', 'car', 'vehicle'],
            'Housing': ['rent', 'mortgage', 'lease', 'property'],
            'Utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'power'],
            'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'clinic', 'medicine'],
            'Entertainment': ['movie', 'cinema', 'concert', 'game', 'streaming', 'netflix', 'spotify', 'entertainment', 'ticket'],
            'Shopping': ['amazon', 'store', 'shop', 'purchase', 'buy', 'clothing', 'electronics', 'best buy'],
            'Education': ['course', 'book', 'education', 'tuition', 'class', 'school', 'learning'],
            'Salary': ['salary', 'paycheck', 'income', 'wage'],
            'Freelance': ['freelance', 'consulting', 'project', 'client']
        };

        // Parse transactions from text
        const lines = text.split('\n').filter(line => line.trim());
        const transactions = [];

        for (const line of lines) {
            // Try to extract amount (dollar signs, numbers)
            const amountMatch = line.match(/\$?(\d+\.?\d*)/);
            if (!amountMatch) continue;

            const amount = parseFloat(amountMatch[1]);
            if (isNaN(amount) || amount <= 0) continue;

            // Try to extract date
            const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
            let date = new Date().toISOString().split('T')[0]; // Default to today
            
            if (dateMatch) {
                const dateStr = dateMatch[0];
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    date = parsedDate.toISOString().split('T')[0];
                }
            }

            // Extract description (everything except amount and date)
            let description = line
                .replace(amountMatch[0], '')
                .replace(dateMatch ? dateMatch[0] : '', '')
                .trim();
            
            if (!description) {
                description = 'Unknown transaction';
            }

            // Auto-categorize based on keywords
            let suggestedCategory = 'Uncategorized';
            const lowerDescription = description.toLowerCase();
            
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(keyword => lowerDescription.includes(keyword))) {
                    suggestedCategory = category;
                    break;
                }
            }

            // Determine if income or expense
            const transactionType = ['salary', 'income', 'paycheck', 'freelance', 'consulting', 'paid'].some(
                keyword => lowerDescription.includes(keyword)
            ) ? 'income' : 'expense';

            // Extract merchant name (first few words of description)
            const merchant = description.split(/[,;]|at |from /i)[0].trim().substring(0, 100);

            transactions.push({
                amount,
                date,
                description,
                merchant,
                suggested_category: suggestedCategory,
                transaction_type: transactionType,
                confidence: suggestedCategory !== 'Uncategorized' ? 0.8 : 0.3,
                original_text: line
            });
        }

        // Detect duplicates
        const duplicateGroups = [];
        for (let i = 0; i < transactions.length; i++) {
            for (let j = i + 1; j < transactions.length; j++) {
                const t1 = transactions[i];
                const t2 = transactions[j];
                
                if (Math.abs(t1.amount - t2.amount) < 0.01 &&
                    t1.date === t2.date &&
                    t1.merchant.toLowerCase() === t2.merchant.toLowerCase()) {
                    duplicateGroups.push([i, j]);
                }
            }
        }

        return new Response(JSON.stringify({
            data: {
                transactions,
                stats: {
                    total_parsed: transactions.length,
                    high_confidence: transactions.filter(t => t.confidence > 0.7).length,
                    needs_review: transactions.filter(t => t.confidence < 0.5).length,
                    potential_duplicates: duplicateGroups.length
                },
                duplicate_groups: duplicateGroups
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Text parsing error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PARSING_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
