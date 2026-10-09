import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Car } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { bookingsApi } from '@/api/bookings';
import { Vehicle } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import axios from 'axios';

const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);

const toISOLocal = (d: Date) => d.toISOString().slice(0, 16);

const schema = z.object({
  vehicleId: z.string().uuid('Select a vehicle'),
  pickupDate: z.string().min(1, 'Pickup date required'),
  returnDate: z.string().min(1, 'Return date required'),
  pickupLocation: z.string().max(200).optional(),
  returnLocation: z.string().max(200).optional(),
  specialRequests: z.string().max(500).optional(),
}).refine(d => new Date(d.returnDate) > new Date(d.pickupDate), {
  message: 'Return must be after pickup', path: ['returnDate'],
});
type FormValues = z.infer<typeof schema>;

export default function NewBookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { success, error } = useToast();
  const preselectedVehicleId = params.get('vehicleId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: preselectedVehicleId ?? '',
      pickupDate: toISOLocal(tomorrow),
      returnDate: toISOLocal(dayAfter),
    },
  });

  const watchVehicleId = watch('vehicleId');
  const watchPickup = watch('pickupDate');
  const watchReturn = watch('returnDate');

  useEffect(() => {
    vehiclesApi.list({ available: 'true', limit: 100 })
      .then(({ data }) => setVehicles(data.data.data))
      .finally(() => setLoadingVehicles(false));
  }, []);

  useEffect(() => {
    if (watchVehicleId) {
      const v = vehicles.find(v => v.id === watchVehicleId);
      setSelectedVehicle(v ?? null);
    }
  }, [watchVehicleId, vehicles]);

  const calcDays = () => {
    if (!watchPickup || !watchReturn) return 0;
    const diff = (new Date(watchReturn).getTime() - new Date(watchPickup).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(diff));
  };

  const estimatedTotal = () => {
    if (!selectedVehicle) return 0;
    const days = calcDays();
    const subtotal = Number(selectedVehicle.dailyRate) * days;
    const tax = subtotal * 0.1;
    return subtotal + tax + 200; // +200 deposit
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await bookingsApi.create({
        ...values,
        pickupDate: new Date(values.pickupDate).toISOString(),
        returnDate: new Date(values.returnDate).toISOString(),
      });
      success('Booking submitted!', 'Your booking is pending approval.');
      navigate(`/bookings/${data.data.id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) error('Booking failed', err.response?.data?.message);
      else error('Booking failed');
    }
  };

  if (loadingVehicles) return <PageSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Select Vehicle</CardTitle></CardHeader>
          <CardContent>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...register('vehicleId')}
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} — {v.category?.name} — {formatCurrency(v.dailyRate)}/day
                </option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-xs text-red-600 mt-1">{errors.vehicleId.message}</p>}

            {selectedVehicle && (
              <div className="mt-3 p-3 bg-brand-50 rounded-lg flex items-center gap-3">
                <div className="bg-white rounded-lg p-2"><Car size={20} className="text-brand-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedVehicle.transmission} · {selectedVehicle.fuelType} · {selectedVehicle.seatingCapacity} seats
                  </p>
                </div>
                <p className="ml-auto font-bold text-brand-600">{formatCurrency(selectedVehicle.dailyRate)}/day</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rental Dates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Pickup Date & Time" type="datetime-local" required
                error={errors.pickupDate?.message} {...register('pickupDate')} />
              <Input label="Return Date & Time" type="datetime-local" required
                error={errors.returnDate?.message} {...register('returnDate')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Pickup Location" placeholder="e.g. Main Office" {...register('pickupLocation')} />
              <Input label="Return Location" placeholder="e.g. Airport Branch" {...register('returnLocation')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Special Requests</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={2} placeholder="Any special requirements..." {...register('specialRequests')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Price estimate */}
        {selectedVehicle && (
          <Card>
            <CardHeader><CardTitle>Estimated Pricing</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{formatCurrency(selectedVehicle.dailyRate)} × {calcDays()} days</span>
                <span>{formatCurrency(Number(selectedVehicle.dailyRate) * calcDays())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (10%)</span>
                <span>{formatCurrency(Number(selectedVehicle.dailyRate) * calcDays() * 0.1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security Deposit</span>
                <span>$200.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Estimated Total</span>
                <span className="text-brand-600">{formatCurrency(estimatedTotal())}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">* Final amount calculated by server. Prices are indicative.</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Submit Booking Request</Button>
        </div>
      </form>
    </div>
  );
}
