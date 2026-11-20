import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi, queueApi } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import PinCard from '../components/pins/PinCard';
import PinHandoffModal from '../components/common/PinHandoffModal';
import PinEditModal from '../components/common/PinEditModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  CalendarCheck,
  FolderKanban,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Bookmark,
  Layers,
} from 'lucide-react';

export default function Overview() {
  const [data, setData] = useState(null);
  const [nextSlot, setNextSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePinForHandoff, setActivePinForHandoff] = useState(null);
  const [activePinForEdit, setActivePinForEdit] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [analyticsRes, queueRes] = await Promise.all([
        analyticsApi.getDashboard({ range: '30d' }),
        queueApi.getNextSlot(),
      ]);

      if (analyticsRes.data.success) {
        setData(analyticsRes.data);
      }
      if (queueRes.data.success) {
        setNextSlot(queueRes.data.nextAvailableSlot);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading PinPoster dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 sm:p-8 text-white overflow-hidden shadow-soft-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>One Link. Ten Creative Pins. Global Hourly Schedule.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Pinterest Affiliate Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Submit any affiliate product URL to automatically extract details, generate 10 unique high-converting Pinterest Pins, and reserve consecutive hourly schedule slots.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {nextSlot && (
              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs text-left">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Next Available Slot</span>
                <span className="text-white font-bold flex items-center space-x-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {new Date(nextSlot).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>
            )}

            <Link
              to="/create"
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-900/40 flex items-center space-x-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Campaign</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Campaigns */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Campaigns</span>
            <FolderKanban className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalCampaigns || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active campaigns</span>
        </div>

        {/* Total Pins */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pins</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalPins || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Generated creatives</span>
        </div>

        {/* Scheduled Pins */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled</span>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{metrics.scheduledPins || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Reserved hourly slots</span>
        </div>

        {/* Ready to Publish */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-soft bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Ready</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{metrics.readyPins || 0}</p>
          <span className="text-[11px] text-rose-500 font-medium mt-1 block">Awaiting manual pin</span>
        </div>

        {/* Published */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{metrics.publishedPins || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Manual confirmed</span>
        </div>

        {/* Manual Impressions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Impressions</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.totalImpressions || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Logged manually</span>
        </div>

      </div>

      {/* Ready to Publish Alert Banner (if any pins are due) */}
      {(metrics.readyPins > 0) && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-200">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                You have {metrics.readyPins} Pin{metrics.readyPins > 1 ? 's' : ''} ready to publish on Pinterest!
              </h4>
              <p className="text-xs text-rose-700 leading-snug">
                The scheduled slot has arrived. Open the Publishing Queue to copy titles, descriptions, affiliate URLs and download images.
              </p>
            </div>
          </div>
          <Link
            to="/queue"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition whitespace-nowrap"
          >
            Open Publishing Queue &rarr;
          </Link>
        </div>
      )}

      {/* Upcoming Scheduled Pins Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming in Publishing Queue</h2>
            <p className="text-xs text-slate-500">Strictly organized by global chronological hourly slots</p>
          </div>
          <Link to="/queue" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1">
            <span>View Full Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.upcomingPins?.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">No upcoming pins scheduled right now.</p>
            <Link
              to="/create"
              className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.upcomingPins?.map((pin) => (
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Activity Over Time Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pins Generated vs Published</h3>
              <p className="text-xs text-slate-500">Daily activity trends over the last 30 days</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activityChart || []}>
                <defs>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="generated" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorGen)" name="Generated" />
                <Area type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPub)" name="Published" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pin Status Distribution Pie Chart */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pin Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of pins across all campaigns</p>
          </div>

          <div className="h-56 w-full my-2">
            {data?.statusDistribution?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No pins in database yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Tracked</span>
            <span className="font-bold text-slate-900">{metrics.totalPins || 0} Pins</span>
          </div>
        </div>

      </div>

      {/* Modals */}
      <PinHandoffModal
        pin={activePinForHandoff}
        isOpen={Boolean(activePinForHandoff)}
        onClose={() => setActivePinForHandoff(null)}
        onUpdated={fetchOverview}
      />

      <PinEditModal
        pin={activePinForEdit}
        isOpen={Boolean(activePinForEdit)}
        onClose={() => setActivePinForEdit(null)}
        onUpdated={fetchOverview}
      />

    </div>
  );
}
