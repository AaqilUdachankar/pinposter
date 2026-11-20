import React, { useState, useEffect } from 'react';
import { boardsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import {
  Bookmark,
  Plus,
  Edit2,
  Trash2,
  Star,
  Layers,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function Boards() {
  const toast = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lifestyle');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await boardsApi.getAll();
      if (res.data.success) {
        setBoards(res.data.boards || []);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleOpenCreate = () => {
    setEditingBoard(null);
    setName('');
    setDescription('');
    setCategory('Lifestyle');
    setIsDefault(boards.length === 0);
    setShowModal(true);
  };

  const handleOpenEdit = (board) => {
    setEditingBoard(board);
    setName(board.name);
    setDescription(board.description || '');
    setCategory(board.category || 'General');
    setIsDefault(board.isDefault || false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        isDefault,
      };

      if (editingBoard) {
        const res = await boardsApi.update(editingBoard._id, payload);
        if (res.data.success) toast.success('Board updated successfully');
      } else {
        const res = await boardsApi.create(payload);
        if (res.data.success) toast.success('Board created successfully');
      }

      setShowModal(false);
      fetchBoards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (board) => {
    if (!window.confirm(`Are you sure you want to delete board "${board.name}"?`)) return;

    try {
      const res = await boardsApi.delete(board._id);
      if (res.data.success) {
        toast.success('Board deleted successfully');
        fetchBoards();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete board');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pinterest Boards</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manually maintained reference boards to organize your 10-Pin campaign batches
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Board</span>
        </button>
      </div>

      {/* Manual Synchronisation Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs text-slate-700 space-y-1">
        <p className="font-semibold text-slate-900">Manual Board Architecture:</p>
        <p className="text-slate-600 leading-relaxed">
          PinPoster strictly respects Pinterest platform rules and does NOT access Pinterest APIs or account credentials. Boards listed here are reference profiles that match your boards on Pinterest so you can select where each campaign should be organized.
        </p>
      </div>

      {/* Boards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading boards...</div>
      ) : boards.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No boards configured yet"
          description="Create your first board reference (e.g. 'Must-Have Tech', 'Home Aesthetic') to organize campaign Pins."
          actionText="Add Board"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <div
              key={board._id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft hover:shadow-soft-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {board.category || 'General'}
                  </span>

                  {board.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-rose-600" />
                      <span>Default Board</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">{board.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {board.description || 'No description provided.'}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{board.pinCount || 0} Pins</span>
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(board)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Edit Board"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(board)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Board"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Board Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingBoard ? 'Edit Board' : 'Add Pinterest Board'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Board Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Best Kitchen Gadgets 2026"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Lifestyle, Home, Tech, Beauty"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summary of products saved to this board..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="isDefault" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Set as default board for new campaigns
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingBoard ? 'Update Board' : 'Create Board'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
