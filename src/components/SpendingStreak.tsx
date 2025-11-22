import { Zap, Calendar, Trophy, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../lib/supabase';

interface SpendingStreakProps {
  transactions: Transaction[];
}

export default function SpendingStreak({ transactions }: SpendingStreakProps) {
  const calculateStreak = () => {
    if (transactions.length === 0) return { current: 0, longest: 0, daysTracked: 0 };

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get unique dates
    const uniqueDates = [...new Set(sortedTransactions.map(t => t.date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      date.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (date.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(uniqueDates[i]);
        const previousDate = new Date(uniqueDates[i - 1]);
        const diffDays = Math.floor(
          (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      daysTracked: uniqueDates.length
    };
  };

  const streak = calculateStreak();

  const getStreakMessage = () => {
    if (streak.current === 0) return "Start your tracking streak today!";
    if (streak.current === 1) return "Great start! Keep it going!";
    if (streak.current < 7) return `${streak.current} days strong!`;
    if (streak.current < 30) return `${streak.current} days! Amazing consistency!`;
    return `${streak.current} days! You're a pro!`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-teal-100 dark:bg-teal-500/20 rounded-lg">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          Tracking Streak
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 p-3 rounded-xl text-center border border-teal-100 dark:border-teal-500/20">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
            {streak.current}
          </p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Current</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 p-3 rounded-xl text-center border border-amber-100 dark:border-amber-500/20">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {streak.longest}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Best</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 p-3 rounded-xl text-center border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {streak.daysTracked}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total Days</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 p-3 rounded-xl text-center border border-teal-100 dark:border-teal-500/20">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
          {getStreakMessage()}
        </p>
      </div>

      {/* Streak visualization */}
      {streak.current > 0 && (
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {[...Array(Math.min(streak.current, 30))].map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-6 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full flex-shrink-0"
              style={{
                opacity: 0.4 + (i / Math.min(streak.current, 30)) * 0.6
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
