import React from 'react';
import { cn } from '@/utils/cn';
import { STATUS_COLORS } from '@/utils/format';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
  const text = label ?? status.replace(/_/g, ' ');

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass, className)}>
      {text}
    </span>
  );
}
