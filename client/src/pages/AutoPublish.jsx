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
  Send,
  Settings,
  AlertCircle,
  Info,
  Code,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export default function AutoPublish() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rss'); // 'rss' | 'make' | 'comparison'

  // RSS Feed state
  const [feedUrl, setFeedUrl] = useState('');
  const [feedToken, setFeedToken] = useState('');
  const [stats, setStats] = useState({ totalPins: 0, scheduledPins: 0, publishedPins: 0 });
  const [copiedRss, setCopiedRss] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Make.com state
  const [makeWebhookUrl, setMakeWebhookUrl] = useState('');
  const [makeWebhookEnabled, setMakeWebhookEnabled] = useState(false);
  const [autoPublishMethod, setAutoPublishMethod] = useState('both');
  const [defaultDisclosure, setDefaultDisclosure] = useState('');
  const [includeDisclosure, setIncludeDisclosure] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchFeedSettings = async () => {
    try {
      setLoading(true);
      const res = await feedApi.getSettings();
      if (res.data.success) {
        setFeedUrl(res.data.feedUrl || '');
        setFeedToken(res.data.feedToken || '');
        setMakeWebhookUrl(res.data.makeWebhookUrl || '');
        setMakeWebhookEnabled(Boolean(res.data.makeWebhookEnabled));
        setAutoPublishMethod(res.data.autoPublishMethod || 'both');
        setIncludeDisclosure(res.data.includeDisclosure !== false);
        setDefaultDisclosure(res.data.defaultDisclosure || '#ad #affiliate When you buy through our links, we may earn an affiliate commission.');
        setStats(res.data.stats || { totalPins: 0, scheduledPins: 0, publishedPins: 0 });
      }
    } catch (err) {
      toast.error('Failed to load Auto-Publish settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedSettings();
  }, []);

  const handleCopyRss = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopiedRss(true);
    toast.success('RSS Feed URL copied! Paste it in Pinterest Settings.');
    setTimeout(() => setCopiedRss(false), 3000);
  };

  const handleRegenerateRss = async () => {
    if (!window.confirm('Are you sure you want to regenerate your RSS token? You will need to update the URL in Pinterest Settings.')) {
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

  const handleSaveSettings = async (
    methodToSave = autoPublishMethod,
    enabledToSave = makeWebhookEnabled,
    disclosureEnabledToSave = includeDisclosure
  ) => {
    setIsSavingSettings(true);
    try {
      const res = await feedApi.saveSettings({
        makeWebhookUrl,
        makeWebhookEnabled: enabledToSave,
        autoPublishMethod: methodToSave,
        defaultDisclosure,
        includeDisclosure: disclosureEnabledToSave,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Settings saved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleDisclosure = () => {
    const nextState = !includeDisclosure;
    setIncludeDisclosure(nextState);
    handleSaveSettings(autoPublishMethod, makeWebhookEnabled, nextState);
  };

  const handleTestMakeWebhook = async () => {
    if (!makeWebhookUrl.trim()) {
      toast.error('Please enter a Make.com Webhook URL before testing');
      return;
    }
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await feedApi.testWebhook({ webhookUrl: makeWebhookUrl.trim() });
      if (res.data.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'Make.com received sample payload successfully!',
        });
        toast.success('Test payload sent! Make.com scenario has detected the fields.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Test failed';
      setTestResult({
        success: false,
        message: errMsg,
      });
      toast.error(`Make.com test failed: ${errMsg}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSelectMethod = (method) => {
    setAutoPublishMethod(method);
    handleSaveSettings(method, makeWebhookEnabled);
  };

  const handleToggleMake = () => {
    const nextState = !makeWebhookEnabled;
    setMakeWebhookEnabled(nextState);
    handleSaveSettings(autoPublishMethod, nextState);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Auto-Publish Command Center</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                Zero Dev Approval Required
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Work 1 day generating your campaign, then relax for the next 30 days while your 1080×1920 Pins auto-publish to Pinterest.
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

      {/* Primary Method Switcher Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Auto-Publish Strategy
            </span>
            <p className="text-sm font-bold text-slate-800">
              Select how PinPoster should publish your scheduled hourly queue:
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => handleSelectMethod('rss')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                autoPublishMethod === 'rss'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rss className="w-3.5 h-3.5" />
              <span>Pinterest RSS Only</span>
            </button>

            <button
              onClick={() => handleSelectMethod('make')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                autoPublishMethod === 'make'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Make.com Only</span>
            </button>

            <button
              onClick={() => handleSelectMethod('both')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                autoPublishMethod === 'both'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Both Active (Recommended)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Banner based on choice */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 flex items-start space-x-3">
          <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {autoPublishMethod === 'both' && (
              <span>
                <strong>Dual-Publish Activated:</strong> PinPoster updates your live Pinterest RSS feed for continuous catalog indexing <em>and</em> automatically fires your Make.com Webhook at every hourly interval for precise top-of-the-hour posting.
              </span>
            )}
            {autoPublishMethod === 'rss' && (
              <span>
                <strong>Pinterest RSS Only:</strong> Pinterest's native crawler pulls your scheduled Pins directly from your private RSS feed. No third-party tools, no API limits, 100% free forever.
              </span>
            )}
            {autoPublishMethod === 'make' && (
              <span>
                <strong>Make.com Webhook Only:</strong> PinPoster posts directly to your Make.com Custom Webhook at every exact hourly scheduled slot, which publishes to Pinterest instantly via Make's pre-approved OAuth partner connection.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Campaign Pins</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Published to Pinterest</span>
            <span className="text-2xl font-black text-slate-900">{stats.publishedPins}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('rss')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'rss'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Rss className="w-4 h-4" />
          <span>Option A: Pinterest RSS Feed (Native)</span>
        </button>

        <button
          onClick={() => setActiveTab('make')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'make'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Option B: Make.com Automation (Exact-Hour)</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'comparison'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Method Comparison &amp; FAQ</span>
        </button>
      </div>

      {/* TAB 1: PINTEREST RSS FEED */}
      {activeTab === 'rss' && (
        <div className="space-y-6">
          {/* Main Feed URL Control Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Private Automated Pinterest RSS Feed</h3>
                <p className="text-xs text-slate-500">Paste this unique feed URL into your Pinterest Business settings.</p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>RSS Feed Live &amp; Ready</span>
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
                  onClick={handleCopyRss}
                  className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition shadow-sm ${
                    copiedRss
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {copiedRss ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRss ? 'Copied to Clipboard!' : 'Copy Feed URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                This private feed contains all 1080×1920 images, SEO titles, descriptions, and raw affiliate links formatted to Pinterest's exact MRSS standard.
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
                  onClick={handleRegenerateRss}
                  disabled={regenerating}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate Secret Token</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Auto-updated whenever new campaign links are submitted.
              </span>
            </div>
          </div>

          {/* 3-Step Setup Guide */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">How to Connect Pinterest in 2 Minutes</h3>
              <p className="text-xs text-slate-500">Zero developer approval required — uses Pinterest's native RSS auto-publishing feature.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Open Pinterest Settings</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log into your Pinterest Business account. Click your profile avatar in the top right and open <strong>Settings</strong>.
                </p>
                <a
                  href="https://www.pinterest.com/settings/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <span>Go to Settings</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Bulk create Pins (RSS)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In the left sidebar of Pinterest Settings, click <strong>Bulk create Pins</strong> (or <strong>Auto-publish from RSS feed</strong>).
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

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Paste Feed URL &amp; Save</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste your copied PinPoster RSS Feed URL, choose which Pinterest Board you want your Pins to land on, and click <strong>Save</strong>!
                </p>
                <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>30-Day Auto-Publish active!</span>
                </span>
              </div>
            </div>

            {/* Note on Public Server */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Hosting / Local Machine Note:</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Pinterest's servers fetch your feed over the public internet. If running locally on <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">localhost:5000</code>, expose your feed using a free tunnel like <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ngrok http 5000</code>, or deploy PinPoster to Render/Railway following the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">DEPLOYMENT_GUIDE.md</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAKE.COM AUTOMATION */}
      {activeTab === 'make' && (
        <div className="space-y-6">
          {/* Make.com Configuration Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Make.com Custom Webhook Integration</h3>
                <p className="text-xs text-slate-500">
                  Trigger exact top-of-the-hour Pin publishing using Make.com's pre-approved Pinterest OAuth integration.
                </p>
              </div>

              {/* Enable / Disable Switch */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700">
                  {makeWebhookEnabled ? 'Webhook Active' : 'Webhook Inactive'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleMake}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    makeWebhookEnabled ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      makeWebhookEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Webhook Input Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Make.com Custom Webhook URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://hook.eu2.make.com/your-custom-webhook-id"
                  value={makeWebhookUrl}
                  onChange={(e) => setMakeWebhookUrl(e.target.value)}
                  className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />

                <button
                  type="button"
                  onClick={handleTestMakeWebhook}
                  disabled={isTestingWebhook || !makeWebhookUrl}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                  <span>{isTestingWebhook ? 'Sending Test...' : 'Test Webhook'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSettings(autoPublishMethod, makeWebhookEnabled)}
                  disabled={isSavingSettings}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                In Make.com, create a scenario with <strong>Custom Webhook</strong> &rarr; copy the Webhook URL and paste it here.
              </p>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center space-x-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Disclosure Customization with ON / OFF Switch */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-slate-800">
                      Default Affiliate Disclosure:
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                        includeDisclosure
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {includeDisclosure ? 'ON (Attached to Pins)' : 'OFF (No Disclosure)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automatically append or omit your affiliate disclosure in descriptions.
                  </p>
                </div>

                {/* ON / OFF Toggle Button */}
                <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
                  <span className={`text-xs font-bold ${includeDisclosure ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {includeDisclosure ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleDisclosure}
                    aria-label="Toggle Affiliate Disclosure"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      includeDisclosure ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        includeDisclosure ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {includeDisclosure ? (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={defaultDisclosure}
                    onChange={(e) => setDefaultDisclosure(e.target.value)}
                    placeholder="#ad #affiliate When you buy through our links, we may earn an affiliate commission."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                  <p className="text-[11px] text-emerald-700 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Active: This exact text will be attached to Pin descriptions sent to Make.com.</span>
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center space-x-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Affiliate disclosure is turned <strong>OFF</strong>. Pins will be dispatched with clean descriptions without disclosure tags.</span>
                </div>
              )}
            </div>
          </div>

          {/* 4-Step Make.com Quickstart Guide */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">How to Setup Make.com Scenario (5 Minutes, 100% Free)</h3>
              <p className="text-xs text-slate-500">
                Make.com's free plan includes 1,000 operations per month (plenty for 10-12 pins/day = ~360 pins/month).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Sign Up on Make.com</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Go to <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="text-rose-600 underline">make.com</a> and sign up for a free account. No credit card required.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Add Webhook Module</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Click <strong>Create a new scenario</strong> &rarr; add <strong>Webhooks</strong> &rarr; <strong>Custom Webhook</strong>. Copy the address into PinPoster.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Click "Test Webhook"</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  In Make.com, leave the webhook listening. Click the <strong>Test Webhook</strong> button above. Make.com will say "Successfully determined".
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Add Pinterest Module</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Add <strong>Pinterest &rarr; Create a Pin</strong>. Connect your account via OAuth, then map: Image URL, Title, Description, and Link.
                </p>
              </div>
            </div>

            {/* Payload Schema Inspector */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Code className="w-4 h-4 text-rose-400" />
                  <span>Payload Fields Sent to Make.com:</span>
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">JSON Format</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto p-2 bg-black/40 rounded-xl leading-relaxed">
{`{
  "event": "pin_ready_to_publish",
  "pinId": "654321fedcba",
  "title": "Minimalist Ergonomic Workspace — 2026 Inspo",
  "description": "Transform your daily productivity with clean modern aesthetics...",
  "destinationUrl": "https://www.amazon.com/dp/B08XYZ1234?tag=affiliate-pinposter-20",
  "imageUrl": "https://images.unsplash.com/... (1080x1920 vertical)",
  "boardName": "Home & Office Aesthetics",
  "keywords": ["desk setup", "home office", "inspo 2026"],
  "scheduledAt": "2026-11-20T12:00:00.000Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: METHOD COMPARISON & STRATEGY */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Side-by-Side Method Comparison</h3>
              <p className="text-xs text-slate-500">
                Choose the setup that best matches your workflow, or use both simultaneously for redundant auto-publishing.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4 text-rose-600">Option A: Pinterest RSS Feed</th>
                    <th className="py-3 px-4 text-amber-600">Option B: Make.com Webhook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Developer Approval Required?</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">0 Approval Needed (Pinterest built-in)</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">0 Approval Needed (Pre-approved partner)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Monthly Cost</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">100% Free Forever (0 limits)</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">100% Free (1,000 ops/month)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Publishing Timing Precision</td>
                    <td className="py-3 px-4 text-slate-600">Periodic (Pinterest crawlers pull periodically)</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">Exact-Hour (Dispatched precisely at :00)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Setup Time</td>
                    <td className="py-3 px-4 text-slate-600">2 minutes (Copy-paste one URL)</td>
                    <td className="py-3 px-4 text-slate-600">5 minutes (Connect Make scenario)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Pinterest Account Ban Risk</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">Ultra Safe (Official Pinterest feature)</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">Ultra Safe (Official Pinterest Partner API)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Affiliate Link Preservation</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">100% Raw Tag Preserved</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">100% Raw Tag Preserved</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Image Resolution</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">1080×1920 (9:16 Full HD)</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">1080×1920 (9:16 Full HD)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Why Dual Automation is Best */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200/80 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>The 30-Day Passive Strategy: Work 1 Day, Check Analytics for 30 Days</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                By setting active strategy to <strong>Both Active</strong>, you get maximum distribution:
                Pinterest's native algorithm indexes your RSS feed continuously into its shopping catalog, while Make.com triggers your fresh Pins top-of-the-hour every daytime hour. If one service experiences a network delay, the other acts as an instant safety net.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}