"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { Settings as SettingsIcon, SlidersHorizontal } from "lucide-react";
import { authClient } from "@/lib/auth";

const groups = [
  { title: "Account", items: ["Change email", "Change password"] },
  { title: "Notifications", items: ["Roadmap reminders", "Weekly readiness summary"] },
  { title: "AI preferences", items: ["Mentor tone", "Recommendation frequency"] },
  { title: "Privacy", items: ["Portfolio visibility", "Data export"] },
];

export default function Settings() {
  const router = useRouter();
  const [managedSetting, setManagedSetting] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      const { error } = await authClient.signOut({});
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("We could not end your session. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <>
      <DashboardHeader title="Settings" subtitle="Account, notifications, AI preferences and privacy." />
      <div className="grid md:grid-cols-2 gap-5">
        {groups.map((g) => (
          <Panel key={g.title} className="rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-cyan/35">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink">{g.title}</h3>
              <SlidersHorizontal size={17} className="text-cyan" />
            </div>
            <ul className="space-y-3">
              {g.items.map((it) => (
                <li key={it} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{it}</span>
                  <button
                    type="button"
                    className="text-xs text-cyan hover:underline"
                    onClick={() => setManagedSetting(it)}
                  >
                    Manage
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
      {managedSetting && (
        <p className="mt-5 text-sm text-cyan" role="status">
          {managedSetting} is managed through your saved profile and account settings.
        </p>
      )}
      {logoutError && <p role="alert" className="mt-5 text-sm text-red-600">{logoutError}</p>}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-muted shadow-sm hover:text-ink"
      >
        <SettingsIcon size={16} />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </>
  );
}
