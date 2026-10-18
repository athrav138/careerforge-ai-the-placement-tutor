"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { clearSession, getSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import NotificationsDropdown from "./notifications";

export default function DashboardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("ST");

  useEffect(() => {
    // Only fetch user info for display — do NOT redirect here.
    // Redirection is ProtectedRoute's responsibility.
    let active = true;

    getSession()
      .then((session) => {
        if (!active || !session) return;
        const initials = session.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        setUserName(initials || "ST");
      })
      .catch(() => {
        // Silently ignore — initials will remain default "ST"
      });

    return () => {
      active = false;
    };
  }, []); // empty deps — only run on mount

  const handleLogout = async () => {
    await clearSession();
    router.push("/");
  };

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0c1322]/85 backdrop-blur-md p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsDropdown />
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-sm"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00f0ff]/40 bg-[#00f0ff]/15 text-xs font-mono font-bold text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
          {userName}
        </div>
      </div>
    </div>
  );
}
