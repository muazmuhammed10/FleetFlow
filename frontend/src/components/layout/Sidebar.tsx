import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Users, Calendar, ClipboardList,
  Wrench, CreditCard, Bell, BarChart2, Shield, UserCircle,
  LogOut, ChevronLeft, ChevronRight, Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    to: '/dashboard',     icon: <LayoutDashboard size={18} /> },
  { label: 'Vehicles',     to: '/vehicles',      icon: <Car size={18} /> },
  { label: 'Bookings',     to: '/bookings',      icon: <Calendar size={18} /> },
  { label: 'Contracts',    to: '/contracts',     icon: <ClipboardList size={18} />, roles: ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'] },
  { label: 'Customers',    to: '/customers',     icon: <Users size={18} />,         roles: ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'] },
  { label: 'Payments',     to: '/payments',      icon: <CreditCard size={18} /> },
  { label: 'Maintenance',  to: '/maintenance',   icon: <Wrench size={18} />,        roles: ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'] },
  { label: 'Drivers',      to: '/drivers',       icon: <Truck size={18} />,         roles: ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'] },
  { label: 'Reports',      to: '/reports',       icon: <BarChart2 size={18} />,     roles: ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'] },
  { label: 'Notifications',to: '/notifications', icon: <Bell size={18} /> },
  { label: 'Audit Log',    to: '/audit',         icon: <Shield size={18} />,        roles: ['ADMINISTRATOR'] },];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleLabel: Record<string, string> = {
    ADMINISTRATOR: 'Admin',
    FLEET_MANAGER: 'Fleet Manager',
    RENTAL_AGENT: 'Agent',
    CUSTOMER: 'Customer',
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
        <div className="bg-blue-600 rounded-lg p-1.5 flex-shrink-0 shadow-lg shadow-blue-600/30">
          <Car size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-base tracking-tight">FleetFlow</span>
            {user && (
              <p className="text-gray-500 text-xs">{roleLabel[user.role] ?? user.role}</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {filtered.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-gray-800 p-3 space-y-0.5">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )
          }
          title={collapsed ? 'Profile' : undefined}
        >
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <span className="truncate text-sm">
              {user?.firstName} {user?.lastName}
            </span>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors w-full"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} className="flex-shrink-0" />
            : <><ChevronLeft size={16} className="flex-shrink-0" /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
