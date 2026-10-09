import React from 'react';
import { Car } from 'lucide-react';

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 rounded-2xl p-3 mb-4 shadow-lg shadow-blue-600/30">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FleetFlow</h1>
          <p className="text-gray-400 text-sm mt-1">Secure Vehicle Rental & Fleet Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );
}
