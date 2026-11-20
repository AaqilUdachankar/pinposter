import React, { useState, useEffect } from 'react';
import { queueApi } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import PinHandoffModal from '../components/common/PinHandoffModal';
import PinEditModal from '../components/common/PinEditModal';
import EmptyState from '../components/common/EmptyState';
import {
  CalendarCheck,
  Clock,
  Bookmark,
  Share2,
  Edit3,
  ExternalLink,
} from 'lucide-react';

export default function ScheduledPins() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePinForHandoff, setActivePinForHandoff] = useState(null);
  const [activePinForEdit, setActivePinForEdit] = useState(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await queueApi.getScheduleSlots();
      if (res.data.success) {
        setSlots(res.data.slots || []);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scheduled Pins</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Chronological slot reservation timeline ensuring non-overlapping hourly distribution
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading schedule...</div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No scheduled slots reserved"
          description="Create a campaign to automatically reserve 10 hourly scheduling slots in the global queue."
          actionText="Create Campaign"
          actionLink="/create"
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden p-6 space-y-4">
          <div className="space-y-3">
            {slots.map((slot) => {
              const pin = slot.pinId;
              if (!pin) return null;

              return (
                <div
                  key={slot._id}
                  className="p-4 rounded-2xl border border-slate-200/70 hover:border-rose-300 hover:shadow-soft transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={pin.imageUrl}
                      alt={pin.title}
                      className="w-12 h-16 object-cover rounded-xl bg-white border border-slate-200 shrink-0"
                    />

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-xs text-rose-600">
                          #{pin.conceptIndex} {pin.conceptName}
                        </span>
                        <StatusBadge status={slot.status} />
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 max-w-lg">
                        {pin.title}
                      </h4>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Bookmark className="w-3 h-3 text-slate-400" />
                          <span>{pin.boardId?.name || 'Board'}</span>
                        </span>
                        <span>Product: {pin.productId?.title?.slice(0, 30)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slot Time & Action */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reserved Hour</span>
                      <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>
                          {new Date(slot.slotTime).toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActivePinForHandoff(pin)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => setActivePinForEdit(pin)}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition"
                        title="Edit Pin"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <PinHandoffModal
        pin={activePinForHandoff}
        isOpen={Boolean(activePinForHandoff)}
        onClose={() => setActivePinForHandoff(null)}
        onUpdated={fetchSlots}
      />

      <PinEditModal
        pin={activePinForEdit}
        isOpen={Boolean(activePinForEdit)}
        onClose={() => setActivePinForEdit(null)}
        onUpdated={fetchSlots}
      />

    </div>
  );
}
