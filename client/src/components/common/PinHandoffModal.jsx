import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { pinsApi, feedApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from './StatusBadge';
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Tag,
  Bookmark,
  Share2,
  Zap,
} from 'lucide-react';

export default function PinHandoffModal({ pin, isOpen, onClose, onUpdated }) {
  const toast = useToast();
  const [copiedField, setCopiedField] = useState(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatchingMake, setIsDispatchingMake] = useState(false);

  if (!isOpen || !pin) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = pin.imageUrl;
    link.download = `pinposter-${pin.conceptIndex}-${pin.title.slice(0, 20)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Downloading Pinterest image...');
  };

  const handleDispatchMake = async () => {
    setIsDispatchingMake(true);
    try {
      const res = await feedApi.dispatchPinToMake(pin._id);
      if (res.data.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        toast.success(res.data.message || 'Pin dispatched to Make.com successfully!');
        if (onUpdated) onUpdated(res.data.pin);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch to Make.com. Make sure your webhook URL is configured in Auto-Publish.');
    } finally {
      setIsDispatchingMake(false);
    }
  };

  const handleConfirmPublished = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await pinsApi.publish(pin._id, {
        publishedPinUrl: publishedUrl,
        notes,
      });

      if (res.data.success) {
        // Fire celebration confetti!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });

        toast.success('Pin successfully marked as published!');
        if (onUpdated) onUpdated(res.data.pin);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pin status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                #{pin.conceptIndex}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{pin.conceptName}</h3>
                <p className="text-xs text-slate-500">Publishing Workspace &amp; Asset Handoff</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={pin.status} />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
            {/* Left: Creative Image Preview & Download */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative group w-full aspect-[9/16] max-w-[280px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={handleDownloadImage}
                    className="px-4 py-2 bg-white text-slate-900 font-semibold text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download (1080x1920)</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col w-full max-w-[280px] space-y-2">
                <button
                  onClick={handleDownloadImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pin Creative</span>
                </button>

                <a
                  href="https://www.pinterest.com/pin-builder/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                >
                  <span>Open Pinterest Pin Builder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleDispatchMake}
                  disabled={isDispatchingMake}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isDispatchingMake ? 'animate-bounce' : ''}`} />
                  <span>{isDispatchingMake ? 'Sending to Make.com...' : 'Publish via Make.com Now'}</span>
                </button>
              </div>
            </div>

            {/* Right: Quick Copy Asset Workspace */}
            <div className="md:col-span-7 flex flex-col space-y-4">
              
              {/* Target Board Reference */}
              <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-rose-600" />
                  <span>Pinterest Board: <strong>{pin.boardId?.name || 'General Board'}</strong></span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{pin.scheduledAt ? new Date(pin.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}</span>
                </div>
              </div>

              {/* Title Field + Copy */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Pin Title (SEO Optimized)</label>
                  <button
                    onClick={() => copyToClipboard(pin.title, 'Title')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
                  >
                    {copiedField === 'Title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Title' ? 'Copied' : 'Copy Title'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 leading-relaxed">
                  {pin.title}
                </div>
              </div>

              {/* Description Field + Copy */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Description (With Disclosure)</label>
                  <button
                    onClick={() => copyToClipboard(pin.description, 'Description')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
                  >
                    {copiedField === 'Description' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Description' ? 'Copied' : 'Copy Description'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                  {pin.description}
                </div>
              </div>

              {/* Destination Affiliate URL + Copy */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Affiliate Destination Link</label>
                  <button
                    onClick={() => copyToClipboard(pin.destinationUrl, 'Affiliate Link')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
                  >
                    {copiedField === 'Affiliate Link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Affiliate Link' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-600 truncate">
                  {pin.destinationUrl}
                </div>
              </div>

              {/* Mark as Published Confirmation Form */}
              <form onSubmit={handleConfirmPublished} className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Manual Publishing Confirmation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={publishedUrl}
                    onChange={(e) => setPublishedUrl(e.target.value)}
                    placeholder="Pinterest Pin URL (optional)"
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (e.g. published to group board)"
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm shadow-emerald-200 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating status...' : 'Mark as Published on Pinterest'}</span>
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
