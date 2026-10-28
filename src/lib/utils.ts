import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(
  date: string | Date,
  locale: string = "fr",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  const targetLocale = locale === "ar" ? "ar-SA" : "fr-FR";
  return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(d);
}

export function formatDate(
  date: string | Date,
  locale: string = "fr"
): string {
  return formatDateTime(date, locale, { hour: undefined, minute: undefined });
}
