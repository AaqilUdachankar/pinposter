import React, { useState, useEffect } from 'react';
import { feedApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Send,
  Zap,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Code,
  Copy,
  Clock,
  Layers,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export default function MakeAutomation() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [makeWebhookUrl, setMakeWebhookUrl] = useState('');
  const [makeWebhookEnabled, setMakeWebhookEnabled] = useState(false);
  const [autoPublishMethod, setAutoPublishMethod] = useState('both');
  const [defaultDisclosure, setDefaultDisclosure] = useState('');
  const [includeDisclosure, setIncludeDisclosure] = useState(true);
  const [stats, setStats] = useState({ totalPins: 0, scheduledPins: 0, publishedPins: 0 });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const sampleJson = JSON.stringify(
    {
      event: 'pin_ready_to_publish',
      pinId: '654321fedcba',
      conceptIndex: 1,
      conceptName: 'Product Hero Showcase',
      title: 'Minimalist Ergonomic Workspace — 2026 Inspo',
      description:
        'Transform your daily productivity with clean modern aesthetics and ergonomic comfort. Tap to view details! #ad #affiliate When you buy through our links, we may earn an affiliate commission.',
      destinationUrl: 'https://www.amazon.com/dp/B08XYZ1234?tag=affiliate-pinposter-20',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1080&h=1920&fit=crop',
      boardName: 'Home & Office Aesthetics',
      keywords: ['workspace aesthetic', 'desk setup', 'home office ideas 2026'],
      scheduledAt: '2026-11-20T12:00:00.000Z',
      publishedAt: '2026-11-20T12:00:01.000Z',
      disclosure: '#ad #affiliate When you buy through our links, we may earn an affiliate commission.',
    },
    null,
    2
  );

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await feedApi.getSettings();
      if (res.data.success) {
        setMakeWebhookUrl(res.data.makeWebhookUrl || '');
        setMakeWebhookEnabled(Boolean(res.data.makeWebhookEnabled));
        setAutoPublishMethod(res.data.autoPublishMethod || 'both');
        setIncludeDisclosure(res.data.includeDisclosure !== false);
        setDefaultDisclosure(
          res.data.defaultDisclosure ||
            '#ad #affiliate When you buy through our links, we may earn an affiliate commission.'
        );
        setStats(res.data.stats || { totalPins: 0, scheduledPins: 0, publishedPins: 0 });
      }
    } catch (err) {
      toast.error('Failed to load Make.com automation settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (
    methodToSave = autoPublishMethod,
    enabledToSave = makeWebhookEnabled,
    disclosureEnabledToSave = includeDisclosure
  ) => {
    setIsSaving(true);
    try {
      const res = await feedApi.saveSettings({
        makeWebhookUrl,
        makeWebhookEnabled: enabledToSave,
        autoPublishMethod: methodToSave,
        defaultDisclosure,
        includeDisclosure: disclosureEnabledToSave,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Make.com settings saved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWebhook = () => {
    const nextState = !makeWebhookEnabled;
    setMakeWebhookEnabled(nextState);
    handleSave(autoPublishMethod, nextState, includeDisclosure);
  };

  const handleToggleDisclosure = () => {
    const nextState = !includeDisclosure;
    setIncludeDisclosure(nextState);
    handleSave(autoPublishMethod, makeWebhookEnabled, nextState);
  };

  const handleSelectMethod = (method) => {
    setAutoPublishMethod(method);
    handleSave(method, makeWebhookEnabled, includeDisclosure);
  };

  const handleTestWebhook = async () => {
    if (!makeWebhookUrl.trim()) {
      toast.error('Please enter a Make.com Webhook URL before testing');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await feedApi.testWebhook({ webhookUrl: makeWebhookUrl.trim() });
      if (res.data.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'Make.com received sample payload successfully!',
        });
        toast.success('Test payload sent! Make.com scenario has detected all Pin fields.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Test failed';
      setTestResult({
        success: false,
        message: errMsg,
      });
      toast.error(`Make.com test failed: ${errMsg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(sampleJson);
    setCopiedPayload(true);
    toast.success('Sample JSON payload copied to clipboard!');
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-200">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Make.com Automation</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase tracking-wider">
                Exact-Hour Precision &bull; Free Partner API
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Trigger exact top-of-the-hour Pin publishing using Make.com's pre-approved Pinterest partner integration.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Campaign Pins</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalPins}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Scheduled for Hourly Dispatch</span>
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

      {/* Strategy Selector (Make Only vs Dual Mode) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Automation Strategy Mode
          </span>
          <p className="text-sm font-bold text-slate-800">
            How would you like to run Make.com?
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
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
            <span>Both Active (Make.com + Pinterest RSS)</span>
          </button>
        </div>
      </div>

      {/* Main Make.com Webhook Control Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Custom Webhook Configuration</h3>
            <p className="text-xs text-slate-500">
              When an hourly slot arrives, PinPoster sends the Pin payload directly to this Webhook.
            </p>
          </div>

          {/* Master Enable/Disable Switch */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">
              {makeWebhookEnabled ? 'Webhook Active' : 'Webhook Inactive'}
            </span>
            <button
              type="button"
              onClick={handleToggleWebhook}
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
              onClick={handleTestWebhook}
              disabled={isTesting || !makeWebhookUrl}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Sending Test...' : 'Test Webhook'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(autoPublishMethod, makeWebhookEnabled)}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            In Make.com, create a scenario with <strong>Webhooks &rarr; Custom Webhook</strong> &rarr; copy the Webhook URL and paste it here.
          </p>
        </div>

        {/* Live Test Result Alert */}
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
                Automatically append or omit your affiliate disclosure in Pin descriptions and webhook dispatches.
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
              <span>Affiliate disclosure is turned <strong>OFF</strong>. Pins will be dispatched with clean descriptions and zero disclosure tags.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4-Step Make.com Quickstart Guide */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">How to Connect Make.com to Pinterest (5-Minute Setup)</h3>
            <p className="text-xs text-slate-500">
              Make.com's free plan includes 1,000 free operations/month (enough for 10-12 pins/day = ~360 pins/month).
            </p>
          </div>
          <a
            href="https://www.make.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <span>Open Make.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Create Free Make Account</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sign up at <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="text-rose-600 underline">make.com</a>. Free plan forever, zero credit card required.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Add Webhook Module</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Click <strong>Create a new scenario</strong> &rarr; add <strong>Webhooks &rarr; Custom Webhook</strong>. Copy the address into PinPoster.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Click "Test Webhook"</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In Make.com, leave the webhook listening. Click the <strong>Test Webhook</strong> button above. Make.com will automatically detect all Pin fields.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Add Pinterest Module</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Add <strong>Pinterest &rarr; Create a Pin</strong>. Connect your account via OAuth, then map: Image URL (1080x1920), Title, Description, and Link.
            </p>
          </div>
        </div>

        {/* Payload Schema Inspector */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-amber-400" />
              <span>Full Payload Schema Dispatched to Make.com:</span>
            </span>
            <button
              type="button"
              onClick={handleCopyPayload}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-400 flex items-center space-x-1 transition"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto p-3 bg-black/40 rounded-xl leading-relaxed max-h-60">
            {sampleJson}
          </pre>
        </div>
      </div>

    </div>
  );
}