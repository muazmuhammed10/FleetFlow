import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/Toast';
import { AuthCard } from '@/components/layout/AuthCard';

const schema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmNewPassword: z.string(),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: 'Passwords do not match', path: ['confirmNewPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword({ token, ...values });
      success('Password reset successfully');
      navigate('/login');
    } catch (err: any) {
      error('Reset failed', err?.response?.data?.message ?? 'Token may be expired');
    }
  };

  return (
    <AuthCard>
      {!token ? (
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm mt-2 block">Request a new one</Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Set new password</h2>
          <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">New password</label>
              <div className="relative mt-1">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  {...register('newPassword')} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">Min 8 chars with uppercase, lowercase, number & special character</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Confirm password</label>
              <input type="password" autoComplete="new-password"
                className={`mt-1 w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.confirmNewPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                {...register('confirmNewPassword')} />
              {errors.confirmNewPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmNewPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 mt-2">
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
