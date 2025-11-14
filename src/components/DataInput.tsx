// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase, Category } from '../lib/supabase';
import { Sparkles, Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceInput from './VoiceInput';
import { seedDefaultCategories } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function DataInput() {
  const [inputText, setInputText] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseStats, setParseStats] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (data && data.length > 0) {
      setCategories(data);
      return;
    }
    // Seed if empty then reload
    await seedDefaultCategories(supabase, user.id);
    const { data: newCats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (newCats) setCategories(newCats);
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to existing input text with a space for better flow
    setInputText(prev => {
      const separator = prev.trim() ? ' ' : '';
      return prev + separator + transcript;
    });
  };

  const handleParse = async () => {
    console.log('handleParse called');
    if (!inputText.trim()) {
      toast.error('Please enter some transaction data');
      return;
    }

    setLoading(true);
    console.log('Calling parse-spending-text with:', inputText);
    try {
      const { data, error } = await supabase.functions.invoke('parse-spending-text', {
        body: { text: inputText }
      });

      console.log('Response:', data, error);

      if (error) throw error;

      if (data?.data) {
        console.log('Setting parsed transactions:', data.data.transactions);
        setParsedTransactions(data.data.transactions);
        setParseStats(data.data.stats);
        toast.success(`Successfully parsed ${data.data.transactions.length} transactions!`);
      }
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error('Failed to parse transaction data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedTransactions.length === 0) {
      toast.error('No transactions to import');
      return;
    }
    if (!user) {
      toast.error('Please sign in to import transactions.');
      return;
    }

    setImporting(true);
    try {
      // Convert parsed transactions to database format
      const transactionsToImport = parsedTransactions.map(t => {
        const category = categories.find(c => c.name === t.suggested_category);
        return {
          amount: t.amount,
          date: t.date,
          category_id: category?.id || null,
          description: t.description,
          merchant: t.merchant,
          transaction_type: t.transaction_type,
          notes: `Imported via Smart Input (confidence: ${t.confidence})`,
          is_recurring: false,
          user_id: user.id
        };
      });

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToImport);

      if (error) throw error;

      toast.success(`Successfully imported ${parsedTransactions.length} transactions!`);
      setInputText('');
      setParsedTransactions([]);
      setParseStats(null);
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  const updateTransaction = (index: number, field: string, value: any) => {
    const updated = [...parsedTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setParsedTransactions(updated);
  };

  const removeTransaction = (index: number) => {
    const updated = parsedTransactions.filter((_, i) => i !== index);
    setParsedTransactions(updated);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Smart Input</h1>
        <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
          AI-powered transaction parsing - just paste your expenses!
        </p>
      </div>

      {/* Voice Input Section */}
      <VoiceInput 
        onTranscript={handleVoiceTranscript}
        placeholder="Say something like: 'Forty-five dollars at Starbucks on November 10th'"
      />

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
        <div className="flex items-center mb-3 md:mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Enter Transaction Data</h3>
        </div>

        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
          Type or paste your expenses - one per line. Include the amount and as much detail as you want!
        </p>

        <div className="mb-4">
          <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">✨ Supported Formats:</label>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 p-3 md:p-4 rounded-lg text-xs md:text-sm space-y-1.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> $45.20 at Starbucks on 11/08/2025
              </div>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> Grocery shopping $85.50 Nov 12
              </div>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> Paid $1200 for rent yesterday
              </div>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> Gas $50 Shell station today
              </div>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> $75.30 restaurant dinner 11-10-2025
              </div>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                <span className="text-blue-600 dark:text-blue-400">✓</span> Coffee 4.50 dollars Nov 8th
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-800/50 text-xs text-gray-700 dark:text-gray-300">
              <strong className="text-gray-900 dark:text-white">Tip:</strong> Dates can be MM/DD/YYYY, Nov 10, yesterday, today, etc. Categories are auto-detected!
            </div>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your expenses here... (one per line)&#10;&#10;Examples:&#10;$45.20 at Starbucks on 11/08/2025&#10;Grocery shopping $85.50 Nov 12&#10;Paid $1200 for rent yesterday&#10;Gas $50 Shell station today"
          rows={8}
          className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm md:text-base p-3 md:p-4 transition-all"
        />

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => { setInputText(''); setParsedTransactions([]); setParseStats(null); }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={handleParse}
            disabled={loading || !inputText.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Parse Transactions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Parse Stats */}
      {parseStats && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl md:rounded-2xl">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-3 flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm md:text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">Parsing Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                  <div className="text-blue-700 dark:text-blue-300 mb-1">Total Parsed</div>
                  <div className="text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100">{parseStats.total_parsed}</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                  <div className="text-green-700 dark:text-green-300 mb-1">High Confidence</div>
                  <div className="text-lg md:text-xl font-bold text-green-900 dark:text-green-100">{parseStats.high_confidence}</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                  <div className="text-yellow-700 dark:text-yellow-300 mb-1">Needs Review</div>
                  <div className="text-lg md:text-xl font-bold text-yellow-900 dark:text-yellow-100">{parseStats.needs_review}</div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                  <div className="text-red-700 dark:text-red-300 mb-1">Duplicates</div>
                  <div className="text-lg md:text-xl font-bold text-red-900 dark:text-red-100">{parseStats.potential_duplicates}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Transactions */}
      {parsedTransactions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Parsed Transactions</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Review and edit before importing</p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Import All ({parsedTransactions.length})
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Date</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Description</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Merchant</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Type</th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Amount</th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Confidence</th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {parsedTransactions.map((transaction, index) => (
                  <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${transaction.confidence < 0.5 ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => updateTransaction(index, 'date', e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <input
                        type="text"
                        value={transaction.description}
                        onChange={(e) => updateTransaction(index, 'description', e.target.value)}
                        className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <input
                        type="text"
                        value={transaction.merchant}
                        onChange={(e) => updateTransaction(index, 'merchant', e.target.value)}
                        className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={transaction.suggested_category}
                        onChange={(e) => updateTransaction(index, 'suggested_category', e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={transaction.transaction_type}
                        onChange={(e) => updateTransaction(index, 'transaction_type', e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={transaction.amount}
                        onChange={(e) => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                        className="w-24 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.confidence > 0.7 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        transaction.confidence > 0.4 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {(transaction.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => removeTransaction(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
