import React, { useEffect, useRef } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import type { AppNotification } from "../types";
import { markNotificationRead } from "../services/firebaseService";

interface NotificationPanelProps {
  notifications: AppNotification[];
  uid: string;
  isOpen: boolean;
  onToggle: () => void;
}

const ICON_MAP: Record<string, string> = {
  project_created: "📁",
  user_approved: "✅",
  user_rejected: "❌",
  asset_updated: "🖼️",
  info: "ℹ️",
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  uid,
  isOpen,
  onToggle,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.readBy.includes(uid)).length;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, onToggle]);

  const handleMarkAll = async () => {
    await Promise.all(
      notifications
        .filter((n) => !n.readBy.includes(uid))
        .map((n) => markNotificationRead(n.id, uid))
    );
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        className="btn btn-outline"
        style={{ padding: "6px 10px", position: "relative" }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute", top: "-5px", right: "-5px",
              background: "#f87171", color: "#fff", borderRadius: "50%",
              width: "18px", height: "18px", fontSize: "0.68rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: "360px", maxHeight: "480px", overflowY: "auto",
            zIndex: 200, padding: "0",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              position: "sticky", top: 0, background: "rgba(17,24,39,0.97)", zIndex: 1,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Bell size={16} style={{ color: "var(--accent-cyan)" }} /> Notifications
              {unreadCount > 0 && (
                <span style={{ background: "#f87171", color: "#fff", borderRadius: "20px", padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={onToggle} className="btn btn-outline" style={{ padding: "4px 8px" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 30).map((n) => {
              const isUnread = !n.readBy.includes(uid);
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markNotificationRead(n.id, uid)}
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: isUnread ? "pointer" : "default",
                    background: isUnread ? "rgba(99,179,237,0.05)" : "transparent",
                    display: "flex", gap: "12px", alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 }}>
                    {ICON_MAP[n.type] || "ℹ️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: "0.88rem" }}>{n.title}</span>
                      {isUnread && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.4", wordBreak: "break-word" }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "5px", display: "block" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
