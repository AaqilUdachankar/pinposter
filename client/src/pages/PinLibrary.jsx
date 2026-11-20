import React, { useState, useEffect } from 'react';
import { pinsApi, boardsApi, campaignsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import PinCard from '../components/pins/PinCard';
import PinHandoffModal from '../components/common/PinHandoffModal';
import PinEditModal from '../components/common/PinEditModal';
import EmptyState from '../components/common/EmptyState';
import {
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
  Filter,
  CheckSquare,
  Square,
  Pause,
  Play,
  Trash2,
  Bookmark,
  Download,
  Share2,
  Calendar,
} from 'lucide-react';

export default function PinLibrary() {
  const toast = useToast();
  const [pins, setPins] = useState([]);
  const [boards, setBoards] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');

  // Bulk selection
  const [selectedPinIds, setSelectedPinIds] = useState([]);

  // Active modals
  const [activePinForHandoff, setActivePinForHandoff] = useState(null);
  const [activePinForEdit, setActivePinForEdit] = useState(null);

  const fetchPins = async () => {
    try {
      setLoading(true);
      const [pinsRes, boardsRes, campRes] = await Promise.all([
        pinsApi.getAll({
          status: statusFilter || undefined,
          boardId: boardFilter || undefined,
          campaignId: campaignFilter || undefined,
          search: search || undefined,
          limit: 100,
        }),
        boardsApi.getAll(),
        campaignsApi.getAll({ limit: 100 }),
      ]);

      if (pinsRes.data.success) setPins(pinsRes.data.pins || []);
      if (boardsRes.data.success) setBoards(boardsRes.data.boards || []);
      if (campRes.data.success) setCampaigns(campRes.data.campaigns || []);
    } catch (err) {
      console.error('Failed to load pin library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, [statusFilter, boardFilter, campaignFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPins();
  };

  const handleToggleSelect = (id) => {
    if (selectedPinIds.includes(id)) {
      setSelectedPinIds(selectedPinIds.filter((p) => p !== id));
    } else {
      setSelectedPinIds([...selectedPinIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPinIds.length === pins.length) {
      setSelectedPinIds([]);
    } else {
      setSelectedPinIds(pins.map((p) => p._id));
    }
  };

  const handleBulkAction = async (action, targetBoardId = null) => {
    if (selectedPinIds.length === 0) return;
    try {
      const res = await pinsApi.bulk({
        pinIds: selectedPinIds,
        action,
        targetBoardId,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedPinIds([]);
        fetchPins();
      }
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pin Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse, search, edit, and organize all generated creative Pins across every product
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, description or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ready_to_publish">Ready to Publish</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="overdue">Overdue</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Boards</option>
            {boards.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (when pins are selected) */}
      {selectedPinIds.length > 0 && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span>{selectedPinIds.length} Pins Selected</span>
            <button
              onClick={() => setSelectedPinIds([])}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('pause')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs flex items-center space-x-1"
            >
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </button>
            <button
              onClick={() => handleBulkAction('resume')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs flex items-center space-x-1"
            >
              <Play className="w-3 h-3" />
              <span>Resume</span>
            </button>
            <button
              onClick={() => handleBulkAction('cancel')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Pins Render: Grid View vs List View */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading Pins...</div>
      ) : pins.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No pins found"
          description="Create your first campaign to generate 10 unique vertical creative Pins."
          actionText="Create Campaign"
          actionLink="/create"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pins.map((pin) => (
            <PinCard
              key={pin._id}
              pin={pin}
              selected={selectedPinIds.includes(pin._id)}
              onToggleSelect={handleToggleSelect}
              onOpenHandoff={(p) => setActivePinForHandoff(p)}
              onOpenEdit={(p) => setActivePinForEdit(p)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10">
                    <button onClick={handleSelectAll}>
                      {selectedPinIds.length === pins.length ? (
                        <CheckSquare className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Pin Concept</th>
                  <th className="p-3">Title &amp; Product</th>
                  <th className="p-3">Board</th>
                  <th className="p-3">Scheduled Slot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pins.map((pin) => (
                  <tr key={pin._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedPinIds.includes(pin._id)}
                        onChange={() => handleToggleSelect(pin._id)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={pin.imageUrl}
                          alt=""
                          className="w-10 h-14 object-cover rounded-lg bg-slate-100 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">#{pin.conceptIndex}</span>
                          <span className="text-[11px] text-slate-500">{pin.conceptName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{pin.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{pin.productId?.title}</p>
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {pin.boardId?.name || 'General Board'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-600">
                      {pin.scheduledAt
                        ? new Date(pin.scheduledAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Unscheduled'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={pin.status} />
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActivePinForHandoff(pin)}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 font-semibold rounded-lg hover:bg-rose-100 transition mr-2"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => setActivePinForEdit(pin)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PinHandoffModal
        pin={activePinForHandoff}
        isOpen={Boolean(activePinForHandoff)}
        onClose={() => setActivePinForHandoff(null)}
        onUpdated={fetchPins}
      />

      <PinEditModal
        pin={activePinForEdit}
        isOpen={Boolean(activePinForEdit)}
        onClose={() => setActivePinForEdit(null)}
        onUpdated={fetchPins}
      />

    </div>
  );
}
