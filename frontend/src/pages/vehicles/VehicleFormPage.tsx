import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { VehicleCategory } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import axios from 'axios';

const schema = z.object({
  registrationNumber: z.string().min(2).max(20),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  categoryId: z.string().uuid('Select a category'),
  transmission: z.enum(['AUTOMATIC', 'MANUAL', 'CVT']),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG_IN_HYBRID']),
  seatingCapacity: z.coerce.number().int().min(1).max(100),
  dailyRate: z.coerce.number().positive(),
  mileage: z.coerce.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  color: z.string().max(30).optional(),
  vin: z.string().max(17).optional(),
  insuranceExpiryDate: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const isEdit = !!id;

  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    vehiclesApi.listCategories().then(({ data }) => setCategories(data.data));
    if (isEdit && id) {
      vehiclesApi.get(id).then(({ data }) => {
        const v = data.data;
        reset({
          ...v,
          dailyRate: Number(v.dailyRate),
          insuranceExpiryDate: v.insuranceExpiryDate ? v.insuranceExpiryDate.slice(0, 10) : '',
          registrationExpiryDate: v.registrationExpiryDate ? v.registrationExpiryDate.slice(0, 10) : '',
        });
        setLoading(false);
      }).catch(() => { error('Failed to load vehicle'); setLoading(false); });
    }
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        insuranceExpiryDate: values.insuranceExpiryDate ? new Date(values.insuranceExpiryDate).toISOString() : null,
        registrationExpiryDate: values.registrationExpiryDate ? new Date(values.registrationExpiryDate).toISOString() : null,
      };
      if (isEdit && id) {
        await vehiclesApi.update(id, payload);
        success('Vehicle updated');
      } else {
        await vehiclesApi.create(payload);
        success('Vehicle created');
      }
      navigate('/vehicles');
    } catch (err) {
      if (axios.isAxiosError(err)) error('Save failed', err.response?.data?.message);
      else error('Save failed');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Registration Number" required error={errors.registrationNumber?.message} {...register('registrationNumber')} />
              <Select label="Category" required error={errors.categoryId?.message}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select category" {...register('categoryId')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Make" required error={errors.make?.message} {...register('make')} />
              <Input label="Model" required error={errors.model?.message} {...register('model')} />
              <Input label="Year" type="number" required error={errors.year?.message} {...register('year')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Color" error={errors.color?.message} {...register('color')} />
              <Input label="VIN" error={errors.vin?.message} {...register('vin')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Select label="Transmission" required error={errors.transmission?.message}
                options={[{ value: 'AUTOMATIC', label: 'Automatic' }, { value: 'MANUAL', label: 'Manual' }, { value: 'CVT', label: 'CVT' }]}
                placeholder="Select" {...register('transmission')} />
              <Select label="Fuel Type" required error={errors.fuelType?.message}
                options={[
                  { value: 'PETROL', label: 'Petrol' }, { value: 'DIESEL', label: 'Diesel' },
                  { value: 'ELECTRIC', label: 'Electric' }, { value: 'HYBRID', label: 'Hybrid' },
                  { value: 'PLUG_IN_HYBRID', label: 'Plug-in Hybrid' },
                ]}
                placeholder="Select" {...register('fuelType')} />
              <Input label="Seating Capacity" type="number" required error={errors.seatingCapacity?.message} {...register('seatingCapacity')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Daily Rate ($)" type="number" step="0.01" required error={errors.dailyRate?.message} {...register('dailyRate')} />
              <Input label="Current Mileage (km)" type="number" error={errors.mileage?.message} {...register('mileage')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3} {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Compliance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Insurance Expiry Date" type="date" error={errors.insuranceExpiryDate?.message} {...register('insuranceExpiryDate')} />
              <Input label="Registration Expiry Date" type="date" error={errors.registrationExpiryDate?.message} {...register('registrationExpiryDate')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Add Vehicle'}</Button>
        </div>
      </form>
    </div>
  );
}
