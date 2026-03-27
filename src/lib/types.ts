export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export const CATEGORIES = {
  income: ['Sales', 'Consulting', 'Investment', 'Other'],
  expense: ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Software', 'Supplies', 'Other']
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-05-15', type: 'income', category: 'Sales', amount: 5000, description: 'Monthly subscription revenue' },
  { id: '2', date: '2024-05-16', type: 'expense', category: 'Rent', amount: 1200, description: 'Office rent' },
  { id: '3', date: '2024-05-17', type: 'income', category: 'Consulting', amount: 1500, description: 'Project kickoff fee' },
  { id: '4', date: '2024-05-18', type: 'expense', category: 'Marketing', amount: 350, description: 'Social media ads' },
  { id: '5', date: '2024-05-19', type: 'expense', category: 'Software', amount: 80, description: 'SaaS subscriptions' },
  { id: '6', date: '2024-05-20', type: 'income', category: 'Sales', amount: 2300, description: 'Product sales' },
];