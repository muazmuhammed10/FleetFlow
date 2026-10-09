import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-full p-6">
            <Car size={48} className="text-gray-300" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="text-sm text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => navigate('/dashboard')}>
          <Home size={16} /> Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
