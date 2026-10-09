import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { bookingsApi } from '@/api/bookings';
import { Booking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate, formatCurrency } from '@/utils/format';
import { Calendar } from 'lucide-react';

const STATUSES = ['PENDING','APPROVED','CONFIRMED','ACTIVE','COMPLETED','CANCELLED','REJECTED','OVERDUE'];

export default function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const isCustomer = user?.role === 'CUSTOMER';

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await bookingsApi.list({
        page, limit: 20,
        search: search || undefined,
        status: status || undefined,
      });
      setBookings(data.data.data);
      setPagination(data.data.pagination);
    } catch {
      error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCustomer ? 'Your rental reservations' : 'Manage all reservations'}
          </p>
        </div>
        {isCustomer && (
          <Button onClick={() => navigate('/bookings/new')}>
            <Plus size={16} /> New Booking
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search reference, vehicle..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <PageSpinner /> : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={isCustomer ? "You haven't made any bookings yet" : "No bookings match your filters"}
          icon={<Calendar size={48} />}
          action={isCustomer ? <Button onClick={() => navigate('/bookings/new')}>Make your first booking</Button> : undefined}
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Reference</Th>
                {!isCustomer && <Th>Customer</Th>}
                <Th>Vehicle</Th>
                <Th>Pickup</Th>
                <Th>Return</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {bookings.map((b) => (
                <Tr key={b.id} onClick={() => navigate(`/bookings/${b.id}`)}>
                  <Td className="font-mono text-xs font-semibold text-brand-600">{b.bookingReference}</Td>
                  {!isCustomer && (
                    <Td>
                      {(b.customerProfile as any)?.user?.firstName} {(b.customerProfile as any)?.user?.lastName}
                    </Td>
                  )}
                  <Td>{(b.vehicle as any)?.make} {(b.vehicle as any)?.model}</Td>
                  <Td>{formatDate(b.pickupDate)}</Td>
                  <Td>{formatDate(b.returnDate)}</Td>
                  <Td className="font-semibold">{formatCurrency(b.totalAmount)}</Td>
                  <Td><Badge status={b.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-4 border-t border-gray-100">
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
