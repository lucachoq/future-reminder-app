import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getRelativeTime(date: string | Date) {
  const now = new Date()
  const reminderDate = new Date(date)
  const diffInMs = reminderDate.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) return 'Overdue'
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays < 7) return `In ${diffInDays} days`
  if (diffInDays < 30) return `In ${Math.ceil(diffInDays / 7)} weeks`
  return `In ${Math.ceil(diffInDays / 30)} months`
}

export function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'health': '🏥',
    'business': '💼',
    'personal': '👤',
    'finance': '💰',
    'education': '📚',
    'travel': '✈️',
    'home': '🏠',
    'work': '💻',
    'family': '👨‍👩‍👧‍👦',
    'hobby': '🎨',
    'default': '📝'
  }
  
  return emojiMap[category.toLowerCase()] || emojiMap.default
} 