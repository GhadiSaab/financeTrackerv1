import { useTheme } from '../contexts/ThemeContext';

export function CustomTooltip({ active, payload, label }: any) {
  const { resolvedTheme } = useTheme();
  
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={`rounded-lg shadow-lg border p-3 ${
      resolvedTheme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ${Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function getChartColors(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    return {
      grid: '#374151',
      text: '#9ca3af',
      tooltip: {
        background: '#1f2937',
        border: '#374151',
        text: '#f9fafb'
      }
    };
  }
  
  return {
    grid: '#e5e7eb',
    text: '#6b7280',
    tooltip: {
      background: '#ffffff',
      border: '#e5e7eb',
      text: '#111827'
    }
  };
}
