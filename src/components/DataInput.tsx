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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*');
    
    if (data && data.length > 0) {
      setCategories(data);
      return;
    }
    // Seed if empty then reload
    await seedDefaultCategories(supabase);
    const { data: newCats } = await supabase.from('categories').select('*');
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
          is_recurring: false
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Smart Data Input</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Parse unstructured spending data using AI-powered text analysis
        </p>
      </div>

      {/* Voice Input Section */}
      <VoiceInput 
        onTranscript={handleVoiceTranscript}
        placeholder="Say something like: 'Forty-five dollars at Starbucks on November 10th'"
      />

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Enter Transaction Data</h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Paste your transaction data in any format. Each line should contain an amount and optionally a date, description, or merchant.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Example formats:</label>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>$45.20 at Starbucks on 11/08/2025</p>
            <p>Grocery shopping $85.50 11/02/2025</p>
            <p>Paid $1200 for rent on Nov 1</p>
            <p>Gas $50 Shell station</p>
            <p>Restaurant dinner $75.30</p>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your transaction data here...&#10;&#10;Example:&#10;$45.20 at Starbucks on 11/08/2025&#10;Grocery shopping $85.50 11/02/2025&#10;Paid $1200 for rent on Nov 1"
          rows={10}
          className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-base p-4"
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Parsing Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Total Parsed:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100 ml-2">{parseStats.total_parsed}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">High Confidence:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100 ml-2">{parseStats.high_confidence}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Needs Review:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100 ml-2">{parseStats.needs_review}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Duplicates:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100 ml-2">{parseStats.potential_duplicates}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Transactions */}
      {parsedTransactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Parsed Transactions</h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Merchant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Confidence</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {parsedTransactions.map((transaction, index) => (
                  <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${transaction.confidence < 0.5 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
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
