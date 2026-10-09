import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Save } from 'lucide-react';
import { customersApi } from '@/api/customers';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import axios from 'axios';

const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmNewPassword: z.string(),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: 'Passwords do not match', path: ['confirmNewPassword'],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const { register: regP, handleSubmit: handleP, reset: resetP, formState: { errors: errP, isSubmitting: subP } } =
    useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { errors: errPw, isSubmitting: subPw } } =
    useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) resetP({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' });
  }, [user]);

  const onProfileSubmit = async (values: ProfileValues) => {
    try {
      await customersApi.updateMyProfile(values);
      await refreshUser();
      success('Profile updated');
    } catch (err) {
      if (axios.isAxiosError(err)) error('Update failed', err.response?.data?.message);
      else error('Update failed');
    }
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    try {
      await authApi.changePassword(values);
      success('Password changed', 'You may need to log in again on other devices.');
      resetPw();
    } catch (err) {
      if (axios.isAxiosError(err)) error('Password change failed', err.response?.data?.message);
      else error('Password change failed');
    }
  };

  const roleLabel: Record<string, string> = {
    ADMINISTRATOR: 'Administrator',
    FLEET_MANAGER: 'Fleet Manager',
    RENTAL_AGENT: 'Rental Agent',
    CUSTOMER: 'Customer',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account details</p>
      </div>

      {/* Account info */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                {user?.role ? roleLabel[user.role] : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={16} /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleP(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" required error={errP.firstName?.message} {...regP('firstName')} />
              <Input label="Last name" required error={errP.lastName?.message} {...regP('lastName')} />
            </div>
            <Input label="Phone" error={errP.phone?.message} {...regP('phone')} />
            <div className="pt-1">
              <Button type="submit" loading={subP} size="sm">
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock size={16} /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePw(onPasswordSubmit)} className="space-y-4">
            <Input label="Current password" type="password" required error={errPw.currentPassword?.message} {...regPw('currentPassword')} />
            <Input label="New password" type="password" required
              hint="Min 8 chars with uppercase, lowercase, number & special character"
              error={errPw.newPassword?.message} {...regPw('newPassword')} />
            <Input label="Confirm new password" type="password" required error={errPw.confirmNewPassword?.message} {...regPw('confirmNewPassword')} />
            <div className="pt-1">
              <Button type="submit" loading={subPw} size="sm" variant="secondary">
                <Lock size={14} /> Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
