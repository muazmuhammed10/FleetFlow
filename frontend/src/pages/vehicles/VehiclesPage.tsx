import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, Users, Fuel, Zap, Car } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/utils/format';

export default function VehiclesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const isStaff = user && ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'].includes(user.role);
  const canManage = user && ['ADMINISTRATOR', 'FLEET_MANAGER'].includes(user.role);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await vehiclesApi.list({
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
        available: !isStaff ? 'true' : undefined,
      });
      setVehicles(data.data.data);
      setPagination(data.data.pagination);
    } catch {
      error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, isStaff]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'Fleet Management' : 'Available Vehicles'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total} {isStaff ? 'vehicles in fleet' : 'vehicles available for rental'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/vehicles/new')}>
            <Plus size={16} /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm w-full bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            placeholder="Search make, model, plate number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {isStaff && (
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        )}
        <Button variant="outline" size="sm" onClick={() => fetchVehicles()}>
          <SlidersHorizontal size={14} /> Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <PageSpinner />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles found"
          description="Try adjusting your search or filters"
          icon={<Car size={48} />}
          action={canManage ? <Button onClick={() => navigate('/vehicles/new')}>Add Vehicle</Button> : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                isStaff={!!isStaff}
                isCustomer={user?.role === 'CUSTOMER'}
                onClick={() => navigate(`/vehicles/${v.id}`)}
                onBook={() => navigate(`/bookings/new?vehicleId=${v.id}`)}
              />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ─── Vehicle Card — uses only lucide-react icons, no redeclarations ──────────
function VehicleCard({
  vehicle,
  isStaff,
  isCustomer,
  onClick,
  onBook,
}: {
  vehicle: Vehicle;
  isStaff: boolean;
  isCustomer: boolean;
  onClick: () => void;
  onBook: () => void;
}) {
  // Safe image access
  const images = Array.isArray(vehicle.images) ? vehicle.images : [];
  const img = images.find((i) => i.isPrimary) ?? images[0] ?? null;
  const isAvailable = vehicle.status === 'AVAILABLE';

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm
        hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {img ? (
          <img
            src={img.url}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car size={48} className="text-gray-300" />
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Status badge — staff only */}
        {isStaff && (
          <div className="absolute top-3 left-3">
            <Badge status={vehicle.status} />
          </div>
        )}

        {/* Price pill */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
          <span className="font-bold text-blue-600 text-sm">{formatCurrency(vehicle.dailyRate)}</span>
          <span className="text-gray-400 text-xs font-normal">/day</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">{vehicle.category?.name ?? ''}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 font-mono">{vehicle.registrationNumber}</span>
            {vehicle.color && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">{vehicle.color}</span>
              </>
            )}
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-gray-400" />
            <span>{vehicle.seatingCapacity} seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel size={12} className="text-gray-400" />
            <span className="capitalize">{vehicle.fuelType.replace(/_/g, ' ').toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-gray-400" />
            <span className="capitalize">{vehicle.transmission.toLowerCase()}</span>
          </div>
        </div>

        {/* CTA button */}
        {isCustomer && isAvailable ? (
          <button
            onClick={(e) => { e.stopPropagation(); onBook(); }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
              rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
          >
            Book Now
          </button>
        ) : isStaff ? (
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm
              font-medium rounded-xl transition-colors"
          >
            View Details →
          </button>
        ) : !isAvailable ? (
          <div className="w-full py-2.5 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
            Currently unavailable
          </div>
        ) : null}
      </div>
    </div>
  );
}
