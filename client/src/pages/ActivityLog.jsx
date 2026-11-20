import React, { useState, useEffect } from 'react';
import { activityApi } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import {
  History,
  FolderKanban,
  Bookmark,
  Image,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getAll({ entityType: entityFilter || undefined });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activity Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable audit record of all campaign creations, schedule bookings and publications
          </p>
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 self-start sm:self-auto"
        >
          <option value="">All Entities</option>
          <option value="campaign">Campaigns</option>
          <option value="pin">Pins</option>
          <option value="board">Boards</option>
          <option value="api_config">API Settings</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading activity trail...</div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity recorded yet"
          description="Actions like creating campaigns, reserving slots and marking pins published will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log._id} className="p-4 sm:p-5 flex items-start space-x-3.5 hover:bg-slate-50/60 transition">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                {log.entityType === 'campaign' ? (
                  <FolderKanban className="w-4 h-4 text-rose-600" />
                ) : log.entityType === 'pin' ? (
                  <Image className="w-4 h-4 text-indigo-600" />
                ) : log.entityType === 'board' ? (
                  <Bookmark className="w-4 h-4 text-emerald-600" />
                ) : (
                  <History className="w-4 h-4 text-slate-500" />
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 capitalize">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                {log.metadata && (
                  <div className="text-xs text-slate-500 leading-snug">
                    {log.metadata.campaignName && (
                      <p>Campaign: <strong>{log.metadata.campaignName}</strong></p>
                    )}
                    {log.metadata.pinsCount && (
                      <p>Generated: <strong>{log.metadata.pinsCount} Pins</strong></p>
                    )}
                    {log.metadata.firstSlot && (
                      <p className="text-[11px] text-slate-400">
                        First slot: {new Date(log.metadata.firstSlot).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
