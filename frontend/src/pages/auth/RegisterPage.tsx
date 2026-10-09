import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Car } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase letter')
    .regex(/[a-z]/, 'Must include lowercase letter')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      success('Account created!', 'Please sign in to continue.');
      navigate('/login');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error('Registration failed', err.response?.data?.message ?? 'Please try again');
      } else {
        error('Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left photo panel */}
      <div className="hidden lg:block lg:w-[45%] relative overflow-hidden">
        <img src="/images/car-suv.jpg" alt="Fleet" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-2.5">
              <Car size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">FleetFlow</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Join thousands of<br />
              <span className="text-blue-400">happy renters.</span>
            </h2>
            <p className="text-gray-300 text-base max-w-xs">
              Create your account and get access to our full fleet of vehicles — from economy to luxury.
            </p>
          </div>
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} FleetFlow</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-blue-600 rounded-xl p-2"><Car size={20} className="text-white" /></div>
            <span className="font-bold text-gray-900 text-xl">FleetFlow</span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h2>
            <p className="text-gray-400 mt-1.5 text-sm">Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.firstName?.message}>
                <input autoComplete="given-name" placeholder="Jane"
                  className={inputCls(!!errors.firstName)} {...register('firstName')} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input autoComplete="family-name" placeholder="Smith"
                  className={inputCls(!!errors.lastName)} {...register('lastName')} />
              </Field>
            </div>

            <Field label="Email address" error={errors.email?.message}>
              <input type="email" autoComplete="email" placeholder="you@example.com"
                className={inputCls(!!errors.email)} {...register('email')} />
            </Field>

            <Field label="Phone (optional)">
              <input type="tel" placeholder="+1 555 000 0000"
                className={inputCls(false)} {...register('phone')} />
            </Field>

            <Field label="Password" error={errors.password?.message}
              hint="8+ chars · uppercase · lowercase · number · special">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="••••••••" className={inputCls(!!errors.password) + ' pr-11'}
                  {...register('password')} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password" error={errors.confirmPassword?.message}>
              <input type="password" autoComplete="new-password" placeholder="••••••••"
                className={inputCls(!!errors.confirmPassword)} {...register('confirmPassword')} />
            </Field>

            <button type="submit" disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60
                flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              {isSubmitting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Creating account…</>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>

          <p className="text-center mt-4">
            <button onClick={() => navigate('/')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none
    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    ${hasError ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`;
}

function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
