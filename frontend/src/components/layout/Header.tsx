import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/api/notifications';
import { cn } from '@/utils/cn';

export function Header() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const { data } = await notificationsApi.list({ limit: 1 });
        if (!cancelled) setUnreadCount(data.data.unreadCount);
      } catch {
        // ignore
      }
    };
    if (user) {
      fetch();
      const interval = setInterval(fetch, 30_000);
      return () => { cancelled = true; clearInterval(interval); };
    }
  }, [user]);

  const roleLabel: Record<string, string> = {
    ADMINISTRATOR: 'Administrator',
    FLEET_MANAGER: 'Fleet Manager',
    RENTAL_AGENT: 'Rental Agent',
    CUSTOMER: 'Customer',
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <p className="text-xs text-gray-500">
          {user ? roleLabel[user.role] : ''}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.firstName} {user?.lastName}
          </span>
        </Link>
      </div>
    </header>
  );
}
