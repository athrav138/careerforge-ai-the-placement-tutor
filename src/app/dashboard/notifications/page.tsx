"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/notifications-client";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=100", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load notifications.");
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load notifications.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setItems(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const markRead = async (item: NotificationItem) => {
    setBusyId(item.id);
    try {
      await markNotificationAsRead(item.id);
      setItems((current) => current.map((value) => value.id === item.id ? { ...value, isRead: true } : value));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      setError("Unable to update this notification. Please retry.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId("all");
    try {
      await markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError("Unable to mark notifications as read. Please retry.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setError("");
    const removedItem = items.find((item) => item.id === id);
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete notification.");
      setItems((current) => current.filter((item) => item.id !== id));
      if (removedItem && !removedItem.isRead) setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete notification.");
    } finally {
      setBusyId(null);
    }
  };

  const visibleItems = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  return (
    <>
      <DashboardHeader title="Notifications" subtitle="Application updates and placement activity for your account." />
      <Panel className="rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" aria-label="Filter notifications">
            <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink aria-pressed:bg-cyan/10">All</button>
            <button type="button" onClick={() => setFilter("unread")} aria-pressed={filter === "unread"} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink aria-pressed:bg-cyan/10">Unread ({unreadCount})</button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => refresh()} disabled={loading} className="text-sm font-semibold text-cyan hover:underline disabled:opacity-50">Refresh</button>
            {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} disabled={busyId === "all"} className="inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:underline disabled:opacity-50"><Check size={15} /> Mark all read</button>}
          </div>
        </div>
        {error && <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-rose-600" role="alert"><span>{error}</span><button type="button" onClick={() => refresh()} className="font-semibold underline">Retry</button></div>}
        {loading ? <div className="space-y-3" aria-label="Loading notifications"><div className="h-20 animate-pulse rounded-xl bg-slate-100" /><div className="h-20 animate-pulse rounded-xl bg-slate-100" /></div> : visibleItems.length === 0 ? (
          <div className="py-12 text-center"><Bell className="mx-auto mb-3 text-cyan" size={26} /><h2 className="font-semibold text-ink">{filter === "unread" ? "You’re all caught up" : "No notifications yet"}</h2><p className="mt-1 text-sm text-muted">Application status changes will appear here.</p><Link href="/dashboard/jobs" className="mt-4 inline-block text-sm font-semibold text-cyan hover:underline">Go to job applications</Link></div>
        ) : (
          <ul className="divide-y divide-line">
            {visibleItems.map((item) => <li key={item.id} className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between ${item.isRead ? "opacity-70" : ""}`}>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.isRead ? "bg-slate-300" : "bg-cyan"}`} aria-hidden="true" /><h2 className="font-semibold text-ink">{item.title}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">{item.type}</span></div><p className="mt-1 pl-4 text-sm text-muted">{item.message}</p><time className="mt-2 block pl-4 text-xs text-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>{item.title === "Application updated" && <Link href="/dashboard/placement-tracking" className="mt-2 ml-4 inline-block text-xs font-semibold text-cyan hover:underline">View placement tracking</Link>}</div>
              <div className="flex shrink-0 gap-3 pl-4 sm:pl-0">{!item.isRead && <button type="button" onClick={() => void markRead(item)} disabled={busyId === item.id} className="text-sm font-semibold text-cyan hover:underline disabled:opacity-50">Mark read</button>}<button type="button" onClick={() => void remove(item.id)} disabled={busyId === item.id} aria-label={`Delete ${item.title}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-rose-600 disabled:opacity-50"><Trash2 size={15} /> Delete</button></div>
            </li>)}
          </ul>
        )}
        {!loading && items.length === 100 && <p className="mt-4 text-xs text-muted">Showing the latest 100 notifications.</p>}
      </Panel>
    </>
  );
}
