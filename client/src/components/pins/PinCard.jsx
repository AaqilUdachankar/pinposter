import React from 'react';
import StatusBadge from '../common/StatusBadge';
import {
  ExternalLink,
  Edit3,
  Download,
  Share2,
  Calendar,
  Bookmark,
  MoreVertical,
} from 'lucide-react';

export default function PinCard({
  pin,
  onOpenHandoff,
  onOpenEdit,
  selected = false,
  onToggleSelect,
}) {
  const isReady = pin.status === 'ready_to_publish';

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = pin.imageUrl;
    link.download = `pinposter-${pin.conceptIndex}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
        selected ? 'ring-2 ring-rose-500 border-rose-300' : 'border-slate-200/80 hover:shadow-soft-md'
      }`}
    >
      {/* Top Image Container (Pinterest 9:16 vertical ratio 1080x1920) */}
      <div className="relative aspect-[9/16] w-full bg-slate-100 overflow-hidden">
        <img
          src={pin.imageUrl}
          alt={pin.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Concept Index Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tracking-tight">
          #{pin.conceptIndex} {pin.conceptName}
        </div>

        {/* Select Checkbox (if multi-select enabled) */}
        {onToggleSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(pin._id);
            }}
            className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center transition ${
              selected
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white/80 text-transparent hover:text-slate-400 opacity-0 group-hover:opacity-100'
            }`}
          >
            ✓
          </button>
        )}

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
          <button
            onClick={() => onOpenHandoff(pin)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Publish Assets</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs shadow-sm transition"
              title="Download image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenEdit(pin)}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs shadow-sm transition"
              title="Edit Pin"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pin Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <StatusBadge status={pin.status} />
            <span className="text-[11px] text-slate-400 flex items-center space-x-1 truncate max-w-[120px]">
              <Bookmark className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="truncate">{pin.boardId?.name || 'Board'}</span>
            </span>
          </div>

          <h4
            onClick={() => onOpenHandoff(pin)}
            className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 hover:text-rose-600 cursor-pointer transition"
          >
            {pin.title}
          </h4>

          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {pin.description}
          </p>
        </div>

        {/* Card Footer: Scheduled Time & CTAs */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1 truncate">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              {pin.scheduledAt
                ? new Date(pin.scheduledAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Not scheduled'}
            </span>
          </div>

          <button
            onClick={() => onOpenHandoff(pin)}
            className={`font-semibold text-xs transition ${
              isReady ? 'text-rose-600 hover:text-rose-700 underline' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isReady ? 'Ready &rarr;' : 'Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
