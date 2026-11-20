import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Check,
} from 'lucide-react';

export default function Notifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, readAt: new Date() } : n))
      );
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, readAt: new Date() })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time system events, generation alerts and ready-to-publish triggers
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When your campaigns finish generating or scheduled pins become ready to publish, you'll see alerts here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n._id}
                onClick={() => isUnread && handleMarkRead(n._id)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition cursor-pointer ${
                  isUnread ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'pin_ready'
                        ? 'bg-rose-100 text-rose-600'
                        : n.type === 'campaign_completed'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {n.type === 'pin_ready' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-xs sm:text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n._id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Mark read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
