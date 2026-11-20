import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { queueApi, boardsApi, campaignsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import PinCard from '../components/pins/PinCard';
import PinHandoffModal from '../components/common/PinHandoffModal';
import PinEditModal from '../components/common/PinEditModal';
import EmptyState from '../components/common/EmptyState';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Bookmark,
  Share2,
  RefreshCw,
  Sparkles,
  Rss,
  ArrowRight,
} from 'lucide-react';

export default function PublishingQueue() {
  const toast = useToast();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePinForHandoff, setActivePinForHandoff] = useState(null);
  const [activePinForEdit, setActivePinForEdit] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await queueApi.getQueue();
      if (res.data.success) {
        setQueueData(res.data);
      }
    } catch (err) {
      console.error('Failed to load publishing queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Auto refresh queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceCheck = async () => {
    try {
      await queueApi.triggerCheck();
      toast.info('Refreshed schedule queue');
      fetchQueue();
    } catch {
      toast.error('Failed to trigger queue advance check');
    }
  };

  const pins = queueData?.pins || [];
  const readyPins = pins.filter((p) => p.status === 'ready_to_publish');
  const scheduledPins = pins.filter((p) => p.status === 'scheduled');
  const overduePins = pins.filter((p) => p.status === 'overdue');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Publishing Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Global chronological timeline of hourly scheduled Pins awaiting manual handoff
          </p>
        </div>

        <button
          onClick={handleAdvanceCheck}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-2 shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Next Available Slot Indicator Card */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
        <div className="space-y-1">
          <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Queue Status</span>
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Next Open Scheduling Slot: {' '}
            <span className="text-rose-300">
              {queueData?.nextAvailableSlot
                ? new Date(queueData.nextAvailableSlot).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Now'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Submitting a new product campaign will automatically reserve 10 consecutive hourly slots starting from this time.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-center px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-rose-400 font-bold text-lg block">{readyPins.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Ready to Pin</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700">
            <span className="text-blue-400 font-bold text-lg block">{scheduledPins.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Auto-Publish RSS Callout Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Rss className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block sm:inline">Want Pinterest to publish these automatically for 30 days?</span>{' '}
            <span className="text-slate-600 block sm:inline">Connect your free Pinterest Business Auto-Publish RSS feed (0 developer approval needed).</span>
          </div>
        </div>
        <Link
          to="/pinterest-rss"
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto flex items-center space-x-1.5 shadow-xs transition"
        >
          <span>Setup Pinterest RSS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SECTION 1: Ready to Publish (Highlighted) */}
      {readyPins.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-base">
            <Clock className="w-5 h-5 animate-pulse" />
            <span>Ready to Publish ({readyPins.length} Pins)</span>
          </div>
          <p className="text-xs text-slate-500">
            Their scheduled hourly slot has arrived. Open each Pin to download the creative image and 1-click copy the title, description, and affiliate link to Pinterest.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-1">
            {readyPins.map((pin) => (
              <PinCard
                key={pin._id}
                pin={pin}
                onOpenHandoff={(p) => setActivePinForHandoff(p)}
                onOpenEdit={(p) => setActivePinForEdit(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Upcoming Chronological Schedule */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upcoming Reserved Hourly Slots</h2>
          <p className="text-xs text-slate-500">
            One pin per hourly interval in strict order of campaign creation
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading queue...</div>
        ) : scheduledPins.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Queue is currently empty"
            description="All scheduled pins have either been processed or no campaign has been submitted yet."
            actionText="Schedule New Campaign"
            actionLink="/create"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {scheduledPins.map((pin) => (
              <PinCard
                key={pin._id}
                pin={pin}
                onOpenHandoff={(p) => setActivePinForHandoff(p)}
                onOpenEdit={(p) => setActivePinForEdit(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PinHandoffModal
        pin={activePinForHandoff}
        isOpen={Boolean(activePinForHandoff)}
        onClose={() => setActivePinForHandoff(null)}
        onUpdated={fetchQueue}
      />

      <PinEditModal
        pin={activePinForEdit}
        isOpen={Boolean(activePinForEdit)}
        onClose={() => setActivePinForEdit(null)}
        onUpdated={fetchQueue}
      />

    </div>
  );
}
