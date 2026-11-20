import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { campaignsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import PinCard from '../components/pins/PinCard';
import PinHandoffModal from '../components/common/PinHandoffModal';
import PinEditModal from '../components/common/PinEditModal';
import {
  ArrowLeft,
  Calendar,
  Bookmark,
  Link2,
  Trash2,
  Sparkles,
  Share2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePinForHandoff, setActivePinForHandoff] = useState(null);
  const [activePinForEdit, setActivePinForEdit] = useState(null);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      const res = await campaignsApi.getById(id);
      if (res.data.success) {
        setCampaign(res.data.campaign);
        setPins(res.data.pins || []);
      }
    } catch (err) {
      toast.error('Campaign not found');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this campaign and all its scheduled pins?')) return;
    try {
      await campaignsApi.delete(id);
      toast.success('Campaign deleted');
      navigate('/campaigns');
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  if (loading || !campaign) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading campaign details...
      </div>
    );
  }

  const publishedCount = pins.filter((p) => p.status === 'published').length;
  const readyCount = pins.filter((p) => p.status === 'ready_to_publish').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/campaigns"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>

        <button
          onClick={handleDelete}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          title="Delete campaign"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Campaign Details Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <StatusBadge status={campaign.status} />
              <span className="text-xs text-slate-400">
                Created on {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {campaign.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Product: <strong className="text-slate-800">{campaign.productId?.title}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pinterest Board</span>
              <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                <Bookmark className="w-3.5 h-3.5 text-rose-500" />
                <span>{campaign.boardId?.name || 'General Board'}</span>
              </span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs">
              <span className="text-rose-500 block text-[10px] uppercase font-semibold">Publishing Status</span>
              <span className="font-bold text-rose-900 flex items-center space-x-1 mt-0.5">
                <span>{publishedCount} of {pins.length} Published</span>
              </span>
            </div>
          </div>
        </div>

        {/* Affiliate Destination Link Info */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <Link2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-slate-500 font-semibold shrink-0">Preserved Destination:</span>
            <span className="font-mono text-slate-700 truncate">{campaign.productId?.originalAffiliateUrl}</span>
          </div>

          <a
            href={campaign.productId?.originalAffiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 hover:text-rose-700 font-semibold underline shrink-0"
          >
            Visit Original Link &rarr;
          </a>
        </div>
      </div>

      {/* 10 Unique Creative Pins Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campaign Pin Creatives (10 Pins)</h2>
            <p className="text-xs text-slate-500">
              Each Pin has a distinct concept angle, SEO title, unique image and consecutive hourly schedule slot
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pins.map((pin) => (
            <PinCard
              key={pin._id}
              pin={pin}
              onOpenHandoff={(p) => setActivePinForHandoff(p)}
              onOpenEdit={(p) => setActivePinForEdit(p)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <PinHandoffModal
        pin={activePinForHandoff}
        isOpen={Boolean(activePinForHandoff)}
        onClose={() => setActivePinForHandoff(null)}
        onUpdated={fetchCampaignDetail}
      />

      <PinEditModal
        pin={activePinForEdit}
        isOpen={Boolean(activePinForEdit)}
        onClose={() => setActivePinForEdit(null)}
        onUpdated={fetchCampaignDetail}
      />

    </div>
  );
}
