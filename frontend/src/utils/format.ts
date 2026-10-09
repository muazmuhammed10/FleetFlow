import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateStr: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(d, fmt);
}

export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelative(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  RENTED: 'bg-yellow-100 text-yellow-800',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
  REPORTED: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
};
