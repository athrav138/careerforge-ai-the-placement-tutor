"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap, LayoutDashboard, Menu, X } from "lucide-react";
import Button from "@/components/ui/button";
import { getSession, UserSession } from "@/lib/auth";

const links = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/research", label: "Research" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (active && session) {
          setUser(session);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all">
            <GraduationCap size={18} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            CareerForge<span className="text-[#00f0ff]">.AI</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[#00f0ff] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3.5 py-1.5 text-xs font-semibold text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)]"
              >
                <LayoutDashboard size={14} />
                <span>Go to Dashboard</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00f0ff]/40 bg-[#00f0ff]/15 text-xs font-mono font-bold text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.25)] hover:border-[#00f0ff] transition-all"
                title={user.name || "Logged in"}
              >
                {initials || "ST"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Button href="/register" className="!px-4 !py-2 text-sm">
                Get started
              </Button>
            </>
          )}
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="md:hidden border-t border-white/10 bg-[#0c1322]/95 backdrop-blur-2xl px-6 py-5 shadow-2xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-300">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-[#00f0ff] transition-colors font-medium"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl px-3 py-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-colors font-semibold flex items-center justify-between"
                onClick={() => setOpen(false)}
              >
                <span>Dashboard ({user.name})</span>
                <LayoutDashboard size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2.5 hover:bg-white/5 hover:text-white transition-colors font-medium"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl px-3 py-2.5 bg-[#2563eb] text-white transition-colors font-semibold text-center"
                  onClick={() => setOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
