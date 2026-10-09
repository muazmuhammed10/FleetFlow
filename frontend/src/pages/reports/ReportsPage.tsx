import React, { useState } from 'react';
import { Download, BarChart2, FileText } from 'lucide-react';
import api from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ReportsPage() {
  const { success, error } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadCSV = async (type: 'bookings' | 'payments') => {
    setDownloading(type);
    try {
      const response = await api.get(`/reports/export/${type}`, {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      success(`${type} CSV downloaded`);
    } catch {
      error('Export failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Download data exports for analysis</p>
      </div>

      {/* Date filters */}
      <Card>
        <CardHeader><CardTitle>Date Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Export options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-brand-50 rounded-xl p-4">
                <FileText size={28} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bookings Export</h3>
                <p className="text-sm text-gray-500 mt-0.5">All booking records with customer and vehicle details</p>
              </div>
              <Button
                variant="outline"
                loading={downloading === 'bookings'}
                onClick={() => downloadCSV('bookings')}
                className="w-full"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-green-50 rounded-xl p-4">
                <BarChart2 size={28} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payments Export</h3>
                <p className="text-sm text-gray-500 mt-0.5">Payment transactions — all marked as simulated</p>
              </div>
              <Button
                variant="outline"
                loading={downloading === 'payments'}
                onClick={() => downloadCSV('payments')}
                className="w-full"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        ⚠️ All payment data is simulated. CSV exports include a "SIMULATED" indicator column.
        CSV formula injection protection is applied to all exported fields.
      </div>
    </div>
  );
}
