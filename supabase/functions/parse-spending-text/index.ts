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

        // Enhanced category keywords for auto-categorization
        const categoryKeywords = {
            'Food & Dining': ['restaurant', 'food', 'grocery', 'groceries', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'brunch', 'starbucks', 'mcdonalds', 'pizza', 'sushi', 'chipotle', 'subway', 'panera', 'taco', 'burger', 'kfc', 'popeyes', 'wendys', 'doordash', 'ubereats', 'grubhub', 'whole foods', 'trader joes', 'safeway', 'kroger', 'walmart grocery', 'target grocery', 'publix', 'aldi', 'costco food'],
            'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'metro', 'bus', 'train', 'car', 'vehicle', 'shell', 'chevron', 'exxon', 'bp', 'mobil', '76', 'arco', 'valero', 'texaco', 'citgo', 'transit', 'toll', 'turnpike'],
            'Housing': ['rent', 'mortgage', 'lease', 'property', 'hoa', 'landlord', 'apartment', 'condo'],
            'Utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'power', 'verizon', 'at&t', 'comcast', 'spectrum', 'xfinity', 'tmobile', 'sprint', 'pge', 'edison', 'duke energy', 'gas company', 'water company'],
            'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'clinic', 'medicine', 'cvs', 'walgreens', 'rite aid', 'optometry', 'vision', 'copay', 'prescription', 'rx'],
            'Entertainment': ['movie', 'cinema', 'concert', 'game', 'streaming', 'netflix', 'spotify', 'hulu', 'disney', 'apple music', 'youtube', 'prime video', 'hbo', 'entertainment', 'ticket', 'theater', 'amc', 'regal'],
            'Shopping': ['amazon', 'store', 'shop', 'purchase', 'buy', 'clothing', 'electronics', 'best buy', 'target', 'walmart', 'costco', 'sams club', 'macys', 'nordstrom', 'kohls', 'tj maxx', 'marshalls', 'ross', 'gap', 'old navy', 'banana republic', 'h&m', 'zara', 'nike', 'adidas', 'apple store', 'microsoft store'],
            'Education': ['course', 'book', 'education', 'tuition', 'class', 'school', 'learning', 'udemy', 'coursera', 'textbook', 'university', 'college'],
            'Salary': ['salary', 'paycheck', 'income', 'wage', 'direct deposit', 'payroll'],
            'Freelance': ['freelance', 'consulting', 'project', 'client', 'invoice', 'payment received']
        };

        // Helper function to parse various date formats
        function parseDate(input) {
            const today = new Date();
            const inputLower = input.toLowerCase();

            // Handle relative dates
            if (inputLower.includes('today')) {
                return today.toISOString().split('T')[0];
            }
            if (inputLower.includes('yesterday')) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return yesterday.toISOString().split('T')[0];
            }

            // Try various date formats
            const formats = [
                // MM/DD/YYYY or MM-DD-YYYY
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
                // MM/DD/YY or MM-DD-YY
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
                // YYYY-MM-DD
                /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
                // Month DD, YYYY or Month DD
                /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})?/i,
                // DD Month YYYY
                /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})?/i
            ];

            for (const format of formats) {
                const match = input.match(format);
                if (match) {
                    let dateStr = match[0];

                    // Handle 2-digit years
                    if (match[3] && match[3].length === 2) {
                        const year = parseInt(match[3]);
                        const fullYear = year > 50 ? 1900 + year : 2000 + year;
                        dateStr = dateStr.replace(match[3], fullYear.toString());
                    }

                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString().split('T')[0];
                    }
                }
            }

            // Default to today if no date found
            return today.toISOString().split('T')[0];
        }

        // Parse transactions from text
        const lines = text.split('\n').filter(line => line.trim());
        const transactions = [];

        for (const line of lines) {
            // Try to extract amount - more comprehensive patterns
            const amountPatterns = [
                /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd)/i,  // 1234.56 dollars
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/  // 1234.56
            ];

            let amountMatch = null;
            for (const pattern of amountPatterns) {
                amountMatch = line.match(pattern);
                if (amountMatch) break;
            }

            if (!amountMatch) continue;

            const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            if (isNaN(amount) || amount <= 0) continue;

            // Parse date
            const date = parseDate(line);

            // Extract merchant and description
            // Remove amount, currency symbols, and common prepositions
            let cleanText = line
                .replace(amountMatch[0], '')
                .replace(/\$|dollars?|usd/gi, '')
                .replace(/\b(at|from|to|for|on|in|the|a|an)\b/gi, '')
                .trim();

            // Remove date from text
            const datePatternsToRemove = [
                /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
                /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g,
                /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s*\d{0,4}/gi,
                /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}/gi,
                /today|yesterday/gi
            ];

            for (const pattern of datePatternsToRemove) {
                cleanText = cleanText.replace(pattern, '');
            }

            cleanText = cleanText.trim();

            // Extract merchant (first meaningful part)
            const merchant = cleanText.split(/[,;]/)[0].trim().substring(0, 100) || 'Unknown';

            // Use full clean text as description
            const description = cleanText || merchant;

            // Auto-categorize based on keywords
            let suggestedCategory = 'Uncategorized';
            let confidence = 0.3;
            const lowerText = (cleanText + ' ' + line).toLowerCase();

            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                for (const keyword of keywords) {
                    if (lowerText.includes(keyword.toLowerCase())) {
                        suggestedCategory = category;
                        confidence = 0.85;
                        break;
                    }
                }
                if (confidence > 0.5) break;
            }

            // Determine if income or expense
            const incomeKeywords = ['salary', 'income', 'paycheck', 'freelance', 'consulting', 'paid', 'payment received', 'deposit', 'revenue', 'bonus'];
            const transactionType = incomeKeywords.some(
                keyword => lowerText.includes(keyword)
            ) ? 'income' : 'expense';

            transactions.push({
                amount,
                date,
                description,
                merchant,
                suggested_category: suggestedCategory,
                transaction_type: transactionType,
                confidence,
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
