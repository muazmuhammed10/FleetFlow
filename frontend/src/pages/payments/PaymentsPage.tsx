import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { paymentsApi } from '@/api/payments';
import { Payment } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDateTime, formatCurrency } from '@/utils/format';

export default function PaymentsPage() {
  const { error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.getHistory({ page, limit: 20 });
      setPayments(data.data.data);
      setPagination(data.data.pagination);
    } catch { error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Transaction history — all payments are simulated</p>
      </div>

      {loading ? <PageSpinner /> : payments.length === 0 ? (
        <EmptyState title="No payments found" icon={<CreditCard size={48} />} />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Reference</Th>
                <Th>Booking</Th>
                <Th>Vehicle</Th>
                <Th>Method</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Type</Th>
                <Th>Date</Th>
              </tr>
            </Thead>
            <Tbody>
              {payments.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.paymentReference}</Td>
                  <Td className="font-mono text-xs text-brand-600">{(p as any).booking?.bookingReference}</Td>
                  <Td className="text-xs">{(p as any).booking?.vehicle?.make} {(p as any).booking?.vehicle?.model}</Td>
                  <Td className="text-xs">{p.paymentMethod.replace(/_/g, ' ')}</Td>
                  <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
                  <Td><Badge status={p.status} /></Td>
                  <Td><span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">SIMULATED</span></Td>
                  <Td className="text-xs text-gray-500">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</Td>
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
