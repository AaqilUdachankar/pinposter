import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 max-w-lg mx-auto">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {(actionText && actionLink) && (
        <div className="mt-5">
          <Link
            to={actionLink}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-sm transition"
          >
            {actionText}
          </Link>
        </div>
      )}

      {(actionText && onAction) && (
        <div className="mt-5">
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-sm transition"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}
