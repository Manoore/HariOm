import React, { useState, useEffect } from 'react';
import { Phone, Clock, User, Loader2, IndianRupee } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function CallsTab({ isDesktop }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const res = await api.get('/api/astrologer/calls');
      setCalls(res.data.calls || []);
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Call History</h1>

      {calls.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No calls yet</h3>
          <p className="text-gray-400">Your consultation history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <div 
              key={call.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  {call.other_party?.profile_photo ? (
                    <img src={call.other_party.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{call.other_party?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500">{formatDate(call.started_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+₹{call.astrologer_earning || 0}</p>
                  <p className="text-sm text-gray-500">{formatDuration(call.duration_seconds)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{Math.ceil(call.duration_seconds / 60)} min</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <IndianRupee className="w-4 h-4" />
                  <span>₹{call.rate_per_minute}/min</span>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  call.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {call.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
