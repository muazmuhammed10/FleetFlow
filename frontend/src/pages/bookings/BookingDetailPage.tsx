import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Ban, Car,
  CreditCard, Clock, AlertTriangle, FileText,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings';
import { paymentsApi } from '@/api/payments';
import { Booking, Payment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format';
import axios from 'axios';

// Status step tracker
const BOOKING_STEPS = [
  { key: 'PENDING',   label: 'Submitted' },
  { key: 'APPROVED',  label: 'Approved' },
  { key: 'CONFIRMED', label: 'Payment Done' },
  { key: 'ACTIVE',    label: 'On Rental' },
  { key: 'COMPLETED', label: 'Completed' },
];

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    PENDING: 0, APPROVED: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4,
    CANCELLED: -1, REJECTED: -1, OVERDUE: 3,
  };
  return map[status] ?? 0;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isStaff = user && ['ADMINISTRATOR', 'FLEET_MANAGER', 'RENTAL_AGENT'].includes(user.role);
  const isCustomer = user?.role === 'CUSTOMER';

  const fetchData = async () => {
    if (!id) return;
    try {
      const [bookingRes, paymentsRes] = await Promise.all([
        bookingsApi.get(id),
        paymentsApi.listForBooking(id).catch(() => ({ data: { data: [] } })),
      ]);
      setBooking(bookingRes.data.data);
      setPayments(paymentsRes.data.data);
    } catch {
      error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: 'APPROVED' | 'REJECTED' | 'CANCELLED', reason?: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await bookingsApi.updateStatus(id, action, reason);
      success(`Booking ${action.toLowerCase()} successfully`);
      fetchData();
    } catch (err) {
      if (axios.isAxiosError(err)) error('Action failed', err.response?.data?.message);
      else error('Action failed');
    } finally {
      setActionLoading(false);
      setShowCancel(false);
      setShowApprove(false);
      setShowReject(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!booking) {
    return (
      <div className="text-center py-20">
        <Car size={48} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-500 font-medium">Booking not found</p>
        <button onClick={() => navigate('/bookings')} className="mt-4 text-blue-600 text-sm hover:underline">
          Back to bookings
        </button>
      </div>
    );
  }

  const v = booking.vehicle as any;
  const cp = booking.customerProfile as any;
  const stepIndex = getStepIndex(booking.status);
  const isCancelled = ['CANCELLED', 'REJECTED'].includes(booking.status);

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const isPaid = totalPaid >= Number(booking.totalAmount);

  // Customer can pay if booking is APPROVED and not yet paid
  const canPay = isCustomer && booking.status === 'APPROVED' && !isPaid;

  return (
    <div className="max-w-5xl space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} /> All Bookings
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Staff actions */}
          {isStaff && booking.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => setShowApprove(true)}>
                <CheckCircle size={14} /> Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setShowReject(true)}>
                <XCircle size={14} /> Reject
              </Button>
            </>
          )}
          {isStaff && booking.status === 'CONFIRMED' && (
            <Button size="sm" variant="secondary"
              onClick={() => navigate(`/inspections/pickup?bookingId=${booking.id}`)}>
              Record Pickup
            </Button>
          )}
          {isStaff && booking.status === 'ACTIVE' && (
            <Button size="sm" variant="secondary"
              onClick={() => navigate(`/inspections/return?bookingId=${booking.id}`)}>
              Record Return
            </Button>
          )}
          {/* Cancel — staff or customer */}
          {['PENDING', 'APPROVED'].includes(booking.status) && (
            <Button size="sm" variant="outline" onClick={() => setShowCancel(true)}>
              <Ban size={14} /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Reference + status */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking <span className="font-mono text-blue-600">{booking.bookingReference}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Created {formatDateTime(booking.createdAt)}</p>
        </div>
        <Badge status={booking.status} className="text-sm px-3 py-1.5 flex-shrink-0" />
      </div>

      {/* ── Progress tracker (not for cancelled/rejected) ── */}
      {!isCancelled && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center">
            {BOOKING_STEPS.map((step, i) => {
              const done = stepIndex > i;
              const active = stepIndex === i;
              const isLast = i === BOOKING_STEPS.length - 1;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                      ${done ? 'bg-blue-600 border-blue-600 text-white'
                        : active ? 'bg-white border-blue-500 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-400'}`}>
                      {done ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
                    </div>
                    <p className={`text-xs mt-1.5 font-medium text-center max-w-[70px] leading-tight
                      ${done || active ? 'text-gray-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PAY NOW banner — most important for approved bookings ── */}
      {canPay && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg shadow-blue-600/25">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-2.5">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base">Payment Required</p>
              <p className="text-blue-200 text-sm">
                Your booking is approved! Pay now to confirm your reservation.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/bookings/${booking.id}/pay`)}
            className="flex-shrink-0 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl
              hover:bg-blue-50 transition-colors shadow-md text-sm"
          >
            Pay {formatCurrency(booking.totalAmount)} →
          </button>
        </div>
      )}

      {/* Already paid badge */}
      {isPaid && !['CANCELLED', 'REJECTED', 'PENDING'].includes(booking.status) && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Payment Complete</p>
            <p className="text-sm text-green-600">
              {formatCurrency(totalPaid)} paid — booking confirmed
            </p>
          </div>
        </div>
      )}

      {/* Cancellation reason */}
      {isCancelled && (booking.rejectionReason || booking.cancellationReason) && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{booking.status === 'REJECTED' ? 'Rejection Reason' : 'Cancellation Reason'}</p>
            <p className="text-sm text-red-600">{booking.rejectionReason ?? booking.cancellationReason}</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Vehicle card */}
          <Card>
            <CardHeader><CardTitle>Vehicle</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-20 w-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {(v?.images as any[])?.[0]?.url ? (
                    <img src={(v.images as any[])[0].url} alt={v?.make}
                      className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center"><Car size={24} className="text-gray-300" /></div>}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{v?.year} {v?.make} {v?.model}</p>
                  <p className="text-sm text-gray-500">{v?.category?.name} · {v?.registrationNumber}</p>
                  <p className="text-sm text-gray-500">{v?.transmission} · {v?.fuelType?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Schedule */}
          <Card>
            <CardHeader><CardTitle>Rental Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Pickup Date', value: formatDateTime(booking.pickupDate), highlight: false },
                  { label: 'Return Date', value: formatDateTime(booking.returnDate), highlight: false },
                  { label: 'Duration', value: `${booking.rentalDays} day${booking.rentalDays !== 1 ? 's' : ''}`, highlight: false },
                  { label: 'Pickup Location', value: booking.pickupLocation ?? '—', highlight: false },
                  ...(booking.actualPickupDate ? [{ label: 'Actual Pickup', value: formatDateTime(booking.actualPickupDate), highlight: true }] : []),
                  ...(booking.actualReturnDate ? [{ label: 'Actual Return', value: formatDateTime(booking.actualReturnDate), highlight: true }] : []),
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className={`font-medium ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
              {booking.specialRequests && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                  <p className="font-medium mb-0.5">Special Requests</p>
                  <p>{booking.specialRequests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard size={15} className="text-blue-500" /> Payments
                  </CardTitle>
                  <button onClick={() => navigate('/payments')}
                    className="text-xs text-blue-600 hover:underline">View all</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                    <div>
                      <p className="font-mono text-xs text-gray-500">{p.paymentReference}</p>
                      <p className="text-gray-700 mt-0.5">
                        {p.paymentMethod.replace(/_/g, ' ')}
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">SIMULATED</span>
                      </p>
                      {p.paidAt && <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(p.paidAt)}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                      <Badge status={p.status} />
                    </div>
                  </div>
                ))}
                {isPaid && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm font-bold">
                    <span className="text-gray-700">Total Paid</span>
                    <span className="text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Customer info — staff only */}
          {isStaff && (
            <Card>
              <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="font-semibold text-gray-900">{cp?.user?.firstName} {cp?.user?.lastName}</p>
                <p className="text-gray-500">{cp?.user?.email}</p>
                {cp?.user?.phone && <p className="text-gray-500">{cp.user.phone}</p>}
                <div className="pt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cp?.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cp?.isVerified ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {[
                ['Daily Rate', formatCurrency(booking.dailyRate)],
                ['Days', `${booking.rentalDays}`],
                ['Subtotal', formatCurrency(booking.subtotal)],
                ['Tax', formatCurrency(booking.taxAmount)],
                ['Security Deposit', formatCurrency(booking.securityDeposit)],
                ...(Number(booking.discountAmount) > 0 ? [['Discount', `-${formatCurrency(booking.discountAmount)}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-900">{v}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <p className="text-xs text-gray-400">Security deposit refunded on return in good condition.</p>
            </CardContent>
          </Card>

          {/* Pay now button in sidebar too */}
          {canPay && (
            <button
              onClick={() => navigate(`/bookings/${booking.id}/pay`)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl
                shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> Pay Now
            </button>
          )}

          {/* View contract */}
          {['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status) && (
            <button
              onClick={() => navigate('/contracts')}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl
                transition-colors flex items-center justify-center gap-2 text-sm border border-gray-200"
            >
              <FileText size={15} /> View Contract
            </button>
          )}
        </div>
      </div>

      {/* Approve dialog */}
      <ConfirmDialog open={showApprove} onClose={() => setShowApprove(false)}
        onConfirm={() => handleAction('APPROVED')} loading={actionLoading}
        title="Approve Booking" variant="primary"
        message={`Approve booking ${booking.bookingReference}? The customer will be notified and can proceed with payment.`}
        confirmLabel="Approve" />

      {/* Cancel dialog */}
      <ConfirmDialog open={showCancel} onClose={() => setShowCancel(false)}
        onConfirm={() => handleAction('CANCELLED')} loading={actionLoading}
        title="Cancel Booking"
        message={`Cancel booking ${booking.bookingReference}? This cannot be undone.`}
        confirmLabel="Cancel Booking" />

      {/* Reject with reason */}
      <Modal open={showReject} onClose={() => setShowReject(false)} title="Reject Booking" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejection (optional — customer will see this):</p>
          <textarea
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            rows={3} placeholder="e.g. Vehicle not available for these dates"
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowReject(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" loading={actionLoading}
              onClick={() => handleAction('REJECTED', rejectReason)} className="flex-1">
              Reject Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
