import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Edit, Archive, Calendar, Users, Fuel, Zap } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/utils/format';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const canManage = user && ['ADMINISTRATOR', 'FLEET_MANAGER'].includes(user.role);
  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!id) return;
    vehiclesApi
      .get(id)
      .then(({ data }) => setVehicle(data.data))
      .catch(() => error('Failed to load vehicle'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleArchive = async () => {
    if (!id) return;
    setArchiving(true);
    try {
      await vehiclesApi.archive(id);
      success('Vehicle archived');
      navigate('/vehicles');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archive failed';
      error('Archive failed', msg);
    } finally {
      setArchiving(false);
      setShowArchive(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!vehicle) {
    return (
      <div className="text-center text-gray-500 py-20">
        <Car size={48} className="mx-auto text-gray-200 mb-3" />
        <p className="font-medium">Vehicle not found</p>
        <button onClick={() => navigate('/vehicles')} className="mt-4 text-blue-600 text-sm hover:underline">
          Back to vehicles
        </button>
      </div>
    );
  }

  // Safe image access
  const images = Array.isArray(vehicle.images) ? vehicle.images : [];
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0] ?? null;

  const specs = [
    { label: 'Transmission', value: vehicle.transmission?.replace(/_/g, ' ') ?? '—' },
    { label: 'Fuel Type',     value: vehicle.fuelType?.replace(/_/g, ' ') ?? '—' },
    { label: 'Seats',         value: vehicle.seatingCapacity ? `${vehicle.seatingCapacity} passengers` : '—' },
    { label: 'Color',         value: vehicle.color ?? '—' },
    { label: 'Mileage',       value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : '—' },
    { label: 'VIN',           value: vehicle.vin ?? '—' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/vehicles/${id}/edit`)}>
              <Edit size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowArchive(true)}>
              <Archive size={14} /> Archive
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — image + info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 h-64 relative">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car size={64} className="text-gray-300" />
              </div>
            )}
            {/* Price overlay */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-lg">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(vehicle.dailyRate)}</p>
              <p className="text-xs text-gray-400 text-right">per day</p>
            </div>
          </div>

          {/* Title + status */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {vehicle.category?.name ?? ''} · {vehicle.registrationNumber}
                </p>
              </div>
              <Badge status={vehicle.status} className="text-sm px-3 py-1 flex-shrink-0" />
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
              {vehicle.description}
            </p>
          )}

          {/* Quick specs strip */}
          <div className="flex gap-5 flex-wrap text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-blue-500" />
              <span>{vehicle.seatingCapacity} seats</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel size={15} className="text-blue-500" />
              <span className="capitalize">{vehicle.fuelType?.replace(/_/g, ' ').toLowerCase() ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-blue-500" />
              <span className="capitalize">{vehicle.transmission?.toLowerCase() ?? '—'}</span>
            </div>
            {vehicle.color && (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full bg-gray-300 border border-gray-200" />
                <span>{vehicle.color}</span>
              </div>
            )}
          </div>

          {/* Full specs grid */}
          <Card>
            <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {specs.map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {value.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Compliance — staff only */}
          {canManage && (
            <Card>
              <CardHeader><CardTitle>Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Insurance expiry', date: vehicle.insuranceExpiryDate },
                  { label: 'Registration expiry', date: vehicle.registrationExpiryDate },
                ].map(({ label, date }) => {
                  const expired = date ? new Date(date) < new Date() : false;
                  return (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-gray-500">{label}</span>
                      <span className={expired ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                        {date ? formatDate(date) : '—'}
                        {expired && ' ⚠'}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mileage</span>
                  <span className="text-gray-800">
                    {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Now — customers only */}
          {isCustomer && vehicle.status === 'AVAILABLE' && (
            <Card>
              <CardContent className="pt-5 pb-5 text-center space-y-3">
                <p className="font-bold text-2xl text-blue-600">{formatCurrency(vehicle.dailyRate)}</p>
                <p className="text-xs text-gray-400">per day</p>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/bookings/new?vehicleId=${vehicle.id}`)}
                >
                  <Calendar size={15} /> Book Now
                </Button>
                <p className="text-xs text-gray-400">No commitment until approved</p>
              </CardContent>
            </Card>
          )}

          {/* Unavailable notice */}
          {isCustomer && vehicle.status !== 'AVAILABLE' && (
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-sm text-gray-500">This vehicle is currently</p>
                <Badge status={vehicle.status} className="mx-auto mt-2" />
                <p className="text-xs text-gray-400 mt-2">Check back later or browse other vehicles.</p>
                <button
                  onClick={() => navigate('/vehicles')}
                  className="mt-3 text-sm text-blue-600 hover:underline font-medium"
                >
                  Browse all vehicles →
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Archive confirmation */}
      <ConfirmDialog
        open={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archive Vehicle"
        message={`Archive ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})? This removes it from listings. Booking history is preserved.`}
        confirmLabel="Archive Vehicle"
      />
    </div>
  );
}
