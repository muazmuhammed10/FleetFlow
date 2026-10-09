import React, { useEffect, useState, useCallback } from 'react';
import { Search, Shield } from 'lucide-react';
import api from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/utils/format';

interface AuditLog {
  id: string;
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
  actor?: { firstName: string; lastName: string; email: string };
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-green-100 text-green-700',
  USER_LOGOUT: 'bg-gray-100 text-gray-600',
  USER_LOGIN_FAILED: 'bg-red-100 text-red-700',
  USER_REGISTERED: 'bg-blue-100 text-blue-700',
  USER_PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-700',
  VEHICLE_CREATED: 'bg-indigo-100 text-indigo-700',
  VEHICLE_UPDATED: 'bg-indigo-100 text-indigo-700',
  BOOKING_CREATED: 'bg-blue-100 text-blue-700',
  BOOKING_APPROVED: 'bg-green-100 text-green-700',
  BOOKING_CANCELLED: 'bg-red-100 text-red-700',
  BOOKING_REJECTED: 'bg-red-100 text-red-700',
  PAYMENT_RECORDED: 'bg-purple-100 text-purple-700',
};

export default function AuditLogPage() {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);

      const { data } = await api.get(`/audit?${params.toString()}`);
      setLogs(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, search, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete record of all system events and actions</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search descriptions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All actions</option>
          <option value="USER_LOGIN">Login</option>
          <option value="USER_LOGIN_FAILED">Failed Login</option>
          <option value="USER_REGISTERED">Registration</option>
          <option value="USER_PASSWORD_CHANGED">Password Changed</option>
          <option value="VEHICLE_CREATED">Vehicle Created</option>
          <option value="BOOKING_CREATED">Booking Created</option>
          <option value="BOOKING_APPROVED">Booking Approved</option>
          <option value="BOOKING_CANCELLED">Booking Cancelled</option>
          <option value="PAYMENT_RECORDED">Payment Recorded</option>
          <option value="PICKUP_RECORDED">Pickup Recorded</option>
          <option value="RETURN_RECORDED">Return Recorded</option>
        </select>
      </div>

      {loading ? <PageSpinner /> : logs.length === 0 ? (
        <EmptyState title="No audit logs found" icon={<Shield size={48} />} />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>Action</Th>
                <Th>Actor</Th>
                <Th>Description</Th>
                <Th>Resource</Th>
                <Th>IP</Th>
              </tr>
            </Thead>
            <Tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </Td>
                  <Td className="text-sm">
                    {log.actor ? (
                      <div>
                        <p className="font-medium text-gray-900">{log.actor.firstName} {log.actor.lastName}</p>
                        <p className="text-xs text-gray-400">{log.actor.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Td>
                  <Td className="text-sm text-gray-700 max-w-xs truncate">{log.description}</Td>
                  <Td className="text-xs text-gray-400">
                    {log.resourceType ? `${log.resourceType}` : '—'}
                  </Td>
                  <Td className="text-xs text-gray-400 font-mono">{log.ipAddress ?? '—'}</Td>
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
