import React, { useState, useEffect } from 'react';
import { pinsApi, boardsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  X,
  RefreshCw,
  Copy,
  Calendar,
  Save,
  Pause,
  Play,
  Trash2,
  Bookmark,
  ExternalLink,
} from 'lucide-react';

export default function PinEditModal({ pin, isOpen, onClose, onUpdated }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [boardId, setBoardId] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [boards, setBoards] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (pin) {
      setTitle(pin.title || '');
      setDescription(pin.description || '');
      setKeywords(pin.keywords?.join(', ') || '');
      setDestinationUrl(pin.destinationUrl || '');
      setBoardId(pin.boardId?._id || pin.boardId || '');
      setNotes(pin.notes || '');
      if (pin.scheduledAt) {
        // Format for datetime-local input
        const d = new Date(pin.scheduledAt);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setScheduledAt(iso);
      }
    }
  }, [pin]);

  useEffect(() => {
    if (isOpen) {
      boardsApi.getAll().then((res) => {
        if (res.data.success) setBoards(res.data.boards || []);
      });
    }
  }, [isOpen]);

  if (!isOpen || !pin) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await pinsApi.update(pin._id, {
        title,
        description,
        keywords: parsedKeywords,
        destinationUrl,
        boardId,
        notes,
      });

      if (res.data.success) {
        toast.success('Pin details updated successfully');
        if (onUpdated) onUpdated(res.data.pin);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Pin updates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateImage = async () => {
    setIsRegenerating(true);
    try {
      const res = await pinsApi.regenerateImage(pin._id);
      if (res.data.success) {
        toast.success('Pin image regenerated successfully!');
        if (onUpdated) onUpdated(res.data.pin);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate image');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReschedule = async () => {
    if (!scheduledAt) return;
    try {
      const res = await pinsApi.reschedule(pin._id, new Date(scheduledAt).toISOString());
      if (res.data.success) {
        toast.success('Pin rescheduled successfully!');
        if (onUpdated) onUpdated(res.data.pin);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule Pin');
    }
  };

  const handleTogglePause = async () => {
    try {
      const isPaused = pin.status === 'paused';
      const res = isPaused
        ? await pinsApi.resume(pin._id)
        : await pinsApi.pause(pin._id);
      
      if (res.data.success) {
        toast.success(isPaused ? 'Pin resumed!' : 'Pin paused!');
        if (onUpdated) onUpdated(res.data.pin);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change pin state');
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await pinsApi.duplicate(pin._id);
      if (res.data.success) {
        toast.success('Pin duplicated!');
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      toast.error('Failed to duplicate Pin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Pin #{pin.conceptIndex}</h3>
              <p className="text-xs text-slate-500">{pin.conceptName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Image Preview & Regenerate */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-full aspect-[9/16] max-w-[200px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <img src={pin.imageUrl} alt={pin.title} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateImage}
                  disabled={isRegenerating}
                  className="mt-3 w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? 'Synthesizing...' : 'Regenerate Image'}</span>
                </button>
              </div>

              {/* Editable Fields */}
              <div className="md:col-span-8 space-y-3">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pin Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    maxLength={800}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Board Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pinterest Reference Board</label>
                  <select
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    {boards.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Affiliate URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliate Destination URL</label>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Keywords (comma separated) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. gift ideas, home decor, best gadgets"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Reschedule Slot */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Time (Hourly Slot)</label>
                  <div className="flex space-x-2">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleReschedule}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
                >
                  {pin.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{pin.status === 'paused' ? 'Resume Pin' : 'Pause Pin'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
