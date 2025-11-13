import { useEffect, useState } from 'react';
import { supabase, Transaction, Category, Investment } from '../lib/supabase';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setTransactions([]);
      setCategories([]);
      setInvestments([]);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      const { data: invData } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);
      
      if (transData) setTransactions(transData);
      if (catData) setCategories(catData);
      if (invData) setInvestments(invData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('generate-pdf-report', {
        body: {
          month: selectedMonth,
          year: selectedYear,
          transactions,
          categories,
          investments
        }
      });

      if (data?.data) {
        setReportData(data.data);
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportData) return;

    setGenerating(true);
    try {
      // Create temporary container for HTML report
      const container = document.createElement('div');
      container.innerHTML = reportData.html_report;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`financial_report_${selectedYear}_${selectedMonth}.pdf`);
      toast.success('PDF downloaded successfully!');

      // Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setGenerating(false);
    }
  };

  // Generate month options for last 12 months
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    monthOptions.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: date.toLocaleDateString('en', { month: 'long', year: 'numeric' })
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate and download monthly financial reports</p>
      </div>

      {/* Report Generator */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Generate Monthly Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedYear(parseInt(year));
              setSelectedMonth(parseInt(month));
            }}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {monthOptions.map(opt => (
              <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>

          {reportData && (
            <button
              onClick={downloadPDF}
              disabled={generating}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monthly Financial Report - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-green-800">Total Income</p>
              <p className="text-3xl font-bold text-green-900 mt-2">${reportData.total_income.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-red-800">Total Expenses</p>
              <p className="text-3xl font-bold text-red-900 mt-2">${reportData.total_expenses.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Net Savings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">${reportData.net_savings.toFixed(2)}</p>
              <p className="text-sm text-blue-700 mt-1">{reportData.savings_rate.toFixed(1)}% savings rate</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Key Metrics</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Savings Rate</span>
                <span className="font-semibold">{reportData.savings_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Transaction Count</span>
                <span className="font-semibold">{reportData.transaction_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Average Transaction</span>
                <span className="font-semibold">
                  ${(reportData.total_expenses / (reportData.transaction_count || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Spending by Category</h3>
            <div className="space-y-4">
              {Object.entries(reportData.category_breakdown || {})
                .sort((a: any, b: any) => b[1].total - a[1].total)
                .map(([name, data]: [string, any]) => (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: data.color }}
                        ></div>
                        <span className="font-medium">{name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({data.count} transactions)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${data.total.toFixed(2)}</span>
                        {data.budget > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            / ${data.budget.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {data.budget > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (data.total / data.budget * 100))}%`,
                            backgroundColor: data.total > data.budget ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Investment Summary */}
          {reportData.investment_summary && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Investment Portfolio</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Invested</span>
                  <span className="font-semibold">${reportData.investment_summary.total_invested.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Current Value</span>
                  <span className="font-semibold">${reportData.investment_summary.current_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Gain/Loss</span>
                  <span className={`font-semibold ${reportData.investment_summary.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.investment_summary.total_gain >= 0 ? '+' : ''}${reportData.investment_summary.total_gain.toFixed(2)}
                    ({reportData.investment_summary.return_percentage}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Generated on {new Date().toLocaleDateString()} by Personal Finance Tracker
          </div>
        </div>
      )}
    </div>
  );
}
