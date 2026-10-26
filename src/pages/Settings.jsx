import { useEffect, useRef, useState } from 'react';
import { CircleUser, Building2, Users, Bell, Plug, CreditCard, Camera, Mail, Hash, Briefcase, LayoutGrid, Plus, Check, FileText } from 'lucide-react';
import { getStoredUser, setAuthSession } from '../api/config';
import { fetchMe, updateProfile, setAvatar, removeAvatar } from '../api/auth';
import { getInitials, resizeImageToDataUrl } from '../utils/helpers';
import Avatar from '../components/ui/Avatar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDashboardTotals } from '../store/slices/dashboardSlice';
import { fetchJobs } from '../store/slices/jobsSlice';
import ChangePasswordCard from '../components/auth/ChangePasswordCard';

const settingsNav = [
  { id: 'profile', label: 'Profile Settings', hint: 'Name, email, photo', icon: CircleUser, group: 'ACCOUNT' },
  { id: 'company', label: 'Company Settings', hint: 'Organization details', icon: Building2, group: 'WORKSPACE' },
  { id: 'users', label: 'User Management', hint: 'Members and roles', icon: Users, group: 'WORKSPACE' },
  { id: 'notifications', label: 'Notification Settings', hint: 'Email and in-app', icon: Bell, group: 'WORKSPACE' },
  { id: 'integrations', label: 'Integrations', hint: 'Connected tools', icon: Plug, group: 'WORKSPACE' },
  { id: 'billing', label: 'Billing & Plan', hint: 'Plan, usage, invoices', icon: CreditCard, group: 'WORKSPACE' },
];

const NOTIFICATION_ITEMS = [
  { id: 'screened', label: 'New candidate screened', enabled: true },
  { id: 'shortlisted', label: 'Candidate shortlisted', enabled: true },
  { id: 'published', label: 'Job published', enabled: false },
  { id: 'weekly', label: 'Weekly hiring report', enabled: true },
];
const NOTIFICATION_KEY = 'hireai_notification_prefs';

function loadNotificationPrefs() {
  const defaults = Object.fromEntries(NOTIFICATION_ITEMS.map((i) => [i.id, i.enabled]));
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

const panelClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] overflow-hidden';

function Panel({ title, subtitle, children, footer }) {
  return (
    <section className={panelClass}>
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
      {footer}
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[210px_minmax(0,1fr)] gap-x-6 gap-y-2 px-6 py-4 border-b border-slate-100 last:border-b-0 sm:items-center">
      <div>
        <p className="text-[13px] font-semibold text-slate-900">{label}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const storedUser = getStoredUser();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: storedUser?.name || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
  });
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [companyName, setCompanyName] = useState(storedUser?.company || '');
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(loadNotificationPrefs);
  const [account, setAccount] = useState(storedUser);
  const dispatch = useAppDispatch();
  const totals = useAppSelector((st) => st.dashboard.totals);
  const jobs = useAppSelector((st) => st.jobs.items);

  // usage figures for the Billing tab come from data the dashboard already loads
  useEffect(() => {
    dispatch(fetchDashboardTotals());
    dispatch(fetchJobs());
  }, [dispatch]);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setAccount(u);
        setProfile((p) => ({ ...p, name: u.name || p.name, phone: u.phone || '' }));
        setAuthSession({ user: u });
      })
      .catch(() => {});
  }, []);

  const savedName = account?.name || '';
  const savedPhone = account?.phone || '';
  // No phone on file: the field is open for entry. With one on file it's locked until "Edit".
  const phoneEditable = !savedPhone || editingPhone;
  const nameChanged = editingName && profile.name.trim() !== savedName;
  const phoneChanged = phoneEditable && profile.phone.trim() !== savedPhone;
  const dirty = nameChanged || phoneChanged;

  const toggleNotification = (id) => {
    setNotifications((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable: the switch still works for this visit
      }
      return next;
    });
  };

  const handleCancel = () => {
    setProfile((p) => ({ ...p, name: savedName, phone: savedPhone }));
    setEditingName(false);
    setEditingPhone(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    if (nameChanged && profile.name.trim().length < 2) {
      setSaveError('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      if (nameChanged) payload.name = profile.name.trim();
      if (phoneChanged) payload.phone = profile.phone.trim();
      const user = await updateProfile(payload);
      setAccount(user);
      setProfile((p) => ({ ...p, name: user.name, phone: user.phone || '' }));
      setEditingName(false);
      setEditingPhone(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const image = await resizeImageToDataUrl(file);
      setAccount(await setAvatar(image));
    } catch (err) {
      setPhotoError(err.message || 'Could not update your picture');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoError('');
    setPhotoBusy(true);
    try {
      setAccount(await removeAvatar());
    } catch (err) {
      setPhotoError(err.message || 'Could not remove your picture');
    } finally {
      setPhotoBusy(false);
    }
  };

  const lockedClass = 'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';
  const editLink = 'text-xs font-semibold text-indigo-600 hover:text-indigo-700 shrink-0';
  const inputClass =
    'w-full h-10 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.03)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400';
  const outlineBtn =
    'inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-[0_1px_2px_rgba(18,18,28,0.04)] disabled:opacity-60';
  const primaryBtn =
    'inline-flex items-center justify-center h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]';

  const displayName = account?.name || profile.name;
  const role = account?.role || 'Admin';
  const photoInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={handlePhotoPick}
      className="hidden"
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Settings</h1>
        <p className="text-sm text-slate-500 mt-2.5">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <nav className="w-full lg:w-[188px] shrink-0 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {settingsNav.map(({ id, label, hint, icon: Icon, group }, i) => (
            <div key={id} className="contents lg:block">
              {(i === 0 || settingsNav[i - 1].group !== group) && (
                <p className={`hidden lg:block font-mono text-[9px] tracking-wider text-slate-400 px-2.5 mb-1.5 ${i === 0 ? '' : 'mt-5'}`}>{group}</p>
              )}
              <button
                onClick={() => setActiveSection(id)}
                className={`w-full min-w-max lg:min-w-0 flex items-start gap-2.5 text-left px-2.5 py-2 rounded-xl border transition-colors ${
                  activeSection === id
                    ? 'bg-white border-slate-200/80 shadow-[0_1px_2px_rgba(18,18,28,0.06)]'
                    : 'border-transparent hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activeSection === id ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={1.8} />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold text-slate-900">{label}</span>
                  <span className="hidden lg:block text-[10.5px] text-slate-500 mt-0.5">{hint}</span>
                </span>
              </button>
            </div>
          ))}
        </nav>

        <div className="flex-1 min-w-0 w-full space-y-5">
          {activeSection === 'profile' && (
            <>
              {photoInput}
              <section className={panelClass}>
                <div
                  className="h-[70px]"
                  style={{
                    background:
                      'radial-gradient(rgba(107,71,230,0.14) 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(180deg, #EEEAFD 0%, #F4F1FE 100%)',
                  }}
                />
                <div className="flex flex-wrap items-end justify-between gap-3 px-6 pb-5">
                  <div className="flex items-end gap-4 min-w-0">
                    <div className="-mt-9 w-[58px] h-[58px] rounded-2xl border-[3px] border-white shadow-[0_6px_16px_-6px_rgba(107,71,230,0.6)] overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
                      {account?.avatar ? (
                        <img src={account.avatar} alt={displayName || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold">{getInitials(displayName)}</span>
                      )}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      <p className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-slate-900 truncate">{displayName}</span>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded-md px-1.5 py-0.5">{role}</span>
                      </p>
                      <p className="text-[11.5px] text-slate-500 mt-1 truncate">
                        {profile.email}{account?.company ? ` · ${account.company}` : ''}
                      </p>
                    </div>
                  </div>
                  <button type="button" disabled={photoBusy} onClick={() => fileInputRef.current?.click()} className={outlineBtn}>
                    <Camera className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} /> {account?.avatar ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              </section>

              <Panel
                title="Profile Settings"
                subtitle="Update your profile information."
                footer={
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    {saveError && <p className="text-sm text-red-600 mb-3">{saveError}</p>}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                      {(editingName || editingPhone || (!savedPhone && profile.phone)) && (
                        <button type="button" onClick={handleCancel} className={outlineBtn}>Cancel</button>
                      )}
                      <button onClick={handleSave} disabled={!dirty || saving} className={primaryBtn}>
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                }
              >
                <Row label="Full Name" hint="Shown to teammates">
                  <div className="flex items-center gap-3 max-w-sm">
                    <input
                      value={profile.name}
                      disabled={!editingName}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={`${inputClass} ${lockedClass}`}
                    />
                    {!editingName && (
                      <button type="button" onClick={() => setEditingName(true)} className={editLink}>Edit</button>
                    )}
                  </div>
                </Row>
                <Row label="Work Email" hint="Used for sign-in and alerts">
                  <div className="relative max-w-sm">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                    <input value={profile.email} disabled readOnly className={`${inputClass} ${lockedClass} pl-9`} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Your email is your login and can&apos;t be changed.</p>
                </Row>
                <Row label="Phone Number" hint="Optional">
                  <div className="flex items-center gap-3 max-w-sm">
                    <input
                      type="tel"
                      value={profile.phone}
                      disabled={!phoneEditable}
                      placeholder="e.g. 9876543210"
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className={`${inputClass} ${lockedClass}`}
                    />
                    {savedPhone && !editingPhone && (
                      <button type="button" onClick={() => setEditingPhone(true)} className={editLink}>Edit</button>
                    )}
                  </div>
                  {!savedPhone && (
                    <p className="text-[11px] text-amber-600 mt-1.5">Please add your phone number.</p>
                  )}
                </Row>
                <Row label="Profile Picture" hint="PNG or JPG, at least 256px">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar
                      name={displayName}
                      src={account?.avatar}
                      size="w-10 h-10"
                      textClass="text-sm"
                      tone="bg-indigo-50 text-indigo-700"
                    />
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:opacity-60"
                    >
                      {photoBusy ? 'Saving...' : account?.avatar ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {account?.avatar && (
                      <button
                        type="button"
                        disabled={photoBusy}
                        onClick={handlePhotoRemove}
                        className="h-8 px-2 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
                </Row>
              </Panel>

              <ChangePasswordCard />
            </>
          )}

          {activeSection === 'company' && (
            <Panel
              title="Company Settings"
              subtitle="Details used across job postings and candidate communication."
              footer={
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex sm:justify-end">
                  <button onClick={handleSave} className={primaryBtn}>Save Changes</button>
                </div>
              }
            >
              <Row label="Company Name">
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={`${inputClass} max-w-sm`} />
              </Row>
              <Row label="Client ID">
                <input value={storedUser?.client_id || '—'} readOnly className={`${inputClass} max-w-sm bg-slate-50 text-slate-500`} />
              </Row>
            </Panel>
          )}

          {activeSection === 'users' && (
            <Panel title="User Management" subtitle="Members and roles in your workspace.">
              <div className="p-6 space-y-3">
                {(storedUser
                  ? [{ name: storedUser.name, email: storedUser.email, role: 'Admin' }]
                  : []
                ).map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-700">{getInitials(user.name)}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-medium text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">{user.role}</span>
                  </div>
                ))}
                {!storedUser && (
                  <p className="text-sm text-slate-400 py-4 text-center">Sign in to view account users.</p>
                )}
              </div>
            </Panel>
          )}

          {activeSection === 'notifications' && (
            <Panel title="Notification Settings" subtitle="Choose what you hear about.">
              {NOTIFICATION_ITEMS.map((item) => {
                const on = notifications[item.id];
                return (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-b-0">
                    <p className="text-[13px] font-medium text-slate-800">{item.label}</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={item.label}
                      onClick={() => toggleNotification(item.id)}
                      className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </Panel>
          )}

          {activeSection === 'integrations' && (
            <section>
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Integrations</h2>
              <p className="text-xs text-slate-500 mt-1">Connect the tools your hiring team already uses.</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {[
                  { name: 'Gmail', kind: 'Email', icon: Mail, desc: 'Import resumes from application emails automatically.' },
                  { name: 'Outlook', kind: 'Email & calendar', icon: LayoutGrid, desc: 'Sync interview slots and candidate emails.' },
                  { name: 'Slack', kind: 'Messaging', icon: Hash, desc: 'Post shortlist and review alerts to a channel.' },
                  { name: 'LinkedIn Jobs', kind: 'Job board', icon: Briefcase, desc: 'Publish jobs and pull applicants into screening.' },
                ].map(({ name, kind, icon: Icon, desc }) => {
                  const connected = false; // no integration status exists yet; the button stays a placeholder as before
                  return (
                    <div key={name} className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-700" strokeWidth={1.8} />
                        </span>
                        <span className="leading-tight min-w-0">
                          <span className="block text-[13px] font-semibold text-slate-900 truncate">{name}</span>
                          <span className="block text-[10.5px] text-slate-500 mt-0.5">{kind}</span>
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed mt-3.5 mb-4 flex-1">{desc}</p>
                      {connected ? (
                        <span className="self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.2} /> Connected
                        </span>
                      ) : (
                        <button className={`${outlineBtn} self-start h-8 px-3`}>
                          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeSection === 'billing' && (
            <>
              <section
                className="rounded-2xl p-6 text-white flex flex-wrap items-start justify-between gap-4"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(129,104,238,0.45), transparent 55%), #170F3A' }}
              >
                <div>
                  <p className="font-mono text-[9.5px] tracking-wider text-indigo-300">CURRENT PLAN</p>
                  <p className="mt-3 text-[22px] font-bold tracking-tight leading-none">{account?.plan || '—'}</p>
                  <p className="mt-2.5 text-xs text-indigo-200">
                    Status:{' '}
                    <span className={String(account?.plan_status).toLowerCase() === 'active' ? 'text-emerald-300 font-medium' : 'font-medium'}>
                      {account?.plan_status || '—'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-9 px-3.5 rounded-xl bg-white/10 border border-white/15 text-xs font-medium hover:bg-white/15">Manage payment</button>
                  <button className="h-9 px-3.5 rounded-xl bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100">Upgrade plan</button>
                </div>
              </section>

              <section>
                <h2 className="text-[14px] font-semibold tracking-tight text-slate-900">Usage</h2>
                <p className="text-[11px] text-slate-500 mt-1">Totals to date against your plan limits.</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    { label: 'Resumes screened', icon: FileText, used: totals?.candidatesScreened ?? 0, limit: 500 },
                    { label: 'Active jobs', icon: Briefcase, used: (jobs || []).filter((j) => j.status === 'Published').length, limit: 25 },
                    { label: 'Team seats', icon: Users, used: storedUser ? 1 : 0, limit: 5 },
                  ].map(({ label, icon: Icon, used, limit }) => {
                    const pct = Math.min(100, (used / limit) * 100);
                    return (
                      <div key={label} className={`${panelClass} p-5`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.8} />
                          </span>
                          <span className="text-xs font-medium text-slate-600">{label}</span>
                        </div>
                        <p className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-[28px] font-bold tracking-tight tabular-nums text-slate-900 leading-none">{used}</span>
                          <span className="text-xs text-slate-500">of {limit}</span>
                        </p>
                        <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-2 font-mono text-[10.5px] text-slate-500">{Math.round(pct)}% used</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
