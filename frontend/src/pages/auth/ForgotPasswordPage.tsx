import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/Toast';
import { AuthCard } from '@/components/layout/AuthCard';
import { CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { error } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch { error('Failed to send reset email'); }
    finally { setLoading(false); }
  };

  return (
    <AuthCard>
      {sent ? (
        <div className="text-center space-y-4 py-2">
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle size={32} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-500">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox and spam folder.
          </p>
          <Link to="/login" className="block text-sm text-blue-600 hover:underline font-medium">Back to sign in</Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send a reset link</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
