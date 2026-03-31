import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';

export default function SlotPicker({ priestId, onSelectSlot, selectedDate, selectedSlot }) {
  const [date, setDate] = useState(selectedDate || '');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSlot, setActiveSlot] = useState(selectedSlot || null);

  // Generate next 14 days for quick date selection
  const dateOptions = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push({
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateNum: d.getDate(),
    });
  }

  useEffect(() => {
    if (date && priestId) fetchSlots(date);
  }, [date, priestId]);

  const fetchSlots = async (selectedDate) => {
    setLoading(true);
    setSlots([]);
    setMessage('');
    setActiveSlot(null);
    try {
      const res = await api.get(`/api/priests/${priestId}/available-slots?date=${selectedDate}`);
      setSlots(res.data.slots || []);
      setMessage(res.data.message || '');
      if (res.data.slots?.length === 0 && !res.data.message) {
        setMessage('No slots available on this date');
      }
    } catch (err) {
      setMessage('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setActiveSlot(slot.start);
    // Build the full datetime from date + slot start time
    const [h, m] = slot.start.split(':');
    const dt = new Date(date + 'T00:00:00');
    dt.setHours(parseInt(h), parseInt(m), 0, 0);
    onSelectSlot({
      date,
      slot_start: slot.start,
      slot_end: slot.end,
      datetime: dt.toISOString(),
    });
  };

  return (
    <div className="space-y-4" data-testid="slot-picker">
      {/* Date Selection - Horizontal Scroll */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-saffron" /> Select Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDate(opt.value)}
              className={`flex-shrink-0 w-16 py-2 rounded-xl text-center transition-all ${
                date === opt.value
                  ? 'bg-saffron text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-orange-50 border border-gray-100'
              }`}
              data-testid={`date-${opt.value}`}
            >
              <div className="text-[10px] font-medium uppercase">{opt.day}</div>
              <div className="text-lg font-bold">{opt.dateNum}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-saffron" /> Available Slots
          </label>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-saffron" />
              <span className="ml-2 text-sm text-gray-500">Checking availability...</span>
            </div>
          ) : message && slots.length === 0 ? (
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-sm text-orange-700">{message}</p>
              <p className="text-xs text-gray-500 mt-1">Try selecting a different date</p>
            </div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.start}
                  onClick={() => handleSlotSelect(slot)}
                  className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                    activeSlot === slot.start
                      ? 'bg-saffron text-white shadow-md ring-2 ring-saffron/30'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-saffron hover:bg-orange-50'
                  }`}
                  data-testid={`slot-${slot.start}`}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
