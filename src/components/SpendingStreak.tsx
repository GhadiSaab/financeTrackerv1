import { Flame, Calendar, Target, Trophy } from 'lucide-react';
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
    if (streak.current < 7) return `${streak.current} days strong! 🔥`;
    if (streak.current < 30) return `${streak.current} days! You're on fire! 🔥🔥`;
    return `${streak.current} days! Unstoppable! 🔥🔥🔥`;
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-800/50 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          Tracking Streak
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-900/50 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {streak.current}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {streak.longest}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Best</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {streak.daysTracked}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Days</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 p-3 rounded-lg text-center">
        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
          {getStreakMessage()}
        </p>
      </div>

      {/* Streak visualization */}
      <div className="mt-4 flex gap-1 overflow-x-auto">
        {[...Array(Math.min(streak.current, 30))].map((_, i) => (
          <div
            key={i}
            className="w-2 h-8 bg-gradient-to-t from-orange-500 to-red-500 rounded-full flex-shrink-0"
            style={{
              opacity: 1 - (i * 0.02),
              animation: `pulse ${2 + i * 0.1}s infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
}
