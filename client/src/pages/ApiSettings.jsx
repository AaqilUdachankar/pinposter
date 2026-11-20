import React, { useState, useEffect } from 'react';
import { apiConfigApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Cloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Trash2,
  Save,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ApiSettings() {
  const toast = useToast();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gemini Text AI state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [geminiEndpoint, setGeminiEndpoint] = useState('');
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);

  // Image Generation state
  const [imageProviderName, setImageProviderName] = useState('gemini_imagen');
  const [imageApiKey, setImageApiKey] = useState('');
  const [imageEndpoint, setImageEndpoint] = useState('');
  const [imageModel, setImageModel] = useState('imagen-3.0-generate-002');
  const [imageDimensions, setImageDimensions] = useState('1080x1920');
  const [imageTesting, setImageTesting] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);

  // Cloudinary state
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState('');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState('');
  const [cloudinaryTesting, setCloudinaryTesting] = useState(false);
  const [cloudinarySaving, setCloudinarySaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await apiConfigApi.getAll();
      if (res.data.success && res.data.configurations) {
        setConfigs(res.data.configurations);

        // Prepopulate Text AI
        const textConfig = res.data.configurations.find((c) => c.providerType === 'text_ai');
        if (textConfig) {
          setGeminiModel(textConfig.model || 'gemini-1.5-flash');
          setGeminiEndpoint(textConfig.endpoint || '');
          if (textConfig.hasApiKey) {
            setGeminiApiKey(textConfig.maskedApiKey || '••••••••');
          }
        }

        // Prepopulate Image Generation
        const imgConfig = res.data.configurations.find((c) => c.providerType === 'image_generation');
        if (imgConfig) {
          setImageProviderName(imgConfig.providerName || 'gemini_imagen');
          setImageModel(imgConfig.model || (imgConfig.providerName === 'openai' ? 'dall-e-3' : 'imagen-3.0-generate-002'));
          setImageEndpoint(imgConfig.endpoint || '');
          setImageDimensions(imgConfig.dimensions || '1080x1920');
          if (imgConfig.hasApiKey) {
            setImageApiKey(imgConfig.maskedApiKey || '••••••••');
          }
        }

        // Prepopulate Cloudinary
        const storageConfig = res.data.configurations.find((c) => c.providerType === 'storage');
        if (storageConfig) {
          setCloudinaryCloudName(storageConfig.endpoint || '');
          if (storageConfig.hasApiKey) setCloudinaryApiKey(storageConfig.maskedApiKey || '••••••••');
          if (storageConfig.hasApiSecret) setCloudinaryApiSecret(storageConfig.maskedApiSecret || '••••••••');
        }
      }
    } catch (err) {
      console.error('Failed to load API settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Save Gemini Config
  const handleSaveGemini = async (e) => {
    e.preventDefault();
    setGeminiSaving(true);
    try {
      const res = await apiConfigApi.save({
        providerType: 'text_ai',
        providerName: 'gemini',
        model: geminiModel,
        endpoint: geminiEndpoint,
        apiKey: geminiApiKey,
        isDefault: true,
      });

      if (res.data.success) {
        toast.success('Gemini settings saved and encrypted securely!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Gemini settings');
    } finally {
      setGeminiSaving(false);
    }
  };

  // Test Gemini
  const handleTestGemini = async () => {
    setGeminiTesting(true);
    try {
      const textConfig = configs.find((c) => c.providerType === 'text_ai');
      const res = await apiConfigApi.test({
        id: textConfig?._id,
        providerType: 'text_ai',
        providerName: 'gemini',
        apiKey: geminiApiKey,
        model: geminiModel,
        endpoint: geminiEndpoint,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Gemini connection verified successfully!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gemini connection test failed');
      fetchConfigs();
    } finally {
      setGeminiTesting(false);
    }
  };

  // Save Image Provider
  const handleSaveImageProvider = async (e) => {
    e.preventDefault();
    setImageSaving(true);
    try {
      const res = await apiConfigApi.save({
        providerType: 'image_generation',
        providerName: imageProviderName,
        model: imageModel,
        endpoint: imageEndpoint,
        dimensions: imageDimensions,
        apiKey: imageApiKey,
        isDefault: true,
      });

      if (res.data.success) {
        toast.success('Image generation settings saved securely!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error('Failed to save image provider');
    } finally {
      setImageSaving(false);
    }
  };

  // Test Image Provider
  const handleTestImageProvider = async () => {
    setImageTesting(true);
    try {
      const imgConfig = configs.find((c) => c.providerType === 'image_generation');
      const res = await apiConfigApi.test({
        id: imgConfig?._id,
        providerType: 'image_generation',
        providerName: imageProviderName,
        apiKey: imageApiKey || (imageProviderName === 'gemini_imagen' ? geminiApiKey : ''),
        endpoint: imageEndpoint,
        model: imageModel,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Image provider ready!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image provider test failed');
    } finally {
      setImageTesting(false);
    }
  };

  // Save Cloudinary
  const handleSaveCloudinary = async (e) => {
    e.preventDefault();
    setCloudinarySaving(true);
    try {
      const res = await apiConfigApi.save({
        providerType: 'storage',
        providerName: 'cloudinary',
        endpoint: cloudinaryCloudName,
        apiKey: cloudinaryApiKey,
        apiSecret: cloudinaryApiSecret,
        isDefault: true,
      });

      if (res.data.success) {
        toast.success('Cloudinary storage credentials saved securely!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error('Failed to save Cloudinary settings');
    } finally {
      setCloudinarySaving(false);
    }
  };

  // Test Cloudinary
  const handleTestCloudinary = async () => {
    setCloudinaryTesting(true);
    try {
      const storageConfig = configs.find((c) => c.providerType === 'storage');
      const res = await apiConfigApi.test({
        id: storageConfig?._id,
        providerType: 'storage',
        providerName: 'cloudinary',
        endpoint: cloudinaryCloudName,
        apiKey: cloudinaryApiKey,
        apiSecret: cloudinaryApiSecret,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Cloudinary connected successfully!');
        fetchConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cloudinary connection failed');
      fetchConfigs();
    } finally {
      setCloudinaryTesting(false);
    }
  };

  const textConfig = configs.find((c) => c.providerType === 'text_ai');
  const imgConfig = configs.find((c) => c.providerType === 'image_generation');
  const storageConfig = configs.find((c) => c.providerType === 'storage');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>API Settings Control Center</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AES-256 Encrypted</span>
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure and hot-swap your AI models, image providers, and Cloudinary storage directly from the dashboard without touching code.
        </p>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft text-xs text-slate-600 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">Zero Code Editing Required &amp; Hardened Encryption at Rest</p>
          <p className="text-slate-500 leading-relaxed">
            All API keys and secrets are encrypted with AES-256-GCM on the backend before writing to MongoDB. Raw credentials are never transmitted back to browser JavaScript or stored in plaintext logs.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* CARD A: Text AI Provider (Gemini) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Text AI Provider (Google Gemini)</h3>
                <p className="text-xs text-slate-500">Extracts product features, SEO titles, descriptions and Pinterest hashtags</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                textConfig?.testStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : textConfig?.testStatus === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {textConfig?.testStatus === 'connected' ? 'Connected' : textConfig?.testStatus === 'failed' ? 'Connection Failed' : 'Untested / Ready'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveGemini} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Paste your AIzaSy... API key"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Keys are masked in the UI and encrypted with AES-256 at rest.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast &amp; Recommended)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (High Detail)</option>
                  <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom API Endpoint (Optional)</label>
                <input
                  type="url"
                  value={geminiEndpoint}
                  onChange={(e) => setGeminiEndpoint(e.target.value)}
                  placeholder="Leave empty for official Google Generative Language API endpoint"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={geminiTesting || !geminiApiKey}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {geminiTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Gemini Connection</span>
              </button>

              <button
                type="submit"
                disabled={geminiSaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {geminiSaving ? 'Saving...' : 'Save Gemini Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* CARD B: Image Generation Provider */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Image Generation (Pinterest Aesthetic Engine)</h3>
                <p className="text-xs text-slate-500">Renders authentic vertical Pinterest photos (1080x1920) — zero banner ads or buttons</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                imgConfig?.testStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : imgConfig?.testStatus === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {imgConfig?.testStatus === 'connected' ? 'Connected' : imgConfig?.testStatus === 'failed' ? 'Connection Failed' : 'Active Adapter Ready'}
              </span>
            </div>
          </div>

          {/* Aesthetic Pinterest Guarantee Badge */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">100% Real Pinterest Style — Never Looks Like An Ad</span>
              <span className="text-emerald-700 leading-relaxed block">
                Generates authentic photorealistic lifestyle photography with natural ambient lighting and cozy settings. Guaranteed free of promotional banner ads, "Shop Now" buttons, marketing badges, or text overlays.
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveImageProvider} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider Adapter</label>
                <select
                  value={imageProviderName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageProviderName(val);
                    if (val === 'gemini_imagen') setImageModel('imagen-3.0-generate-002');
                    else if (val === 'openai') setImageModel('dall-e-3');
                    else setImageModel('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                >
                  <option value="gemini_imagen">Google Gemini (Imagen 3 / 2.0) — Recommended</option>
                  <option value="openai">OpenAI DALL-E 3 (High-Fidelity Photography)</option>
                  <option value="sharp_aesthetic">Aesthetic Pinterest Photo Studio (Zero-Ad Clean Showcase)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Aspect Dimensions</label>
                <input
                  type="text"
                  value={imageDimensions}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Pinterest 9:16 vertical full HD (1080x1920).</span>
              </div>

              {imageProviderName === 'gemini_imagen' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini Model</label>
                    <select
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    >
                      <option value="imagen-3.0-generate-002">imagen-3.0-generate-002 (Official Imagen 3 - Recommended)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gemini API Key (Optional)</label>
                    <input
                      type="password"
                      value={imageApiKey}
                      onChange={(e) => setImageApiKey(e.target.value)}
                      placeholder="Leave empty to use Gemini Key from Text AI above"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Auto-inherits your Text AI Gemini Key if left blank.
                    </span>
                  </div>
                </>
              )}

              {imageProviderName === 'openai' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">OpenAI Model</label>
                    <select
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    >
                      <option value="dall-e-3">dall-e-3 (Vertical 1024x1792 Photorealism)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">OpenAI API Key</label>
                    <input
                      type="password"
                      value={imageApiKey}
                      onChange={(e) => setImageApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Encrypted with AES-256-GCM before saving to database.
                    </span>
                  </div>
                </>
              )}

              {imageProviderName === 'sharp_aesthetic' && (
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Aesthetic Pinterest Photo Studio Active</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Composes genuine product photography into warm, natural lifestyle scenes with ambient daylight and realistic contact shadows. 100% local, fast, and free of commercial badges or buttons.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestImageProvider}
                disabled={imageTesting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {imageTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Image Engine</span>
              </button>

              <button
                type="submit"
                disabled={imageSaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {imageSaving ? 'Saving...' : 'Save Image Provider'}
              </button>
            </div>
          </form>
        </div>

        {/* CARD C: Storage Provider (Cloudinary) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-sm">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Storage Provider (Cloudinary)</h3>
                <p className="text-xs text-slate-500">Persistent cloud hosting for generated Pinterest Pin images</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              storageConfig?.testStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {storageConfig?.testStatus === 'connected' ? 'Connected' : 'Local Fallback Active'}
            </span>
          </div>

          <form onSubmit={handleSaveCloudinary} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cloud Name</label>
                <input
                  type="text"
                  value={cloudinaryCloudName}
                  onChange={(e) => setCloudinaryCloudName(e.target.value)}
                  placeholder="e.g. my-cloud-name"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={cloudinaryApiKey}
                  onChange={(e) => setCloudinaryApiKey(e.target.value)}
                  placeholder="e.g. 123456789..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Secret</label>
                <input
                  type="password"
                  value={cloudinaryApiSecret}
                  onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                  placeholder="e.g. ••••••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              When Cloudinary credentials are not configured, PinPoster seamlessly uses reliable local server disk storage (`/uploads`) so you can generate and test without barriers.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestCloudinary}
                disabled={cloudinaryTesting || !cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {cloudinaryTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Cloudinary Ping</span>
              </button>

              <button
                type="submit"
                disabled={cloudinarySaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {cloudinarySaving ? 'Saving...' : 'Save Cloudinary Credentials'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
