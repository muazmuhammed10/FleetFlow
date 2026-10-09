import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { customersApi } from '@/api/customers';
import { CustomerProfile } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate, formatCurrency } from '@/utils/format';
import axios from 'axios';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    customersApi.get(id)
      .then(({ data }) => setCustomer(data.data))
      .catch(() => error('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      await customersApi.verify(id);
      success('Customer verified');
      setCustomer(prev => prev ? { ...prev, isVerified: true } : prev);
    } catch (err) {
      if (axios.isAxiosError(err)) error('Verification failed', err.response?.data?.message);
      else error('Verification failed');
    } finally { setVerifying(false); }
  };

  if (loading) return <PageSpinner />;
  if (!customer) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Customer not found</p>
      <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 text-sm hover:underline">Back to customers</button>
    </div>
  );

  const u = customer.user as any;
  const bookings = (customer as any).bookings ?? [];

  const licenceExpiry = customer.licenceExpiryDate ? new Date(customer.licenceExpiryDate) : null;
  const licenceExpired = licenceExpiry && licenceExpiry < new Date();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} /> All Customers
        </button>
        {!customer.isVerified && (
          <Button size="sm" onClick={handleVerify} loading={verifying}>
            <UserCheck size={14} /> Verify Customer
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {u?.firstName?.[0]}{u?.lastName?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{u?.firstName} {u?.lastName}</h1>
          <p className="text-sm text-gray-500">{u?.email}</p>
          {u?.phone && <p className="text-sm text-gray-500">{u.phone}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge status={u?.status ?? 'ACTIVE'} />
            {customer.isVerified
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
              : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unverified</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile details */}
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Date of Birth', value: customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—' },
                  { label: 'Address', value: [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '—' },
                  { label: 'Postal Code', value: customer.postalCode ?? '—' },
                  { label: 'Member Since', value: formatDate(customer.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Licence info */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">
              Driving Licence
              {licenceExpired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Licence Number', value: customer.drivingLicenceNumber ?? '—' },
                  { label: 'Issuing Country', value: customer.licenceCountry ?? '—' },
                  { label: 'Expiry Date', value: licenceExpiry ? formatDate(licenceExpiry.toISOString()) : '—' },
                  { label: 'Verified', value: customer.isVerified ? `Yes — ${customer.verifiedAt ? formatDate(customer.verifiedAt) : ''}` : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className={`rounded-xl p-3 ${label === 'Expiry Date' && licenceExpired ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className={`font-medium ${label === 'Expiry Date' && licenceExpired ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
              {!customer.drivingLicenceNumber && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
                  <AlertTriangle size={14} />
                  Customer has not provided licence information.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking history */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-500" /> Booking History
                </CardTitle>
                <span className="text-xs text-gray-400">{bookings.length} bookings</span>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No bookings yet</p>
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Reference</Th>
                      <Th>Vehicle</Th>
                      <Th>Pickup</Th>
                      <Th>Status</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {bookings.map((b: any) => (
                      <Tr key={b.id} onClick={() => navigate(`/bookings/${b.id}`)}>
                        <Td className="font-mono text-xs text-blue-600">{b.bookingReference}</Td>
                        <Td className="text-sm">{b.vehicle?.make} {b.vehicle?.model}</Td>
                        <Td className="text-xs text-gray-500">{formatDate(b.pickupDate)}</Td>
                        <Td><Badge status={b.status} /></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              {[
                { label: 'Total Bookings', value: bookings.length, icon: <Calendar size={16} className="text-blue-500" /> },
                { label: 'Active Rentals', value: bookings.filter((b: any) => b.status === 'ACTIVE').length, icon: <CreditCard size={16} className="text-green-500" /> },
                { label: 'Completed', value: bookings.filter((b: any) => b.status === 'COMPLETED').length, icon: <UserCheck size={16} className="text-gray-500" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {icon} {label}
                  </div>
                  <span className="font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
