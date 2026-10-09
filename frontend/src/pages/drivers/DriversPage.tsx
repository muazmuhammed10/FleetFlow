import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Truck, UserCheck, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { driversApi, DriverProfile } from '@/api/drivers';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const AVAILABILITY_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ON_ASSIGNMENT: 'bg-blue-100 text-blue-800',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
};

const createSchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().email('Invalid email'),
  phone: z.string().max(20).optional(),
  licenceNumber: z.string().min(1, 'Required').max(50),
  licenceExpiryDate: z.string().min(1, 'Required'),
  licenceClass: z.string().max(10).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  notes: z.string().max(500).optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

export default function DriversPage() {
  const { success, error } = useToast();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingAvail, setUpdatingAvail] = useState<string | null>(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await driversApi.list({
        page, limit: 20,
        search: search || undefined,
        availability: availability || undefined,
      });
      setDrivers(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load drivers'); }
    finally { setLoading(false); }
  }, [page, search, availability]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const onCreateSubmit = async (values: CreateFormValues) => {
    try {
      await driversApi.create({
        ...values,
        licenceExpiryDate: new Date(values.licenceExpiryDate).toISOString(),
      });
      success('Driver created successfully');
      setShowCreate(false);
      reset();
      fetchDrivers();
    } catch (err) {
      if (axios.isAxiosError(err)) error('Failed', err.response?.data?.message);
      else error('Failed to create driver');
    }
  };

  const handleAvailabilityChange = async (driverId: string, newAvail: string) => {
    setUpdatingAvail(driverId);
    try {
      await driversApi.updateAvailability(driverId, newAvail);
      success('Availability updated');
      fetchDrivers();
    } catch (err) {
      if (axios.isAxiosError(err)) error('Failed', err.response?.data?.message);
      else error('Failed to update availability');
    } finally { setUpdatingAvail(null); }
  };

  const openDetail = async (driver: DriverProfile) => {
    try {
      const { data } = await driversApi.get(driver.id);
      setSelectedDriver(data.data);
      setShowDetail(true);
    } catch { error('Failed to load driver details'); }
  };

  const availStats = {
    available: drivers.filter(d => d.availability === 'AVAILABLE').length,
    onAssignment: drivers.filter(d => d.availability === 'ON_ASSIGNMENT').length,
    onLeave: drivers.filter(d => d.availability === 'ON_LEAVE').length,
    inactive: drivers.filter(d => d.availability === 'INACTIVE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage driver profiles and assignments</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Available', count: availStats.available, icon: <CheckCircle size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'On Assignment', count: availStats.onAssignment, icon: <Truck size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On Leave', count: availStats.onLeave, icon: <Clock size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Inactive', count: availStats.inactive, icon: <X size={18} />, color: 'text-gray-500', bg: 'bg-gray-100' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`${s.bg} ${s.color} rounded-xl p-2`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search name or licence number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={availability}
          onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
        >
          <option value="">All availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_ASSIGNMENT">On Assignment</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <PageSpinner />
      ) : drivers.length === 0 ? (
        <EmptyState
          title="No drivers found"
          description="Add your first driver to get started"
          icon={<Truck size={48} />}
          action={<Button onClick={() => setShowCreate(true)}>Add Driver</Button>}
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Driver</Th>
                <Th>Licence No.</Th>
                <Th>Licence Class</Th>
                <Th>Expiry</Th>
                <Th>Experience</Th>
                <Th>Availability</Th>
                <Th>Change Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {drivers.map((d) => {
                const expiry = d.licenceExpiryDate ? new Date(d.licenceExpiryDate) : null;
                const isExpired = expiry && expiry < new Date();
                const expiringSoon = expiry && !isExpired && expiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <Tr key={d.id}>
                    <Td>
                      <div>
                        <p className="font-semibold text-gray-900">{d.user?.firstName} {d.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{d.user?.email}</p>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs font-semibold">{d.licenceNumber}</Td>
                    <Td className="text-sm">{d.licenceClass ?? '—'}</Td>
                    <Td>
                      <span className={cn(
                        'text-xs font-medium',
                        isExpired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : 'text-gray-600'
                      )}>
                        {expiry ? formatDate(expiry.toISOString()) : '—'}
                        {isExpired && ' ⚠ Expired'}
                        {expiringSoon && ' ⚠ Soon'}
                      </span>
                    </Td>
                    <Td className="text-sm">{d.experienceYears != null ? `${d.experienceYears} yr${d.experienceYears !== 1 ? 's' : ''}` : '—'}</Td>
                    <Td>
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', AVAILABILITY_COLORS[d.availability] ?? 'bg-gray-100 text-gray-700')}>
                        {d.availability.replace('_', ' ')}
                      </span>
                    </Td>
                    <Td>
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={d.availability}
                        disabled={updatingAvail === d.id}
                        onChange={(e) => handleAvailabilityChange(d.id, e.target.value)}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_ASSIGNMENT">On Assignment</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </Td>
                    <Td>
                      <button
                        onClick={() => openDetail(d)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <UserCheck size={13} /> Details
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <div className="px-4 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* ── Create Driver Modal ── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Add New Driver" size="lg">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Address" type="email" required error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Licence Number" required error={errors.licenceNumber?.message} {...register('licenceNumber')} />
            <Input label="Licence Expiry Date" type="date" required error={errors.licenceExpiryDate?.message} {...register('licenceExpiryDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Licence Class"
              options={[
                { value: 'A', label: 'Class A — Heavy Vehicles' },
                { value: 'B', label: 'Class B — Regular Cars' },
                { value: 'C', label: 'Class C — Commercial' },
                { value: 'D', label: 'Class D — Motorcycles' },
              ]}
              placeholder="Select class"
              error={errors.licenceClass?.message}
              {...register('licenceClass')}
            />
            <Input label="Years of Experience" type="number" min={0} max={60} error={errors.experienceYears?.message} {...register('experienceYears')} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any additional notes..."
              {...register('notes')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Add Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Driver Detail Modal ── */}
      {selectedDriver && (
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Driver Profile" size="lg">
          <div className="space-y-5">
            {/* Profile header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selectedDriver.user?.firstName?.[0]}{selectedDriver.user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg">{selectedDriver.user?.firstName} {selectedDriver.user?.lastName}</p>
                <p className="text-sm text-gray-500">{selectedDriver.user?.email}</p>
                {selectedDriver.user?.phone && <p className="text-sm text-gray-500">{selectedDriver.user.phone}</p>}
              </div>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', AVAILABILITY_COLORS[selectedDriver.availability])}>
                {selectedDriver.availability.replace('_', ' ')}
              </span>
            </div>

            {/* Licence info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Licence Number', value: selectedDriver.licenceNumber },
                { label: 'Licence Class', value: selectedDriver.licenceClass ?? '—' },
                { label: 'Expiry Date', value: selectedDriver.licenceExpiryDate ? formatDate(selectedDriver.licenceExpiryDate) : '—' },
                { label: 'Experience', value: selectedDriver.experienceYears != null ? `${selectedDriver.experienceYears} years` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {selectedDriver.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                <p className="text-sm text-amber-700">{selectedDriver.notes}</p>
              </div>
            )}

            {/* Assignment history */}
            {selectedDriver.assignments && selectedDriver.assignments.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Assignment History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDriver.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                      <div>
                        <p className="font-medium text-gray-900 font-mono text-xs">{a.booking?.bookingReference}</p>
                        <p className="text-xs text-gray-400">
                          {a.booking?.vehicle?.make} {a.booking?.vehicle?.model} · {a.booking?.vehicle?.registrationNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge status={a.booking?.status ?? 'PENDING'} />
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.assignedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDriver.assignments?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No assignments yet</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
