import { useEffect, useRef, useState } from 'react';
import { User, Building2, Users, Bell, Plug, CreditCard } from 'lucide-react';
import Card from '../components/ui/Card';
import { getStoredUser, setAuthSession } from '../api/config';
import { fetchMe, updateProfile, setAvatar, removeAvatar } from '../api/auth';
import { getInitials, resizeImageToDataUrl } from '../utils/helpers';
import Avatar from '../components/ui/Avatar';
import ChangePasswordCard from '../components/auth/ChangePasswordCard';

const settingsNav = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'company', label: 'Company Settings', icon: Building2 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'notifications', label: 'Notification Settings', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

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
  const [account, setAccount] = useState(storedUser);

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
  const editLink = 'text-xs font-semibold text-indigo-600 hover:text-indigo-700';

  const inputClass = 'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <nav className="space-y-0.5">
            {settingsNav.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeSection === 'profile' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900">Profile Settings</h3>
              <p className="text-sm text-slate-500 mt-0.5 mb-6">Update your profile information.</p>

              <div className="space-y-5 max-w-lg">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                    {!editingName && (
                      <button type="button" onClick={() => setEditingName(true)} className={editLink}>Edit</button>
                    )}
                  </div>
                  <input
                    value={profile.name}
                    disabled={!editingName}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={`${inputClass} ${lockedClass}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
                  <input value={profile.email} disabled readOnly className={`${inputClass} ${lockedClass}`} />
                  <p className="text-xs text-slate-400 mt-1">Your email is your login and can&apos;t be changed.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                    {savedPhone && !editingPhone && (
                      <button type="button" onClick={() => setEditingPhone(true)} className={editLink}>Edit</button>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={profile.phone}
                    disabled={!phoneEditable}
                    placeholder="e.g. 9876543210"
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={`${inputClass} ${lockedClass}`}
                  />
                  {!savedPhone && (
                    <p className="text-xs text-amber-600 mt-1">Please add your phone number.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Picture</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      name={account?.name || profile.name}
                      src={account?.avatar}
                      size="w-16 h-16"
                      textClass="text-base"
                      tone="bg-indigo-100 text-indigo-700"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoPick}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={photoBusy}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-60"
                      >
                        {photoBusy ? 'Saving...' : account?.avatar ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {account?.avatar && (
                        <button
                          type="button"
                          disabled={photoBusy}
                          onClick={handlePhotoRemove}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
                  >
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                  </button>
                  {(editingName || editingPhone || (!savedPhone && profile.phone)) && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'profile' && <ChangePasswordCard />}

          {activeSection === 'company' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-1">Company Settings</h3>
              <p className="text-sm text-slate-500 mb-6">Manage your organization details.</p>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client ID</label>
                  <input value={storedUser?.client_id || '—'} readOnly className={inputClass + ' bg-slate-50 text-slate-500'} />
                </div>
                <button onClick={handleSave} className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold">Save Changes</button>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-4">User Management</h3>
              <div className="space-y-3">
                {(storedUser
                  ? [{ name: storedUser.name, email: storedUser.email, role: 'Admin' }]
                  : []
                ).map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-700">{getInitials(user.name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{user.role}</span>
                  </div>
                ))}
                {!storedUser && (
                  <p className="text-sm text-slate-400 py-4 text-center">Sign in to view account users.</p>
                )}
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-4">Notification Settings</h3>
              <div className="space-y-4 max-w-md">
                {[
                  { label: 'New candidate screened', enabled: true },
                  { label: 'Candidate shortlisted', enabled: true },
                  { label: 'Job published', enabled: false },
                  { label: 'Weekly hiring report', enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <button className={`w-10 h-6 rounded-full transition-colors ${item.enabled ? 'bg-indigo-600' : 'bg-slate-200'} relative`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-4">Integrations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['LinkedIn', 'Greenhouse', 'Slack', 'Google Calendar'].map((name) => (
                  <div key={name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">{name}</span>
                    <button className="px-3 py-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">Connect</button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'billing' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-4">Billing & Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500">Current Plan</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{account?.plan || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`text-sm font-semibold mt-1 ${String(account?.plan_status).toLowerCase() === 'active' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {account?.plan_status || '—'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Professional Plan</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Up to 500 candidates/month</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">$99<span className="text-sm font-normal text-indigo-600">/mo</span></p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">Upgrade Plan</button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
