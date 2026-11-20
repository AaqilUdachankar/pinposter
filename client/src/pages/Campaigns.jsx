import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi, boardsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import {
  FolderKanban,
  PlusCircle,
  Calendar,
  Layers,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Search,
  Bookmark,
} from 'lucide-react';

export default function Campaigns() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const [campRes, boardsRes] = await Promise.all([
        campaignsApi.getAll({
          status: statusFilter || undefined,
          boardId: boardFilter || undefined,
        }),
        boardsApi.getAll(),
      ]);

      if (campRes.data.success) {
        setCampaigns(campRes.data.campaigns || []);
      }
      if (boardsRes.data.success) {
        setBoards(boardsRes.data.boards || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, boardFilter]);

  const handleDelete = async (campaignId, campaignName) => {
    if (!window.confirm(`Are you sure you want to delete "${campaignName}"? All 10 reserved slots will be safely released.`)) {
      return;
    }

    try {
      const res = await campaignsApi.delete(campaignId);
      if (res.data.success) {
        toast.success('Campaign and scheduled slots removed');
        setCampaigns(campaigns.filter((c) => c._id !== campaignId));
      }
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (!search) return true;
    return (
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.productId?.title?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your 10-Pin affiliate marketing campaigns and scheduling batches
          </p>
        </div>

        <Link
          to="/create"
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Campaign</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Boards</option>
          {boards.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="generating">Generating</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaigns Table / Cards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No campaigns found"
          description="Create your first campaign by pasting an affiliate link to generate 10 scheduled Pins."
          actionText="Create Campaign"
          actionLink="/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <StatusBadge status={camp.status} />
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <Link
                  to={`/campaigns/${camp._id}`}
                  className="font-bold text-sm text-slate-900 hover:text-rose-600 transition block line-clamp-1"
                >
                  {camp.name}
                </Link>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {camp.productId?.title || 'Product item'}
                </p>

                <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-500">
                  <Bookmark className="w-3.5 h-3.5 text-rose-500" />
                  <span className="truncate">{camp.boardId?.name || 'General Board'}</span>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-semibold text-slate-700">10 Pins</span>
                  <span className="text-emerald-600 font-medium">
                    {camp.publishedPinsCount || 0} published
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(camp._id, camp.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/campaigns/${camp._id}`}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    View 10 Pins &rarr;
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
