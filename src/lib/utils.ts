import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique UUID v4 string for use as IDs in the application
 * This replaces Date.now().toString() for production-ready unique identifiers
 */
export function generateId(): string {
  return uuidv4();
}
