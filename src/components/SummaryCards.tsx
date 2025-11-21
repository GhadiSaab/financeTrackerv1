import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SummaryCardsProps {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    investments: number;
    portfolioValue: number;
    investmentTransactionsValue: number;
    investmentCount: number;
}

export default function SummaryCards({
    income,
    expenses,
    savings,
    savingsRate,
    investments,
    portfolioValue,
    investmentTransactionsValue,
    investmentCount
}: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/30 rounded-xl md:rounded-2xl shadow-sm">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-400 mb-1">Income</p>
                        <p className="text-lg md:text-2xl font-bold text-green-900 dark:text-green-100">${income.toFixed(0)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800/30 rounded-xl md:rounded-2xl shadow-sm">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                            <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-red-700 dark:text-red-400 mb-1">Expenses</p>
                        <p className="text-lg md:text-2xl font-bold text-red-900 dark:text-red-100">${expenses.toFixed(0)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl md:rounded-2xl shadow-sm">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Savings</p>
                        <p className={`text-lg md:text-2xl font-bold ${savings >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-600 dark:text-red-400'}`}>
                            ${savings.toFixed(0)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {savingsRate}% of income
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl md:rounded-2xl shadow-sm">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Investments</p>
                        <p className="text-lg md:text-2xl font-bold text-purple-900 dark:text-purple-100">${investments.toFixed(0)}</p>
                        {portfolioValue > 0 && investmentTransactionsValue > 0 ? (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                Portfolio: ${portfolioValue.toFixed(0)} • Txns: ${investmentTransactionsValue.toFixed(0)}
                            </p>
                        ) : portfolioValue > 0 ? (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {investmentCount} position{investmentCount !== 1 ? 's' : ''}
                            </p>
                        ) : investmentTransactionsValue > 0 ? (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                From transactions
                            </p>
                        ) : (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                No investments yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
