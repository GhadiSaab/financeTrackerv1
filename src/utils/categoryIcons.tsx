import {
  ShoppingCart,
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Gift,
  Plane,
  Smartphone,
  DollarSign,
  TrendingUp,
  Building2,
  Utensils,
  ShoppingBag,
  Film,
  Music,
  Dumbbell,
  Shirt,
  Wallet
} from 'lucide-react';

// Map of category names to icons
export const categoryIconMap: { [key: string]: any } = {
  // Expenses
  'Food & Dining': Utensils,
  'Groceries': ShoppingCart,
  'Coffee & Snacks': Coffee,
  'Transportation': Car,
  'Gas & Fuel': Car,
  'Housing': Home,
  'Rent': Home,
  'Mortgage': Building2,
  'Utilities': Zap,
  'Healthcare': Heart,
  'Medical': Heart,
  'Entertainment': Gamepad2,
  'Movies & Shows': Film,
  'Music': Music,
  'Education': GraduationCap,
  'Shopping': ShoppingBag,
  'Clothing': Shirt,
  'Electronics': Smartphone,
  'Gifts': Gift,
  'Travel': Plane,
  'Fitness': Dumbbell,
  'Personal Care': Heart,
  'Subscriptions': Smartphone,

  // Income
  'Salary': Briefcase,
  'Paycheck': Briefcase,
  'Freelance': TrendingUp,
  'Investment': TrendingUp,
  'Business': Building2,
  'Other Income': DollarSign,
  'Bonus': Gift,

  // Default
  'Uncategorized': Wallet,
  'Other': Wallet
};

// Get icon component for a category name
export function getCategoryIcon(categoryName: string) {
  // Try exact match first
  if (categoryIconMap[categoryName]) {
    return categoryIconMap[categoryName];
  }

  // Try partial match
  const lowerName = categoryName.toLowerCase();
  const matchedKey = Object.keys(categoryIconMap).find(key =>
    lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)
  );

  return matchedKey ? categoryIconMap[matchedKey] : categoryIconMap['Other'];
}

// Get all available icons for dropdown selection
export function getAllCategoryIcons() {
  return Object.entries(categoryIconMap).map(([name, Icon]) => ({
    name,
    Icon
  }));
}
