import { TrendingUp, TrendingDown, Wallet, PiggyBank, LineChart } from 'lucide-react';

interface SummaryCardsProps {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    investments: number;
    portfolioValue: number;
    investmentTransactionsValue: number;
    investmentCount: number;
    netWorth: number;
}

export default function SummaryCards({
    income,
    expenses,
    savings,
    savingsRate,
    investments,
    portfolioValue,
    investmentTransactionsValue,
    investmentCount,
    netWorth
}: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
            {/* Net Worth - Primary Card with Teal accent */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700 rounded-xl md:rounded-2xl shadow-lg col-span-2 lg:col-span-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                <div className="p-3 md:p-5 relative">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-teal-100 mb-1">Net Worth</p>
                        <p className={`text-lg md:text-2xl font-bold text-white`}>
                            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-teal-100 mt-1">
                            Assets - Liabilities
                        </p>
                    </div>
                </div>
            </div>

            {/* Income - Emerald/Green */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Income</p>
                        <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            +${income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Expenses - Rose/Red */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                            <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
                        <p className="text-lg md:text-2xl font-bold text-rose-600 dark:text-rose-400">
                            -${expenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Savings - Cyan/Teal */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg">
                            <PiggyBank className="h-4 w-4 md:h-5 md:w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Savings</p>
                        <p className={`text-lg md:text-2xl font-bold ${savings >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            ${savings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${savingsRate >= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : savingsRate >= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                {savingsRate}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investments - Violet/Purple */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 md:p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                            <LineChart className="h-4 w-4 md:h-5 md:w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Investments</p>
                        <p className="text-lg md:text-2xl font-bold text-violet-600 dark:text-violet-400">
                            ${investments.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        {portfolioValue > 0 && investmentTransactionsValue > 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {investmentCount} positions
                            </p>
                        ) : portfolioValue > 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {investmentCount} position{investmentCount !== 1 ? 's' : ''}
                            </p>
                        ) : investmentTransactionsValue > 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                This month
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Start investing
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
