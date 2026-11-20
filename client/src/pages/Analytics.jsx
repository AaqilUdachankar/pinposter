import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Eye,
  Heart,
  Calendar,
  Layers,
  CheckCircle2,
  FolderKanban,
  Sparkles,
} from 'lucide-react';

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboard({ range });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics &amp; Reporting</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor campaign output, queue schedules, and manual affiliate performance metrics
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm self-start sm:self-auto">
          {[
            { label: 'Today', value: 'today' },
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: '90 Days', value: '90d' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === item.value
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Data Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
        <span>
          <strong>Data Isolation:</strong> All impression, click and save metrics reflect your manual post-publication records. Zero unauthorized Pinterest scraping.
        </span>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Creatives</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{metrics.totalPins || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">10 Pins per campaign</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Published Pins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{metrics.publishedPins || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Manual confirmed</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Impressions</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600">{metrics.totalImpressions || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Manually tracked</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Outbound Clicks</span>
            <MousePointerClick className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">{metrics.totalClicks || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">To affiliate destinations</span>
        </div>

      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Activity Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campaign Pin Production &amp; Publication</h3>
              <p className="text-xs text-slate-500">Visualizing 10-pin bursts and execution pace</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activityChart || []}>
                <defs>
                  <linearGradient id="anGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="anPub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="generated" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#anGen)" name="Generated Pins" />
                <Area type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#anPub)" name="Published Pins" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Board-wise Distribution Bar Chart */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pins by Pinterest Board</h3>
            <p className="text-xs text-slate-500">Distribution across your reference boards</p>
          </div>

          <div className="h-64 w-full my-2">
            {data?.boardDistribution?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No board distribution data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.boardDistribution || []} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" fill="#e11d48" radius={[0, 8, 8, 0]} name="Pins" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 text-center">
            {metrics.totalCampaigns || 0} Total Campaigns
          </div>
        </div>

      </div>

    </div>
  );
}
