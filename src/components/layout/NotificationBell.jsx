import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, FileText, X, BellOff,
} from 'lucide-react';
import { getHiringActivity } from '../../api/candidates';
import { getStoredUser } from '../../api/config';
import useClickOutside from '../../hooks/useClickOutside';

const POLL_MS = 30000;
const TOAST_MS = 4000;
const MAX_TOASTS = 3;
const LIST_LIMIT = 30;

const iconMap = { FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, FileText };

const typeColors = {
  screened: 'bg-violet-100 text-violet-600',
  shortlisted: 'bg-blue-100 text-blue-600',
  review: 'bg-indigo-100 text-indigo-600',
  upload: 'bg-emerald-100 text-emerald-600',
  job: 'bg-amber-100 text-amber-600',
  rejected: 'bg-red-100 text-red-600',
};

// The API sends UTC; a value with no timezone marker is treated as UTC.
function toMillis(ts) {
  const raw = String(ts ?? '').trim();
  const ms = new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function timeAgo(ms) {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function readSeenAt(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeSeenAt(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // storage unavailable: unread state just won't persist across reloads
  }
}

function NotificationIcon({ item }) {
  const Icon = iconMap[item.icon] || Bell;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[item.type] || 'bg-slate-100 text-slate-600'}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

/**
 * Bell with unread badge + dropdown list, and pop-up toasts for new activity.
 * Notifications come from the hiring-activity feed: new jobs, resume uploads, screening results, etc.
 */
export default function NotificationBell() {
  const user = getStoredUser();
  const seenKey = `hireai_notif_seen_${user?.client_id || user?.id || 'anon'}`;

  const [items, setItems] = useState([]);
  const [seenAt, setSeenAt] = useState(() => readSeenAt(seenKey));
  const [highlightAfter, setHighlightAfter] = useState(null);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const knownIds = useRef(null); // null until the first load finishes, so history never toasts
  const openRef = useRef(false);
  const wrapRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== id));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await getHiringActivity({ limit: LIST_LIMIT });
      const sorted = [...list].sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
      setItems(sorted);

      if (knownIds.current === null) {
        knownIds.current = new Set(sorted.map((i) => i.id));
        // First ever load on this browser: existing history counts as already read.
        setSeenAt((prev) => {
          if (prev !== null) return prev;
          const now = Date.now();
          writeSeenAt(seenKey, now);
          return now;
        });
        return;
      }

      const fresh = sorted.filter((i) => !knownIds.current.has(i.id));
      fresh.forEach((i) => knownIds.current.add(i.id));
      if (fresh.length && !openRef.current) {
        const added = fresh.slice(0, MAX_TOASTS).map((i) => ({ ...i, toastId: `${i.id}-${Date.now()}` }));
        setToasts((prev) => [...added, ...prev].slice(0, MAX_TOASTS));
        added.forEach((t) => window.setTimeout(() => dismissToast(t.toastId), TOAST_MS));
      }
    } catch {
      // Notifications are best-effort; never disturb the page on a failed poll.
    }
  }, [dismissToast, seenKey]);

  // Poll while the tab is visible, and catch up when it becomes visible again.
  useEffect(() => {
    // Deferred so the first fetch isn't a synchronous setState inside the effect body.
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // Pages fire this after uploads / job changes so the bell reacts immediately, not at the next poll.
  useEffect(() => {
    let t;
    const onChanged = () => {
      window.clearTimeout(t);
      t = window.setTimeout(refresh, 1200);
    };
    window.addEventListener('hireai:activity-changed', onChanged);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hireai:activity-changed', onChanged);
    };
  }, [refresh]);

  const unreadCount = seenAt === null ? 0 : items.filter((i) => toMillis(i.timestamp) > seenAt).length;

  const toggle = () => {
    if (open) {
      setOpen(false);
      openRef.current = false;
      return;
    }
    // Keep this session's unread items highlighted, but mark everything read.
    setHighlightAfter(seenAt);
    const now = Date.now();
    setSeenAt(now);
    writeSeenAt(seenKey, now);
    setToasts([]);
    setOpen(true);
    openRef.current = true;
    refresh();
  };

  const close = useCallback(() => {
    setOpen(false);
    openRef.current = false;
  }, []);
  useClickOutside(wrapRef, close, open);

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={toggle}
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative w-9 h-9 flex items-center justify-center text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-[0_1px_2px_rgba(18,18,28,0.04)] transition-colors"
        >
          <Bell className="w-[17px] h-[17px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <button type="button" onClick={close} className="p-1 text-slate-400 hover:text-slate-600 sm:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-slate-400">
                    <BellOff className="w-7 h-7 mb-2" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const ms = toMillis(item.timestamp);
                      const isNew = highlightAfter !== null && ms > highlightAfter;
                      return (
                        <li key={item.id} className={`flex gap-3 px-4 py-3 ${isNew ? 'bg-indigo-50/60' : ''}`}>
                          <NotificationIcon item={item} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 break-words">{item.description}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{timeAgo(ms)}</p>
                          </div>
                          {isNew && <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-600 shrink-0" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Link
                to="/hiring-activity"
                onClick={close}
                className="block px-4 py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-slate-50 border-t border-slate-100"
              >
                View all activity
              </Link>
            </div>
          </>
        )}
      </div>

      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-80 z-[60] space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.toastId}
              role="status"
              className="pointer-events-auto flex gap-3 items-start bg-white rounded-xl border border-slate-200 shadow-lg p-3"
            >
              <NotificationIcon item={t} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 break-words">{t.description}</p>
              </div>
              <button type="button" onClick={() => dismissToast(t.toastId)} className="p-0.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
