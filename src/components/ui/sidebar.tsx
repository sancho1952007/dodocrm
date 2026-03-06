"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials, getOwnerColor } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useState, useRef, useEffect } from "react";
import {
  Users,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Camera,
  X,
} from "lucide-react";

const navItems = [
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ user }: { user: { name: string; email: string; role: string; image?: string | null } }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch avatar from DB on mount (not from JWT to avoid cookie size issues)
  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setAvatarUrl(data.image);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showZoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowZoom(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showZoom]);

  return (
    <aside className="flex flex-col w-56 bg-white border-r dark:bg-[#111113] dark:border-[#1e1e1e]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b dark:border-[#1e1e1e]">
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#18181b] text-white flex items-center justify-center font-bold text-xs dark:bg-white dark:text-[#09090b]">
          D
        </div>
        <div>
          <span className="font-semibold text-[#18181b] text-[13px] dark:text-white tracking-tight">Dodo CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#f4f4f5] text-[#18181b] dark:bg-[#1e1e1e] dark:text-white"
                  : "text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] dark:text-[#71717a] dark:hover:bg-[#1a1a1c] dark:hover:text-[#d4d4d8]"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#18181b] dark:text-white" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t dark:border-[#1e1e1e] p-3 space-y-0.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] transition-colors dark:hover:bg-[#1a1a1c] dark:hover:text-[#d4d4d8]"
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <button
            type="button"
            onClick={() => avatarUrl ? setShowZoom(true) : fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-7 h-7 rounded-full flex-shrink-0 group focus:outline-none cursor-pointer"
            title={avatarUrl ? "View profile photo" : "Add profile photo"}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: getOwnerColor(user.name) }}
              >
                {getInitials(user.name)}
              </div>
            )}
            {!avatarUrl && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3 text-white" />
              </div>
            )}
          </button>

          {/* Zoom modal */}
          {showZoom && avatarUrl && (
            <div
              className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
              onClick={() => setShowZoom(false)}
            >
              <div
                className="bg-white dark:bg-[#18181b] rounded-2xl p-5 flex flex-col items-center gap-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-48 h-48 rounded-xl object-cover"
                />
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => { setShowZoom(false); fileInputRef.current?.click(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#18181b] dark:text-white text-[12px] font-medium transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowZoom(false)}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#18181b] dark:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const form = new FormData();
                form.append("file", file);
                const res = await fetch("/api/user/upload-avatar", { method: "POST", body: form });
                const data = await res.json();
                if (data.image) setAvatarUrl(data.image);
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#18181b] truncate dark:text-white">{user.name}</p>
            <p className="text-[11px] text-[#a1a1aa] truncate font-sub">{user.role}</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-[#71717a] hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950/20 dark:hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
