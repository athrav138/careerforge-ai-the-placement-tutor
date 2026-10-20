"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/notifications-client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load notifications.");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok && !cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch((error) => { if (!cancelled) console.error(error); });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "WARNING":
      case "ALERT":
      case "warning":
        return <AlertTriangle size={16} className="text-amber-400" />;
      case "ERROR":
      case "error":
        return <XCircle size={16} className="text-red-400" />;
      case "SUCCESS":
      case "success":
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      default:
        return <Info size={16} className="text-[#00f0ff]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#0c1322]"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#0c1322]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[32rem]">
          <div className="p-4 border-b border-white/10 bg-[#050811] flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[#00f0ff] font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {fetchError && <div className="p-4 text-sm text-rose-300" role="alert">{fetchError}<button onClick={() => void fetchNotifications()} className="ml-2 underline">Retry</button></div>}
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center">
                <Bell size={24} className="mb-2 opacity-30 text-[#00f0ff]" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 flex gap-3 transition-colors ${n.isRead ? 'opacity-50' : 'bg-white/[0.02]'}`}>
                    <div className="mt-0.5 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <div className="text-[10px] text-slate-400 mt-2 font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-slate-400 hover:text-[#00f0ff] self-start"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/10 p-3 text-center">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-[#00f0ff] hover:underline">View all notifications</Link>
          </div>
        </div>
      )}
    </div>
  );
}
