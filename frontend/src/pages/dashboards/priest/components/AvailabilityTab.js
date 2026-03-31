import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, Loader2, Plus, X, Check } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = DAYS.map(day => ({
  day,
  enabled: day !== 'Sunday',
  start: '09:00',
  end: '18:00',
}));

export default function AvailabilityTab() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [duration, setDuration] = useState(60);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAvailability(); }, []);

  const loadAvailability = async () => {
    try {
      const res = await api.get('/api/priest/availability');
      const data = res.data;
      if (data.weekly_schedule?.length) {
        setSchedule(DAYS.map(day => {
          const found = data.weekly_schedule.find(s => s.day === day);
          return found || { day, enabled: false, start: '09:00', end: '18:00' };
        }));
      } else if (data.online_slots?.length) {
        setSchedule(DAYS.map(day => {
          const found = data.online_slots.find(s => s.day === day);
          return found ? { ...found, enabled: true } : { day, enabled: false, start: '09:00', end: '18:00' };
        }));
      }
      setDuration(data.default_duration || 60);
      setBlockedDates(data.blocked_dates || []);
    } catch (err) {
      console.error('Failed to load availability', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/priest/availability', {
        weekly_schedule: schedule,
        blocked_dates: blockedDates,
        default_duration: duration,
      });
      toast.success('Availability saved!');
    } catch (err) {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex, field, value) => {
    setSchedule(prev => prev.map((s, i) => i === dayIndex ? { ...s, [field]: value } : s));
  };

  const addBlockedDate = () => {
    if (!newBlockDate) return;
    if (blockedDates.includes(newBlockDate)) {
      toast.error('Date already blocked');
      return;
    }
    setBlockedDates(prev => [...prev, newBlockDate].sort());
    setNewBlockDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg md:text-xl font-semibold text-maroon">Availability</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-saffron text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-saffron-dark transition-colors disabled:opacity-50"
          data-testid="save-availability"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {/* Slot Duration */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-saffron" />
          <h3 className="font-semibold text-gray-800">Slot Duration</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[30, 45, 60, 90, 120].map(mins => (
            <button
              key={mins}
              onClick={() => setDuration(mins)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                duration === mins
                  ? 'bg-saffron text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
              }`}
              data-testid={`duration-${mins}`}
            >
              {mins < 60 ? `${mins} min` : `${mins / 60} hr${mins > 60 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-saffron" />
          <h3 className="font-semibold text-gray-800">Weekly Schedule</h3>
        </div>
        <div className="space-y-3">
          {schedule.map((day, idx) => (
            <div
              key={day.day}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                day.enabled ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
              }`}
              data-testid={`day-${day.day.toLowerCase()}`}
            >
              <button
                onClick={() => updateDay(idx, 'enabled', !day.enabled)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  day.enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              <span className="w-24 text-sm font-medium text-gray-700">{day.day}</span>

              {day.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.start}
                    onChange={e => updateDay(idx, 'start', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-saffron outline-none"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={e => updateDay(idx, 'end', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-saffron outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Not available</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-2xl border border-orange-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <X className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-800">Blocked Dates</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">Block specific dates when you're unavailable (holidays, personal leave)</p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newBlockDate}
            onChange={e => setNewBlockDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-saffron outline-none flex-1"
            data-testid="block-date-input"
          />
          <button
            onClick={addBlockedDate}
            disabled={!newBlockDate}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center gap-1"
            data-testid="add-block-date"
          >
            <Plus className="w-4 h-4" /> Block
          </button>
        </div>

        {blockedDates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blockedDates.map(date => (
              <span key={date} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button
                  onClick={() => setBlockedDates(prev => prev.filter(d => d !== date))}
                  className="w-4 h-4 hover:bg-red-200 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No dates blocked</p>
        )}
      </div>
    </div>
  );
}
