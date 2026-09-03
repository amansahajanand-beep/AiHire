import { useState } from 'react';
import { User, Building2, Users, Bell, Plug, CreditCard } from 'lucide-react';
import Card from '../components/ui/Card';
import { currentUser } from '../data/mockData';
import { getInitials } from '../utils/helpers';

const settingsNav = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'company', label: 'Company Settings', icon: Building2 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'notifications', label: 'Notification Settings', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: 'Aman Sharma',
    email: 'aman@company.com',
    phone: '+91 98765-43210',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
                  <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-700">{getInitials(profile.name)}</span>
                    </div>
                    <button className="px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                      Change Photo
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </Card>
          )}

          {activeSection === 'company' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-1">Company Settings</h3>
              <p className="text-sm text-slate-500 mb-6">Manage your organization details.</p>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                  <input defaultValue={currentUser.company} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Industry</label>
                  <input defaultValue="Technology / SaaS" className={inputClass} />
                </div>
                <button onClick={handleSave} className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold">Save Changes</button>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <Card>
              <h3 className="text-base font-bold text-slate-900 mb-4">User Management</h3>
              <div className="space-y-3">
                {[
                  { name: 'Aman Sharma', email: 'aman@company.com', role: 'Admin' },
                  { name: 'Mike Chen', email: 'mike@company.com', role: 'Recruiter' },
                  { name: 'Lisa Park', email: 'lisa@company.com', role: 'Recruiter' },
                ].map((user) => (
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
