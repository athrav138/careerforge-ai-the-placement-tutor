"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

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
  const permission = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("focus", onChange);
      window.addEventListener("notificationpermissionchange", onChange);
      return () => {
        window.removeEventListener("focus", onChange);
        window.removeEventListener("notificationpermissionchange", onChange);
      };
    },
    () => ("Notification" in window ? Notification.permission : "default"),
    () => "default",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok && !cancelled) setNotifications(data.notifications || []);
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

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    await Notification.requestPermission();
    window.dispatchEvent(new Event("notificationpermissionchange"));
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 size={16} className="text-green-500" />;
      case "WARNING": return <AlertTriangle size={16} className="text-yellow-500" />;
      case "ALERT": return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-muted shadow-sm hover:text-ink transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-white shadow-xl z-50 overflow-hidden flex flex-col max-h-[32rem]">
          <div className="p-4 border-b border-line bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-cyan font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          {permission !== "granted" && (
            <div className="p-3 bg-blue-50 border-b border-blue-100 flex flex-col gap-2 items-start">
              <p className="text-xs text-blue-800">Enable browser notifications to receive daily suggestions and guidelines.</p>
              <button 
                onClick={requestPermission}
                className="text-xs font-semibold bg-blue-600 text-white px-2 py-1 rounded"
              >
                Enable Notifications
              </button>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted flex flex-col items-center">
                <Bell size={24} className="mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 flex gap-3 ${n.isRead ? 'opacity-60' : 'bg-white'}`}>
                    <div className="mt-0.5 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-ink">{n.title}</h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{n.message}</p>
                      <div className="text-[10px] text-slate-400 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-muted hover:text-cyan self-start"
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
        </div>
      )}
    </div>
  );
}
