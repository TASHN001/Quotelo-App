import type { Document } from './types';

export function calculateDocumentStatus(document: Document): Document['status'] {
  if (document.status === 'paid' || document.status === 'cancelled') {
    return document.status;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(document.due_date);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today && document.status !== 'paid') {
    return 'overdue';
  }

  return document.status;
}

export function getOverdueDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function isOverdue(document: Document): boolean {
  if (document.status === 'paid' || document.status === 'cancelled') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(document.due_date);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export function getStatusLabel(document: Document): string {
  const currentStatus = calculateDocumentStatus(document);

  if (currentStatus === 'overdue') {
    const days = getOverdueDays(document.due_date);
    return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
  }

  return currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
}

export function getStatusColor(document: Document): {
  bg: string;
  text: string;
} {
  const status = calculateDocumentStatus(document);

  switch (status) {
    case 'paid':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700'
      };
    case 'sent':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700'
      };
    case 'overdue':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700'
      };
    case 'cancelled':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700'
      };
  }
}

export function shouldShowUrgentIndicator(document: Document): boolean {
  if (!isOverdue(document)) {
    return false;
  }

  const overdueDays = getOverdueDays(document.due_date);
  return overdueDays >= 3;
}

export function getUrgencyLevel(overdueDays: number): 'low' | 'medium' | 'high' | 'critical' {
  if (overdueDays >= 14) return 'critical';
  if (overdueDays >= 7) return 'high';
  if (overdueDays >= 3) return 'medium';
  return 'low';
}
