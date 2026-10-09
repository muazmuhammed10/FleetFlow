import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import { contractsApi, Contract } from '@/api/contracts';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/utils/format';
import { bookingsApi } from '@/api/bookings';
import axios from 'axios';

export default function ContractsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewContract, setViewContract] = useState<Contract | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contractsApi.list({ page, limit: 20, search: search || undefined, status: status || undefined });
      setContracts(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load contracts'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    if (!bookingRef.trim()) return;
    setCreating(true);
    try {
      // Find booking by reference
      const { data: bookings } = await bookingsApi.list({ search: bookingRef.trim(), limit: 5 });
      const booking = bookings.data.data.find((b: any) => b.bookingReference === bookingRef.trim().toUpperCase());
      if (!booking) { error('Booking not found', 'Check the booking reference'); setCreating(false); return; }

      await contractsApi.create(booking.id);
      success('Contract created successfully');
      setShowCreate(false);
      setBookingRef('');
      fetch();
    } catch (err) {
      if (axios.isAxiosError(err)) error('Failed', err.response?.data?.message);
      else error('Failed to create contract');
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage rental agreements and contracts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Contract
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search contract number or booking ref..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>

      {loading ? <PageSpinner /> : contracts.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description="Create a contract from an approved booking"
          icon={<FileText size={48} />}
          action={<Button onClick={() => setShowCreate(true)}>Create Contract</Button>}
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Contract #</Th>
                <Th>Booking</Th>
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th>Dates</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {contracts.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-mono text-xs font-semibold text-blue-600">{c.contractNumber}</Td>
                  <Td className="font-mono text-xs">{c.booking?.bookingReference}</Td>
                  <Td className="text-sm">
                    {c.booking?.customerProfile?.user?.firstName} {c.booking?.customerProfile?.user?.lastName}
                  </Td>
                  <Td className="text-sm">
                    {c.booking?.vehicle?.year} {c.booking?.vehicle?.make} {c.booking?.vehicle?.model}
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {c.booking?.pickupDate ? formatDate(c.booking.pickupDate) : '—'} →{' '}
                    {c.booking?.returnDate ? formatDate(c.booking.returnDate) : '—'}
                  </Td>
                  <Td className="font-semibold">{c.booking?.totalAmount ? formatCurrency(c.booking.totalAmount) : '—'}</Td>
                  <Td><Badge status={c.status} /></Td>
                  <Td>
                    <button
                      onClick={() => setViewContract(c)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Eye size={13} /> View
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-4 border-t border-gray-100">
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Contract" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter the booking reference to generate a rental contract.</p>
          <div>
            <label className="text-sm font-medium text-gray-700">Booking Reference</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="e.g. BKAB12CD34"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-gray-400 mt-1">Booking must be in APPROVED or ACTIVE status</p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button loading={creating} onClick={handleCreate} className="flex-1">Create Contract</Button>
          </div>
        </div>
      </Modal>

      {/* View Contract Modal */}
      {viewContract && (
        <Modal open={!!viewContract} onClose={() => setViewContract(null)} title={`Contract ${viewContract.contractNumber}`} size="lg">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge status={viewContract.status} className="text-sm px-3 py-1" />
              <span className="text-xs text-gray-400">Created {formatDate(viewContract.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Customer</p>
                <p className="text-gray-900">{viewContract.booking?.customerProfile?.user?.firstName} {viewContract.booking?.customerProfile?.user?.lastName}</p>
                <p className="text-gray-500">{viewContract.booking?.customerProfile?.user?.email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Vehicle</p>
                <p className="text-gray-900">{viewContract.booking?.vehicle?.year} {viewContract.booking?.vehicle?.make} {viewContract.booking?.vehicle?.model}</p>
                <p className="text-gray-500">{viewContract.booking?.vehicle?.registrationNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Rental Period</p>
                <p className="text-gray-900">{viewContract.booking?.pickupDate ? formatDate(viewContract.booking.pickupDate) : '—'}</p>
                <p className="text-gray-500">to {viewContract.booking?.returnDate ? formatDate(viewContract.booking.returnDate) : '—'}</p>
                <p className="text-xs text-gray-400">{viewContract.booking?.rentalDays} days</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Amount</p>
                <p className="text-2xl font-bold text-blue-600">{viewContract.booking?.totalAmount ? formatCurrency(viewContract.booking.totalAmount) : '—'}</p>
                <p className="text-xs text-amber-600">Simulated payment</p>
              </div>
            </div>

            {viewContract.terms && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">Contract Terms</p>
                <p className="text-xs text-blue-600 leading-relaxed">{viewContract.terms}</p>
              </div>
            )}

            {viewContract.signedAt && (
              <p className="text-xs text-green-600 font-medium">✓ Signed on {formatDate(viewContract.signedAt)}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
