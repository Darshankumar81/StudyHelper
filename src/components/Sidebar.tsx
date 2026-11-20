"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
} from "lucide-react";
import { useState } from "react";
import { logoutUser } from "@/app/actions";
import { SettingsDialog } from "@/components/SettingsDialog";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
  },
  {
    name: "Subjects & Topics",
    href: "/subjects",
    icon: BookOpen,
    description: "Manage Curriculum",
  },
  {
    name: "Schedule & Tasks",
    href: "/schedule",
    icon: CalendarDays,
    description: "Daily Study Timeline",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Daily Study Capacity",
  },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    dailyStudyHours: number;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SP";

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base tracking-tight text-foreground">
                  StudyPulse
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 dark:bg-indigo-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                  Pro
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Intelligent Study OS</p>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Main Navigation
          </p>
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span
                    className={`text-[11px] font-normal ${
                      isActive ? "text-indigo-100" : "text-muted-foreground/70"
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Study Motivation Card */}
        {user && (
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <Flame className="size-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Daily Goal Target</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Your active daily study capacity is set to <span className="font-bold text-foreground">{user.dailyStudyHours} hrs/day</span>.
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <SettingsDialog user={user} trigger={
                <button className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-[11px]">
                  Adjust Capacity →
                </button>
              } />
            </div>
          </div>
        )}
      </div>

      {/* User profile footer & logout */}
      {user ? (
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-xl p-2 bg-muted/30">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-inner">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => logoutUser()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Log Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Link href="/login" className="w-full">
            <button className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="size-4" />
          </div>
          <span className="font-heading font-bold text-sm tracking-tight">StudyPulse</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 md:border-r md:border-border md:bg-card/50 md:backdrop-blur-xl md:h-screen md:sticky md:top-0">
        {navContent}
      </aside>
    </>
  );
}
