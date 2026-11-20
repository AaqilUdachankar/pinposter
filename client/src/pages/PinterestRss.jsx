import React, { useState, useEffect } from 'react';
import { feedApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Rss,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react';

export default function PinterestRss() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [feedUrl, setFeedUrl] = useState('');
  const [feedToken, setFeedToken] = useState('');
  const [stats, setStats] = useState({ totalPins: 0, scheduledPins: 0, publishedPins: 0 });
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchFeedSettings = async () => {
    try {
      setLoading(true);
      const res = await feedApi.getSettings();
      if (res.data.success) {
        setFeedUrl(res.data.feedUrl || '');
        setFeedToken(res.data.feedToken || '');
        setStats(res.data.stats || { totalPins: 0, scheduledPins: 0, publishedPins: 0 });
      }
    } catch (err) {
      toast.error('Failed to load Pinterest RSS settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedSettings();
  }, []);

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    toast.success('RSS Feed URL copied to clipboard! Paste it into Pinterest Settings.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        'Are you sure you want to regenerate your RSS token? You will need to update the URL in your Pinterest account settings.'
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await feedApi.regenerateToken();
      if (res.data.success) {
        setFeedUrl(res.data.feedUrl);
        setFeedToken(res.data.feedToken);
        toast.success('New RSS Feed URL generated successfully!');
      }
    } catch (err) {
      toast.error('Failed to regenerate RSS token');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
            <Rss className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Pinterest RSS Auto-Publish</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                Native &bull; Zero Dev Approval
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Connect your private Media RSS feed directly to Pinterest Business for 100% hands-free automatic publishing.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFeedSettings}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Highlights Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>100% Set-It-And-Forget-It Automation</span>
          </div>
          <h2 className="text-lg font-bold">Work 1 Day, Let Pinterest Auto-Publish for 30 Days</h2>
          <p className="text-xs text-rose-100 leading-relaxed">
            Pinterest Business features a built-in auto-publisher that continuously pulls your Pins directly from your private RSS feed. Connect it once, and Pinterest automatically creates Pins with your 1080×1920 images, titles, descriptions, and preserved raw affiliate links.
          </p>
        </div>

        <div className="flex md:flex-col gap-2 shrink-0">
          <a
            href="https://www.pinterest.com/settings/bulk-create-pins/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <span>Open Pinterest Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Pins in Feed</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalPins}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Scheduled for Auto-Publish</span>
            <span className="text-2xl font-black text-slate-900">{stats.scheduledPins}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active &amp; Published</span>
            <span className="text-2xl font-black text-slate-900">{stats.publishedPins}</span>
          </div>
        </div>
      </div>

      {/* Main Feed URL Control Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Private Automated Pinterest RSS Feed</h3>
            <p className="text-xs text-slate-500">Paste this unique feed URL into your Pinterest Business settings.</p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Feed Live &amp; Accessible</span>
          </span>
        </div>

        {/* URL Box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Copy Your RSS Feed URL:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={feedUrl}
                onClick={(e) => e.target.select()}
                className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-700 select-all focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleCopy}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Feed URL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            This private link contains all your scheduled campaign Pins formatted to Pinterest's exact MRSS standard with 1080×1920 images and affiliate links.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <a
              href={feedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect Raw XML Feed</span>
            </a>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Secret Token</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Updated automatically whenever new campaigns are generated.
          </span>
        </div>
      </div>

      {/* Visual 3-Step Setup Guide */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">How to Connect to Pinterest in 2 Minutes</h3>
          <p className="text-xs text-slate-500">Follow these 3 simple steps to activate full 30-day auto-publishing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Open Pinterest Settings</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log into your free Pinterest Business account. Click your profile avatar in the top right corner and open <strong>Settings</strong>.
            </p>
            <a
              href="https://www.pinterest.com/settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <span>Go to Pinterest Settings</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Go to "Bulk create Pins"</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              On the left menu inside Pinterest Settings, click on <strong>Bulk create Pins</strong> (or <strong>Auto-publish from RSS feed</strong>).
            </p>
            <a
              href="https://www.pinterest.com/settings/bulk-create-pins/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <span>Direct Link to RSS Setting</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Paste Feed URL &amp; Save</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste your copied PinPoster RSS Feed URL into the field, select which Pinterest Board you want your Pins to land on, and click <strong>Save</strong>!
            </p>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>You're fully automated!</span>
            </span>
          </div>
        </div>

        {/* Note on Localhost / Public Internet */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-amber-950">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Important Note for Running Locally:</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Pinterest's servers connect over the public internet to pull your feed. If running PinPoster on your local machine (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:5000</code>), you can make your feed publicly reachable using a free tunnel like <strong>ngrok</strong> (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ngrok http 5000</code>) or by deploying PinPoster to Render/Railway using the included <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">DEPLOYMENT_GUIDE.md</code>.
          </p>
        </div>
      </div>

    </div>
  );
}