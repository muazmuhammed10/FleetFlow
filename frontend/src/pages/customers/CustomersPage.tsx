import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, UserCheck } from 'lucide-react';
import { customersApi } from '@/api/customers';
import { CustomerProfile } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/format';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { error } = useToast();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list({ page, limit: 20, search: search || undefined });
      setCustomers(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage customer accounts and verifications</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Search customers..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? <PageSpinner /> : customers.length === 0 ? (
        <EmptyState title="No customers found" icon={<Users size={48} />} />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Customer</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Verified</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
              </tr>
            </Thead>
            <Tbody>
              {customers.map((c) => {
                const u = c.user as any;
                return (
                  <Tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>                    <Td className="font-medium">{u?.firstName} {u?.lastName}</Td>
                    <Td className="text-gray-500">{u?.email}</Td>
                    <Td className="text-gray-500">{u?.phone ?? '—'}</Td>
                    <Td>
                      {c.isVerified
                        ? <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle size={12} /> Verified</span>
                        : <span className="text-gray-400 text-xs">Unverified</span>}
                    </Td>
                    <Td><Badge status={u?.status ?? 'ACTIVE'} /></Td>
                    <Td className="text-gray-500 text-xs">{formatDate(c.createdAt)}</Td>
                  </Tr>
                );
              })}
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
