import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { maintenanceApi } from '@/api/maintenance';
import { vehiclesApi } from '@/api/vehicles';
import { Vehicle } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import axios from 'axios';

const schema = z.object({
  vehicleId: z.string().uuid('Select a vehicle'),
  maintenanceType: z.enum([
    'ROUTINE_SERVICE','REPAIR','INSPECTION','TIRE_CHANGE',
    'OIL_CHANGE','BRAKE_SERVICE','ENGINE_REPAIR','BODYWORK','OTHER',
  ]),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(1000).optional(),
  scheduledDate: z.string().optional(),
  assignedTechnicianName: z.string().max(100).optional(),
  cost: z.coerce.number().min(0).optional(),
  mileageAtService: z.coerce.number().int().min(0).optional(),
  nextServiceDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof schema>;

const MAINTENANCE_TYPES = [
  { value: 'ROUTINE_SERVICE',  label: 'Routine Service' },
  { value: 'OIL_CHANGE',       label: 'Oil Change' },
  { value: 'TIRE_CHANGE',      label: 'Tire Change' },
  { value: 'BRAKE_SERVICE',    label: 'Brake Service' },
  { value: 'INSPECTION',       label: 'Inspection' },
  { value: 'REPAIR',           label: 'Repair' },
  { value: 'ENGINE_REPAIR',    label: 'Engine Repair' },
  { value: 'BODYWORK',         label: 'Bodywork' },
  { value: 'OTHER',            label: 'Other' },
];

export default function MaintenanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const isEdit = !!id;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    vehiclesApi.list({ limit: 100 }).then(({ data }) => setVehicles(data.data.data));

    if (isEdit && id) {
      maintenanceApi.get(id).then(({ data }) => {
        const m = data.data;
        reset({
          ...m,
          cost: m.cost ? Number(m.cost) : undefined,
          mileageAtService: m.mileageAtService ?? undefined,
          scheduledDate: m.scheduledDate ? m.scheduledDate.slice(0, 16) : '',
          nextServiceDate: m.nextServiceDate ? m.nextServiceDate.slice(0, 16) : '',
        });
        setLoading(false);
      }).catch(() => { error('Failed to load record'); setLoading(false); });
    }
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        scheduledDate: values.scheduledDate ? new Date(values.scheduledDate).toISOString() : undefined,
        nextServiceDate: values.nextServiceDate ? new Date(values.nextServiceDate).toISOString() : undefined,
      };
      if (isEdit && id) {
        await maintenanceApi.update(id, payload);
        success('Maintenance record updated');
      } else {
        await maintenanceApi.create(payload);
        success('Maintenance record created');
      }
      navigate('/maintenance');
    } catch (err) {
      if (axios.isAxiosError(err)) error('Save failed', err.response?.data?.message);
      else error('Save failed');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/maintenance')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Maintenance Record' : 'New Maintenance Record'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vehicle" required
                error={errors.vehicleId?.message}
                placeholder="Select vehicle"
                options={vehicles.map(v => ({
                  value: v.id,
                  label: `${v.year} ${v.make} ${v.model} (${v.registrationNumber})`,
                }))}
                {...register('vehicleId')}
              />
              <Select
                label="Maintenance Type" required
                error={errors.maintenanceType?.message}
                placeholder="Select type"
                options={MAINTENANCE_TYPES}
                {...register('maintenanceType')}
              />
            </div>
            <Input label="Title" required placeholder="e.g. Annual service" error={errors.title?.message} {...register('title')} />
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea rows={3} placeholder="Describe the maintenance work..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...register('description')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scheduling & Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Scheduled Date & Time" type="datetime-local" error={errors.scheduledDate?.message} {...register('scheduledDate')} />
              <Input label="Assigned Technician" placeholder="Technician name" error={errors.assignedTechnicianName?.message} {...register('assignedTechnicianName')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cost ($)" type="number" step="0.01" min="0" placeholder="0.00" error={errors.cost?.message} {...register('cost')} />
              <Input label="Mileage at Service (km)" type="number" min="0" placeholder="0" error={errors.mileageAtService?.message} {...register('mileageAtService')} />
            </div>
            <Input label="Next Service Due" type="datetime-local" error={errors.nextServiceDate?.message} {...register('nextServiceDate')} />
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={2} placeholder="Additional notes..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...register('notes')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/maintenance')}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Record'}
          </Button>
        </div>
      </form>
    </div>
  );
}
