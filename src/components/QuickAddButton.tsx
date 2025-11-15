import { useState } from 'react';
import { Plus, X, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAddButtonProps {
  onAddTransaction: (type: 'expense' | 'income') => void;
}

export default function QuickAddButton({ onAddTransaction }: QuickAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleQuickAdd = (type: 'expense' | 'income') => {
    setIsOpen(false);
    onAddTransaction(type);
  };

  const handleSmartInput = () => {
    setIsOpen(false);
    navigate('/input');
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
      {/* Quick Action Buttons */}
      <div className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Add Expense */}
        <button
          onClick={() => handleQuickAdd('expense')}
          className="group flex items-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            <span className="font-semibold text-sm whitespace-nowrap">Add Expense</span>
          </div>
        </button>

        {/* Add Income */}
        <button
          onClick={() => handleQuickAdd('income')}
          className="group flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold text-sm whitespace-nowrap">Add Income</span>
          </div>
        </button>

        {/* Smart Input */}
        <button
          onClick={handleSmartInput}
          className="group flex items-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold text-sm whitespace-nowrap">Smart Input</span>
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all active:scale-95 flex items-center justify-center ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm -z-10"
        />
      )}
    </div>
  );
}
