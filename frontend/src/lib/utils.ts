import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "R$ 1.234,56" → 1234.56 */
export function parseBRL(masked: string): number {
  const digits = masked.replace(/[^\d]/g, '')
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

/** 1234.56 → "R$ 1.234,56" */
export function formatBRL(value: number): string {
  if (!value && value !== 0) return ''
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
