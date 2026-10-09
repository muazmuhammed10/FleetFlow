import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Calendar, Users, CreditCard, AlertTriangle,
  CheckCircle, Wrench, TrendingUp, ArrowRight, Clock,
  Activity, BarChart2, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi } from '@/api/bookings';
import { vehiclesApi } from '@/api/vehicles';
import { DashboardStats, Vehicle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/format';
import { PageSpinner } from '@/components/ui/Spinner';

const revenueData = [
  { month: 'May', revenue: 3800 }, { month: 'Jun', revenue: 5200 },
  { month: 'Jul', revenue: 4700 }, { month: 'Aug', revenue: 6100 },
  { month: 'Sep', revenue: 5500 }, { month: 'Oct', revenue: 7300 },
];

const bookingsData = [
  { day: 'Mon', bookings: 4 }, { day: 'Tue', bookings: 7 },
  { day: 'Wed', bookings: 5 }, { day: 'Thu', bookings: 9 },
  { day: 'Fri', bookings: 12 }, { day: 'Sat', bookings: 8 },
  { day: 'Sun', bookings: 3 },
];

// Safe image extractor — never crashes if images undefined/null
function getVehiclePrimaryImage(vehicle: Vehicle): string | null {
  const imgs = vehicle.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const primary = imgs.find((i) => i.isPrimary);
  return (primary ?? imgs[0])?.url ?? null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingsApi.getDashboardStats().then((r) => setStats(r.data.data)),
      vehiclesApi.list({ limit: 5, available: 'true' }).then((r) => {
        // safely handle both response shapes
        const d = r.data.data;
        const list = Array.isArray(d) ? d : (d as { data: Vehicle[] }).data ?? [];
        setVehicles(list);
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const isAdmin   = user?.role === 'ADMINISTRATOR';
  const isManager = user?.role === 'FLEET_MANAGER';
  const isAgent   = user?.role === 'RENTAL_AGENT';
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff   = !isCustomer;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        {isCustomer && (
          <button
            onClick={() => navigate('/bookings/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
          >
            <Car size={16} /> Book a Vehicle
          </button>
        )}
      </div>

      {/* ── Staff KPI Cards ── */}
      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Vehicles" value={stats?.totalVehicles ?? 0}
            sub={`${stats?.availableVehicles ?? 0} available`}
            icon={<Car size={20} />} color="blue" onClick={() => navigate('/vehicles')} />
          <KpiCard label="Active Rentals" value={stats?.activeRentals ?? 0}
            sub={`${stats?.pendingBookings ?? 0} pending`}
            icon={<Activity size={20} />} color="green" onClick={() => navigate('/bookings')} />
          <KpiCard label="Overdue" value={stats?.overdueRentals ?? 0}
            sub="need attention"
            icon={<AlertTriangle size={20} />} color="red"
            onClick={() => navigate('/bookings')} />
          {(isAdmin || isManager) ? (
            <KpiCard label="Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)}
              sub="simulated"
              icon={<TrendingUp size={20} />} color="purple" onClick={() => navigate('/reports')} />
          ) : (
            <KpiCard label="Available" value={stats?.availableVehicles ?? 0}
              sub="ready for rental"
              icon={<CheckCircle size={20} />} color="purple" onClick={() => navigate('/vehicles')} />
          )}
        </div>
      )}

      {/* ── Customer KPI Cards ── */}
      {isCustomer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Upcoming Bookings" value={stats?.upcomingBookings ?? 0}
            icon={<Calendar size={20} />} color="blue" onClick={() => navigate('/bookings')} />
          <KpiCard label="Active Rentals" value={stats?.activeRentals ?? 0}
            icon={<Car size={20} />} color="green" onClick={() => navigate('/bookings')} />
          <KpiCard label="Completed" value={stats?.completedRentals ?? 0}
            icon={<CheckCircle size={20} />} color="gray" onClick={() => navigate('/bookings')} />
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Charts — admin/manager */}
        {(isAdmin || isManager) && (
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-blue-600" /> Revenue (Last 6 Months)
                  </CardTitle>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Simulated</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={16} className="text-green-600" /> Bookings This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={bookingsData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available vehicles — agent / customer */}
        {(isAgent || isCustomer) && (
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car size={16} className="text-blue-600" /> Available Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No vehicles available</p>
                ) : (
                  vehicles.map((v) => {
                    const imgUrl = getVehiclePrimaryImage(v);
                    return (
                      <div
                        key={v.id}
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50
                          border border-transparent hover:border-blue-100 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={`${v.make} ${v.model}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {v.year} {v.make} {v.model}
                            </p>
                            <p className="text-xs text-gray-400">
                              {v.category?.name ?? 'Vehicle'} · {v.registrationNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 text-sm">
                            {formatCurrency(v.dailyRate)}
                            <span className="text-gray-400 font-normal text-xs">/day</span>
                          </span>
                          <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
                <button
                  onClick={() => navigate('/vehicles')}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-1"
                >
                  View all vehicles →
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Fleet Status — staff */}
          {isStaff && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={16} className="text-gray-500" /> Fleet Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Available', value: stats?.availableVehicles ?? 0, color: 'bg-green-500' },
                  { label: 'On Rental',  value: stats?.activeRentals ?? 0,    color: 'bg-blue-500' },
                  { label: 'Maintenance',value: stats?.maintenanceDue ?? 0,   color: 'bg-orange-500' },
                  { label: 'Overdue',    value: stats?.overdueRentals ?? 0,   color: 'bg-red-500' },
                ].map((item) => {
                  const total = Math.max(stats?.totalVehicles ?? 1, 1);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.color}`} />
                          <span className="text-gray-600">{item.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {isCustomer && (
                <>
                  <QuickAction label="Browse Vehicles"  icon={<Car size={15} />}      onClick={() => navigate('/vehicles')} />
                  <QuickAction label="New Booking"      icon={<Calendar size={15} />} onClick={() => navigate('/bookings/new')} />
                  <QuickAction label="My Bookings"      icon={<Clock size={15} />}    onClick={() => navigate('/bookings')} />
                  <QuickAction label="Payment History"  icon={<CreditCard size={15} />} onClick={() => navigate('/payments')} />
                </>
              )}
              {isAgent && (
                <>
                  <QuickAction label="View Bookings"  icon={<Calendar size={15} />} onClick={() => navigate('/bookings')} />
                  <QuickAction label="Fleet Overview" icon={<Car size={15} />}      onClick={() => navigate('/vehicles')} />
                  <QuickAction label="Maintenance"    icon={<Wrench size={15} />}   onClick={() => navigate('/maintenance')} />
                </>
              )}
              {(isAdmin || isManager) && (
                <>
                  <QuickAction label="Add Vehicle"   icon={<Car size={15} />}       onClick={() => navigate('/vehicles/new')} />
                  <QuickAction label="All Bookings"  icon={<Calendar size={15} />}  onClick={() => navigate('/bookings')} />
                  <QuickAction label="Customers"     icon={<Users size={15} />}     onClick={() => navigate('/customers')} />
                  <QuickAction label="Reports"       icon={<BarChart2 size={15} />} onClick={() => navigate('/reports')} />
                  <QuickAction label="Maintenance"   icon={<Wrench size={15} />}    onClick={() => navigate('/maintenance')} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, color, onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
}) {
  const styles = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'hover:border-blue-200' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'hover:border-green-200' },
    red:    { bg: 'bg-red-50',    text: 'text-red-500',    border: 'hover:border-red-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-200' },
    gray:   { bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'hover:border-gray-300' },
  };
  const s = styles[color];
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 ${s.border} p-5
        cursor-pointer hover:shadow-md transition-all duration-200 group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${s.bg} ${s.text} rounded-xl p-2.5`}>{icon}</div>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 mt-1 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickAction({
  label, icon, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm
        text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</span>
        {label}
      </div>
      <ArrowRight size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
    </button>
  );
}
