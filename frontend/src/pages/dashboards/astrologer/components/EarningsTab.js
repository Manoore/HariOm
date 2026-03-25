import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function EarningsTab({ isDesktop }) {
  const [period, setPeriod] = useState('week');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/astrologer/earnings?period=${period}`);
      setReport(res.data);
    } catch (error) {
      toast.error('Failed to load earnings report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Earnings Report</h1>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">₹{report.summary.total_earnings}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-purple-600">{report.summary.total_calls}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Minutes</p>
              <p className="text-2xl font-bold text-blue-600">{report.summary.total_minutes}m</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Avg per Call</p>
              <p className="text-2xl font-bold text-orange-600">₹{Math.round(report.summary.avg_earning_per_call)}</p>
            </div>
          </div>

          {/* Chart Data */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Earnings Breakdown</h3>
            
            {report.chart_data.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No data for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.chart_data.map((item) => (
                  <div key={item.period} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-500">{item.period}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.earnings / (report.summary.total_earnings || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-semibold text-gray-800">₹{item.earnings}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.calls} calls)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
