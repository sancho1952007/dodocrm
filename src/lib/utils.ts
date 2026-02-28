import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STAGE_LABELS: Record<string, string> = {
  MEETING_SCHEDULED: "Demo Scheduled",
  MEETING_DONE: "Demo Done",
  PRODUCT_VERIFICATION_SUBMITTED: "Product Verification",
  PAYOUT_VERIFICATION_SUBMITTED: "Payout Verification",
  TRANSACTING_BUSINESS: "Transacting",
};

export const STAGE_ORDER = [
  "MEETING_SCHEDULED",
  "MEETING_DONE",
  "PRODUCT_VERIFICATION_SUBMITTED",
  "PAYOUT_VERIFICATION_SUBMITTED",
  "TRANSACTING_BUSINESS",
] as const;

// Column header accent colors (solid)
export const STAGE_HEADER_COLORS: Record<string, string> = {
  MEETING_SCHEDULED: "bg-blue-500",
  MEETING_DONE: "bg-violet-500",
  PRODUCT_VERIFICATION_SUBMITTED: "bg-amber-500",
  PAYOUT_VERIFICATION_SUBMITTED: "bg-orange-500",
  TRANSACTING_BUSINESS: "bg-emerald-500",
};

// Badge pill colors — light mode
export const STAGE_COLORS: Record<string, string> = {
  MEETING_SCHEDULED: "bg-blue-50 text-blue-700 border border-blue-200",
  MEETING_DONE: "bg-violet-50 text-violet-700 border border-violet-200",
  PRODUCT_VERIFICATION_SUBMITTED: "bg-amber-50 text-amber-700 border border-amber-200",
  PAYOUT_VERIFICATION_SUBMITTED: "bg-orange-50 text-orange-700 border border-orange-200",
  TRANSACTING_BUSINESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

// Badge pill colors — dark mode (subtle, blends in)
export const STAGE_COLORS_DARK: Record<string, string> = {
  MEETING_SCHEDULED: "bg-blue-950/40 text-blue-400 border border-blue-800/30",
  MEETING_DONE: "bg-violet-950/40 text-violet-400 border border-violet-800/30",
  PRODUCT_VERIFICATION_SUBMITTED: "bg-amber-950/40 text-amber-400 border border-amber-800/30",
  PAYOUT_VERIFICATION_SUBMITTED: "bg-orange-950/40 text-orange-400 border border-orange-800/30",
  TRANSACTING_BUSINESS: "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30",
};

export const STAGE_DOT_COLORS: Record<string, string> = {
  MEETING_SCHEDULED: "bg-blue-500",
  MEETING_DONE: "bg-violet-500",
  PRODUCT_VERIFICATION_SUBMITTED: "bg-amber-500",
  PAYOUT_VERIFICATION_SUBMITTED: "bg-orange-500",
  TRANSACTING_BUSINESS: "bg-emerald-500",
};

// Column background tints
export const STAGE_BG_COLORS: Record<string, string> = {
  MEETING_SCHEDULED: "bg-blue-50/50",
  MEETING_DONE: "bg-violet-50/50",
  PRODUCT_VERIFICATION_SUBMITTED: "bg-amber-50/50",
  PAYOUT_VERIFICATION_SUBMITTED: "bg-orange-50/50",
  TRANSACTING_BUSINESS: "bg-emerald-50/50",
};

// Tier badges — dark mode (vibrant distinct colors)
export const TIER_COLORS: Record<string, string> = {
  HIGH: "bg-red-950 text-red-400 border border-red-800/60",
  MEDIUM: "bg-orange-950 text-orange-400 border border-orange-700/60",
  LOW: "bg-blue-950 text-blue-400 border border-blue-800/60",
};

// Light mode tier badges
export const TIER_COLORS_LIGHT: Record<string, string> = {
  HIGH: "bg-red-50 text-red-700 border border-red-200",
  MEDIUM: "bg-orange-50 text-orange-700 border border-orange-200",
  LOW: "bg-blue-50 text-blue-700 border border-blue-200",
};

// Tier card left-border accent (inline style to avoid dark:border override)
export const TIER_BORDER_COLOR: Record<string, string> = {
  HIGH: "#dc2626",
  MEDIUM: "#ea580c",
  LOW: "#3b82f6",
};

export const TIER_BORDER_COLOR_DARK: Record<string, string> = {
  HIGH: "#b91c1c",
  MEDIUM: "#c2410c",
  LOW: "#2563eb",
};

// Owner avatar colors (hex values for inline styles — immune to Tailwind purge)
export const OWNER_COLORS: Record<string, string> = {
  Vansh: "#2563eb",
  Purrvi: "#ec4899",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getOwnerColor(name: string): string {
  // Case-insensitive lookup, returns hex color
  const key = Object.keys(OWNER_COLORS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  return key ? OWNER_COLORS[key] : "#6b7280";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}
