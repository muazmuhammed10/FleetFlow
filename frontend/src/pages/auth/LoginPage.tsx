import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error('Sign in failed', err.response?.data?.message ?? 'Invalid email or password');
      } else {
        error('Sign in failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ───────────── LEFT — full-bleed photo ───────────── */}
      <div className="hidden lg:block lg:w-[58%] relative overflow-hidden">
        {/* Photo */}
        <img
          src="/images/hero-car.jpg"
          alt="Luxury car fleet"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Floating content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                <rect x="9" y="11" width="14" height="10" rx="2" />
                <circle cx="12" cy="19" r="1" />
                <circle cx="20" cy="19" r="1" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">FleetFlow</span>
          </div>

          {/* Big headline */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Drive your<br />
              <span className="text-blue-400">fleet forward.</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-sm leading-relaxed">
              Complete vehicle rental and fleet management — bookings, inspections, payments and more.
            </p>

            {/* Trust badges */}
            <div className="flex gap-4 pt-2">
              {['500+ Vehicles', 'Real-time Tracking', 'Secure Platform'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-white/90 text-xs font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} FleetFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* ───────────── RIGHT — sign-in form ───────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-blue-600 rounded-xl p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                <rect x="9" y="11" width="14" height="10" rx="2" />
                <circle cx="12" cy="19" r="1" /><circle cx="20" cy="19" r="1" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-xl">FleetFlow</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Sign in</h2>
            <p className="text-gray-400 mt-1.5 text-sm">Welcome back — enter your credentials to continue.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none
                  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                  ${errors.email
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-xl text-sm border transition-all outline-none
                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.password
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                    }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99]
                text-white text-sm font-bold rounded-xl transition-all duration-150
                shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-400 mt-7">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
          <p className="text-center mt-3">
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
