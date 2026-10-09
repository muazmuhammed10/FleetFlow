import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreditCard, Banknote, Building2, Shield, AlertTriangle,
  CheckCircle, ArrowLeft, Lock, Car, Calendar, Clock,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings';
import { paymentsApi } from '@/api/payments';
import { Booking } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import axios from 'axios';

const schema = z.object({
  paymentMethod: z.enum(['SIMULATED_CARD', 'SIMULATED_CASH', 'SIMULATED_BANK_TRANSFER']),
  cardHolderName: z.string().max(100).optional(),
  cardLastFour: z.string().length(4).regex(/^\d{4}$/, 'Enter last 4 digits').optional(),
  collateralType: z.enum(['NONE', 'ID_DOCUMENT', 'CREDIT_CARD_HOLD', 'CASH_DEPOSIT']),
  collateralReference: z.string().max(100).optional(),
  collateralNotes: z.string().max(500).optional(),
  agreeToTerms: z.boolean().refine((v) => v === true, 'You must agree to the terms'),
});
type FormValues = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: 'SIMULATED_CARD', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
  { value: 'SIMULATED_CASH', label: 'Cash at Counter', icon: Banknote, desc: 'Pay on pickup' },
  { value: 'SIMULATED_BANK_TRANSFER', label: 'Bank Transfer', icon: Building2, desc: '1-2 business days' },
];

const COLLATERAL_OPTIONS = [
  { value: 'NONE', label: 'None required', desc: 'No security hold needed' },
  { value: 'CREDIT_CARD_HOLD', label: 'Credit Card Hold', desc: 'Temporary hold on your card' },
  { value: 'ID_DOCUMENT', label: 'ID Document Copy', desc: 'We keep a copy of your ID' },
  { value: 'CASH_DEPOSIT', label: 'Cash Deposit', desc: 'Refundable cash held at counter' },
];

export default function BookingPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'SIMULATED_CARD',
      collateralType: 'CREDIT_CARD_HOLD',
      agreeToTerms: false,
    },
  });

  const selectedMethod = watch('paymentMethod');
  const selectedCollateral = watch('collateralType');

  useEffect(() => {
    if (!id) return;
    bookingsApi.get(id)
      .then(({ data }) => {
        setBooking(data.data);
        if (!['APPROVED'].includes(data.data.status)) {
          // If already confirmed/active just show booking detail
          if (['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(data.data.status)) {
            navigate(`/bookings/${id}`, { replace: true });
          }
        }
      })
      .catch(() => error('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    if (!booking) return;
    try {
      await paymentsApi.initiatePayment({
        bookingId: booking.id,
        paymentMethod: values.paymentMethod,
        cardHolderName: values.cardHolderName,
        cardLastFour: values.cardLastFour,
        collateralType: values.collateralType,
        collateralReference: values.collateralReference,
        collateralNotes: values.collateralNotes,
      });
      setPaid(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error('Payment failed', err.response?.data?.message ?? 'Please try again');
      } else {
        error('Payment failed');
      }
    }
  };

  if (loading) return <PageSpinner />;

  if (paid) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle size={48} className="text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h2>
          <p className="text-gray-500 mt-2">
            Your booking <span className="font-mono font-bold text-blue-600">{booking?.bookingReference}</span> is now confirmed.
          </p>
          <p className="text-sm text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 inline-block">
            ⚠ This is a simulated payment — no real money was charged.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(`/bookings/${booking?.id}`)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            View Booking
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            All Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return <div className="text-center py-16 text-gray-500">Booking not found</div>;

  if (booking.status !== 'APPROVED') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertTriangle size={48} className="text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Payment Not Available</h2>
        <p className="text-gray-500">
          {booking.status === 'PENDING'
            ? 'Your booking is still awaiting approval. You can pay once an agent approves it.'
            : `This booking is in ${booking.status} status and cannot be paid now.`}
        </p>
        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
        >
          Back to Booking
        </button>
      </div>
    );
  }

  const v = booking.vehicle as any;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/bookings/${booking.id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Booking {booking.bookingReference}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-5">

          {/* Simulated notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold">Simulated Payment System</p>
              <p className="mt-0.5 text-amber-600">This is a demo environment. No real money will be charged. All transactions are simulated.</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" /> Payment Method
            </h3>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const selected = selectedMethod === m.value;
                return (
                  <label key={m.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" value={m.value} {...register('paymentMethod')} className="sr-only" />
                    <div className={`p-2.5 rounded-xl ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon size={18} className={selected ? 'text-blue-600' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center
                      ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Card details — only for card */}
            {selectedMethod === 'SIMULATED_CARD' && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Card Details (Simulated)</p>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cardholder Name</label>
                  <input placeholder="Name on card"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    {...register('cardHolderName')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Card Number</label>
                  <div className="mt-1 flex gap-2 items-center">
                    <input value="**** **** ****" disabled
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-100 text-sm text-gray-400 font-mono cursor-not-allowed" />
                    <input placeholder="1234" maxLength={4}
                      className={`w-20 px-3 py-2.5 rounded-xl border text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.cardLastFour ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                      {...register('cardLastFour')} />
                  </div>
                  {errors.cardLastFour && <p className="text-xs text-red-500 mt-1">{errors.cardLastFour.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">Enter last 4 digits only — we never store full card numbers</p>
                </div>
              </div>
            )}
          </div>

          {/* Security / Collateral */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Shield size={16} className="text-purple-500" /> Security Deposit
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              A security hold protects the vehicle. It is fully released when you return the car in good condition.
            </p>
            <div className="space-y-2.5">
              {COLLATERAL_OPTIONS.map((opt) => {
                const selected = selectedCollateral === opt.value;
                return (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                      ${selected ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" value={opt.value} {...register('collateralType')} className="sr-only" />
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${selected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                      {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selected ? 'text-purple-900' : 'text-gray-900'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {selectedCollateral !== 'NONE' && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Reference / ID Number</label>
                  <input placeholder="e.g. Passport: AB123456"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    {...register('collateralReference')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea rows={2} placeholder="Any additional information..."
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                    {...register('collateralNotes')} />
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...register('agreeToTerms')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-600 leading-relaxed">
              I agree to the <span className="text-blue-600 font-medium">rental terms and conditions</span>. I understand this is a simulated payment and no real money will be charged. I accept responsibility for the vehicle during the rental period.
            </span>
          </label>
          {errors.agreeToTerms && <p className="text-xs text-red-500 -mt-3">{errors.agreeToTerms.message}</p>}

          {/* Submit */}
          <button type="submit" disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl
              shadow-xl shadow-blue-600/25 transition-all disabled:opacity-60
              flex items-center justify-center gap-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {isSubmitting ? (
              <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>Processing…</>
            ) : (
              <><Lock size={18} /> Pay {formatCurrency(booking.totalAmount)} (Simulated)</>
            )}
          </button>
        </form>

        {/* ── Right: Order summary ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

            {/* Vehicle */}
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
              <div className="h-14 w-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {(v?.images as any[])?.[0]?.url ? (
                  <img src={(v.images as any[])[0].url} alt={v?.make} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{v?.year} {v?.make} {v?.model}</p>
                <p className="text-xs text-gray-400">{v?.registrationNumber}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>Pickup: <strong>{formatDate(booking.pickupDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>Return: <strong>{formatDate(booking.returnDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={14} className="text-gray-400" />
                <span>{booking.rentalDays} day{booking.rentalDays !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>{formatCurrency(booking.dailyRate)} × {booking.rentalDays} days</span>
                <span>{formatCurrency(booking.subtotal)}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax ({(Number(booking.taxRate) * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(booking.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>{formatCurrency(booking.securityDeposit)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-100 pt-3 mt-1">
                <span>Total Due</span>
                <span className="text-blue-600">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <p className="text-xs text-gray-400">Security deposit is refunded on return in good condition.</p>
            </div>

            {/* Security note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              <Lock size={12} />
              <span>Secured & encrypted. No real card data stored.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
