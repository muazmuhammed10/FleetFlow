import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Wrench } from 'lucide-react';
import { maintenanceApi } from '@/api/maintenance';
import { MaintenanceRecord } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate, formatCurrency } from '@/utils/format';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { error } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await maintenanceApi.list({ page, limit: 20, search: search || undefined, status: status || undefined });
      setRecords(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load maintenance records'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fleet maintenance records and scheduling</p>
        </div>
        <Button onClick={() => navigate('/maintenance/new')}>
          <Plus size={16} /> New Record
        </Button>      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['REPORTED','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          )}
        </select>
      </div>

      {loading ? <PageSpinner /> : records.length === 0 ? (
        <EmptyState title="No maintenance records" icon={<Wrench size={48} />} />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Vehicle</Th>
                <Th>Title</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Scheduled</Th>
                <Th>Cost</Th>
              </tr>
            </Thead>
            <Tbody>
              {records.map((r) => (
                <Tr key={r.id} onClick={() => navigate(`/maintenance/${r.id}/edit`)}>                  <Td className="font-medium">
                    <p>{(r.vehicle as any)?.make} {(r.vehicle as any)?.model}</p>
                    <p className="text-xs text-gray-400">{(r.vehicle as any)?.registrationNumber}</p>
                  </Td>
                  <Td>{r.title}</Td>
                  <Td className="text-xs">{r.maintenanceType.replace(/_/g, ' ')}</Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td className="text-gray-500 text-xs">{r.scheduledDate ? formatDate(r.scheduledDate) : '—'}</Td>
                  <Td>{r.cost ? formatCurrency(r.cost) : '—'}</Td>
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
