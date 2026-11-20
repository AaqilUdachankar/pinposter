import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Image,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Bookmark,
  Rss,
  Zap,
  BarChart3,
  Sliders,
  Bell,
  History,
  UserCog,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS = [
  { group: 'Core', items: [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Create Campaign', path: '/create', icon: PlusCircle, highlight: true },
    { name: 'Campaigns', path: '/campaigns', icon: FolderKanban },
    { name: 'Pin Library', path: '/pins', icon: Image },
  ]},
  { group: 'Publishing Engine', items: [
    { name: 'Pinterest RSS', path: '/pinterest-rss', icon: Rss, badge: 'Native' },
    { name: 'Make.com Automation', path: '/make-automation', icon: Zap, badge: 'Webhook' },
    { name: 'Publishing Queue', path: '/queue', icon: Clock },
    { name: 'Scheduled Pins', path: '/scheduled', icon: CalendarCheck },
    { name: 'Published Pins', path: '/published', icon: CheckCircle2 },
    { name: 'Boards', path: '/boards', icon: Bookmark },
  ]},
  { group: 'Insights & System', items: [
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'API Settings', path: '/settings/api', icon: Sliders },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Activity Log', path: '/activity', icon: History },
    { name: 'Account Settings', path: '/settings/account', icon: UserCog },
  ]},
];

export default function Sidebar({ className = '' }) {
  return (
    <aside className={`w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none ${className}`}>
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center">
              PinPoster
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/60 uppercase">
                SaaS
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium leading-none">Affiliate Pinterest AI</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {NAV_ITEMS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.group}
            </h3>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? item.highlight
                            ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                            : 'bg-rose-50/80 text-rose-700 font-semibold'
                          : item.highlight
                          ? 'text-rose-600 bg-rose-50/50 hover:bg-rose-100/70'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Handoff Reminder Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Manual Publishing</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Zero API credentials or account approval needed. 1-click copy assets to Pinterest.
          </p>
          <a
            href="https://www.pinterest.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <span>Open Pinterest</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </aside>
  );
}
