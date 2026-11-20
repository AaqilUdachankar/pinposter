import React, { useState, useEffect } from 'react';
import { pinsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import {
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  Bookmark,
  Calendar,
  Save,
  MousePointerClick,
  Eye,
  Heart,
} from 'lucide-react';

export default function PublishedPins() {
  const toast = useToast();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMetricsId, setEditingMetricsId] = useState(null);
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [saves, setSaves] = useState(0);

  const fetchPublishedPins = async () => {
    try {
      setLoading(true);
      const res = await pinsApi.getAll({ status: 'published', limit: 100 });
      if (res.data.success) {
        setPins(res.data.pins || []);
      }
    } catch (err) {
      console.error('Failed to load published pins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedPins();
  }, []);

  const handleOpenEditMetrics = (pin) => {
    setEditingMetricsId(pin._id);
    setImpressions(pin.manualMetrics?.impressions || 0);
    setClicks(pin.manualMetrics?.outboundClicks || 0);
    setSaves(pin.manualMetrics?.saves || 0);
  };

  const handleSaveMetrics = async (pinId) => {
    try {
      const res = await pinsApi.logMetrics(pinId, {
        impressions,
        outboundClicks: clicks,
        saves,
      });

      if (res.data.success) {
        toast.success('Performance metrics logged successfully!');
        setEditingMetricsId(null);
        fetchPublishedPins();
      }
    } catch (err) {
      toast.error('Failed to update metrics');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Published Pins</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          History of manually confirmed Pins published on your Pinterest account
        </p>
      </div>

      {/* Manual Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
        <p className="font-semibold">Notice on Pinterest Analytics:</p>
        <p className="text-amber-800 leading-relaxed">
          Because PinPoster does NOT request access to your Pinterest passwords or developer accounts, all impressions, clicks and saves below are manually recorded by you to evaluate which Pin angles perform best.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading published pins...</div>
      ) : pins.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No published Pins yet"
          description="When your scheduled slots arrive, open the Publishing Queue to copy assets to Pinterest and click 'Mark as Published'."
          actionText="Go to Publishing Queue"
          actionLink="/queue"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pins.map((pin) => (
            <div
              key={pin._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex space-x-4">
                  <div className="w-20 aspect-[9/16] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={pin.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600">#{pin.conceptIndex}</span>
                      <StatusBadge status="published" />
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {pin.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 flex items-center space-x-1 truncate">
                      <Bookmark className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{pin.boardId?.name || 'Board'}</span>
                    </p>

                    <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {pin.publishedAt ? new Date(pin.publishedAt).toLocaleDateString() : 'Published'}
                      </span>
                    </p>
                  </div>
                </div>

                {pin.publishedPinUrl && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Pinterest URL:</span>
                    <a
                      href={pin.publishedPinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:text-rose-700 font-medium underline flex items-center space-x-1 truncate max-w-[180px]"
                    >
                      <span className="truncate">{pin.publishedPinUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Performance Metrics Tracker */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Performance (Manual)</span>
                  </span>

                  {editingMetricsId !== pin._id && (
                    <button
                      onClick={() => handleOpenEditMetrics(pin)}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Log Metrics
                    </button>
                  )}
                </div>

                {editingMetricsId === pin._id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Impressions</label>
                        <input
                          type="number"
                          value={impressions}
                          onChange={(e) => setImpressions(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Outbound Clicks</label>
                        <input
                          type="number"
                          value={clicks}
                          onChange={(e) => setClicks(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Saves</label>
                        <input
                          type="number"
                          value={saves}
                          onChange={(e) => setSaves(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingMetricsId(null)}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveMetrics(pin._id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Impressions</span>
                      <span className="font-bold text-slate-800">{pin.manualMetrics?.impressions || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Clicks</span>
                      <span className="font-bold text-emerald-600">{pin.manualMetrics?.outboundClicks || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Saves</span>
                      <span className="font-bold text-rose-600">{pin.manualMetrics?.saves || 0}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
