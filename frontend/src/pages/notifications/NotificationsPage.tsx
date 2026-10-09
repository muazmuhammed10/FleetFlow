import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/api/notifications';
import { Notification } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatRelative } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function NotificationsPage() {
  const { error, success } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list({ limit: 50 });
      setNotifications(data.data.data);
      setUnreadCount(data.data.unreadCount);
    } catch { error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      success('All notifications marked as read');
    } catch { error('Failed to mark all as read'); }
    finally { setMarkingAll(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" loading={markingAll} onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {loading ? <PageSpinner /> : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" icon={<Bell size={48} />} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={cn(
                'p-4 rounded-xl border transition-colors',
                n.isRead
                  ? 'bg-white border-gray-100 text-gray-600'
                  : 'bg-brand-50 border-brand-100 cursor-pointer hover:bg-brand-100'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', n.isRead ? 'bg-gray-300' : 'bg-brand-600')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', n.isRead ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
