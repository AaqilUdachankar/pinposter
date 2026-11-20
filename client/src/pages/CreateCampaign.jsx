import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, campaignsApi, boardsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Link2,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Edit2,
  ShieldCheck,
} from 'lucide-react';

const GENERATION_STEPS = [
  { key: 'extracting', label: 'Extracting product information & images' },
  { key: 'analyzing', label: 'Analyzing product details with AI' },
  { key: 'generating_concepts', label: 'Generating 10 unique Pinterest concepts' },
  { key: 'generating_images', label: 'Synthesizing 10 vertical creative images (1080x1920)' },
  { key: 'reserving_slots', label: 'Reserving 10 consecutive hourly slots in global queue' },
  { key: 'completed', label: 'Campaign generated and scheduled successfully' },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const toast = useToast();

  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [boardId, setBoardId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [boards, setBoards] = useState([]);

  // Product extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Manual editable fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualCategory, setManualCategory] = useState('Lifestyle');
  const [manualImages, setManualImages] = useState([]);

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [campaignId, setCampaignId] = useState(null);

  // Load Boards
  useEffect(() => {
    async function loadBoards() {
      try {
        const res = await boardsApi.getAll();
        if (res.data.success && res.data.boards) {
          setBoards(res.data.boards);
          const defaultBoard = res.data.boards.find((b) => b.isDefault);
          if (defaultBoard) setBoardId(defaultBoard._id);
          else if (res.data.boards.length > 0) setBoardId(res.data.boards[0]._id);
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
      }
    }
    loadBoards();
  }, []);

  // Poll generation job progress
  useEffect(() => {
    let timer;
    if (isGenerating && campaignId) {
      timer = setInterval(async () => {
        try {
          const res = await campaignsApi.getJob(campaignId);
          if (res.data.success && res.data.job) {
            setActiveJob(res.data.job);

            if (res.data.job.status === 'completed') {
              clearInterval(timer);
              setIsGenerating(false);
              toast.success('10 Pins generated and hourly slots reserved!');
              setTimeout(() => {
                navigate(`/campaigns/${campaignId}`);
              }, 1200);
            } else if (res.data.job.status === 'failed') {
              clearInterval(timer);
              setIsGenerating(false);
              toast.error(res.data.job.error || 'Campaign generation failed');
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isGenerating, campaignId, navigate, toast]);

  // Extract Metadata from URL
  const handleExtractMetadata = async () => {
    if (!affiliateUrl) {
      toast.error('Please enter a product affiliate URL');
      return;
    }

    setIsExtracting(true);
    setExtractedData(null);
    try {
      const res = await productsApi.extract(affiliateUrl);
      if (res.data.success) {
        const data = res.data.data;
        setExtractedData(data);
        setManualTitle(data.title || '');
        setManualDescription(data.description || '');
        setManualPrice(data.price || '');
        setManualBrand(data.brand || '');
        setManualCategory(data.category || 'General');
        setManualImages(data.images || []);
        if (!campaignName) {
          setCampaignName(data.title?.slice(0, 35) || 'New Affiliate Campaign');
        }
        toast.success('Product details extracted successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not auto-extract product. You can input details manually.');
      setShowManualEdit(true);
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit and start automated generation
  const handleStartGeneration = async (e) => {
    e.preventDefault();
    if (!affiliateUrl) {
      toast.error('Please enter an affiliate URL');
      return;
    }
    if (!boardId) {
      toast.error('Please select a Pinterest reference board');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        affiliateUrl,
        boardId,
        campaignName: campaignName || 'Affiliate Campaign',
        manualProductDetails: {
          title: manualTitle || extractedData?.title || 'Affiliate Product',
          description: manualDescription || extractedData?.description || '',
          price: manualPrice || extractedData?.price || '',
          brand: manualBrand || extractedData?.brand || '',
          category: manualCategory || extractedData?.category || 'General',
          images: manualImages.length > 0 ? manualImages : extractedData?.images || [],
        },
      };

      const res = await campaignsApi.create(payload);
      if (res.data.success) {
        setCampaignId(res.data.campaign._id);
        toast.info('Generation started! Processing 10 creative pins...');
      }
    } catch (err) {
      setIsGenerating(false);
      toast.error(err.response?.data?.message || 'Failed to start campaign generation');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Create Campaign</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold uppercase">
            10 Pins Auto-Pilot
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Paste your affiliate link below. PinPoster automatically creates 10 unique visual concepts, SEO descriptions, and schedules consecutive hourly slots.
        </p>
      </div>

      {/* Main Campaign Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-8 space-y-6">
        
        {/* Step 1: Paste URL Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Paste your affiliate product URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-5 h-5 text-rose-500" />
              </div>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://amazon.com/dp/B08...?tag=youraffiliate-20 or any store link"
                disabled={isGenerating}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono transition"
              />
            </div>
            <button
              type="button"
              onClick={handleExtractMetadata}
              disabled={isExtracting || isGenerating || !affiliateUrl}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50 shrink-0"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Extract Details</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Original affiliate tag preserved strictly. Protected against SSRF and unauthorized redirect manipulation.</span>
          </div>
        </div>

        {/* Extracted Product Preview Card (if extracted) */}
        {extractedData && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex space-x-3">
                {extractedData.images?.[0] ? (
                  <img
                    src={extractedData.images[0]}
                    alt="Product"
                    className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                    ★
                  </div>
                )}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {manualTitle || extractedData.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                    {extractedData.price && (
                      <span className="font-semibold text-rose-600">
                        {extractedData.currency || '$'}{extractedData.price}
                      </span>
                    )}
                    {extractedData.brand && <span>Brand: {extractedData.brand}</span>}
                    <span>{extractedData.images?.length || 0} images found</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManualEdit(!showManualEdit)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{showManualEdit ? 'Hide Edit' : 'Edit Details'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Manual Product Details Accordion */}
        {showManualEdit && (
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Customize Extracted Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Product Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mt-0.5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Price</label>
                <input
                  type="text"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Brand</label>
                <input
                  type="text"
                  value={manualBrand}
                  onChange={(e) => setManualBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mt-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Board Selection & Campaign Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Board Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Pinterest Board
              </label>
              <button
                type="button"
                onClick={() => navigate('/boards')}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Board</span>
              </button>
            </div>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} {b.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              These are manually maintained references to your Pinterest boards.
            </p>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Campaign Name (Optional)
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Ergonomic Office Desk — Fall 2026"
              disabled={isGenerating}
              className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

        </div>

        {/* Dynamic Progress Indicator (When Generating) */}
        {isGenerating && (
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
                <span className="text-sm font-bold text-white">
                  Autonomous Generation In Progress ({activeJob?.progress || 10}%)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">10 Pins</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-rose-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeJob?.progress || 10}%` }}
              />
            </div>

            {/* Step Checklists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {GENERATION_STEPS.map((step, idx) => {
                const isCurrent = activeJob?.currentStep === step.key;
                const isPassed = (activeJob?.progress || 0) > (idx + 1) * 16;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center space-x-2 text-xs p-2 rounded-xl border ${
                      isCurrent
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-200 font-medium'
                        : isPassed
                        ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-rose-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 italic text-center pt-2">
              You can safely leave this page anytime. The job persists in MongoDB and will auto-schedule all 10 pins.
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!isGenerating && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 hidden sm:block">
              Generates exactly <strong>10 unique Pins</strong> with vertical images and schedules consecutive 1-hour slots.
            </div>

            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating || !affiliateUrl || !boardId}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-200 hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 10 Pins &amp; Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
