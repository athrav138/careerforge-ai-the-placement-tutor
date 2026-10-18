"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    let active = true;

    // Safety timeout: if getSession takes more than 3.5s, fall through to authorized
    // (Middleware in proxy.ts handles actual server-level route blocking)
    const timeoutId = setTimeout(() => {
      if (active && status === "loading") {
        setStatus("authorized");
      }
    }, 3500);

    getSession()
      .then((session) => {
        if (!active) return;
        clearTimeout(timeoutId);
        if (!session) {
          setStatus("unauthorized");
          router.replace("/login");
        } else {
          setStatus("authorized");
        }
      })
      .catch(() => {
        if (!active) return;
        clearTimeout(timeoutId);
        // On recoverable network error, don't lock the UI; let middleware guard if needed
        setStatus("authorized");
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center px-6">
        <div className="border border-white/10 bg-[#0c1322]/85 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl flex flex-col items-center">
          <div className="text-xs tracking-[0.2em] text-[#00f0ff] font-mono mb-2">
            CAREERFORGE AI
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            <div className="font-semibold text-white text-sm">Verifying session…</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") return null;
  return <>{children}</>;
}
