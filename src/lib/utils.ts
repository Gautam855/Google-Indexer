import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "submitted":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "indexed":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "failed":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseCSVUrls(csvContent: string): string[] {
  const lines = csvContent.split(/\r?\n/).filter(Boolean);
  const urls: string[] = [];

  for (const line of lines) {
    // Try to extract URL from CSV - could be single column or multi-column
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    for (const part of parts) {
      if (isValidUrl(part)) {
        urls.push(part);
      }
    }
  }

  return [...new Set(urls)]; // Deduplicate
}
