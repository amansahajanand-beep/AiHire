import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Card from '../ui/Card';
import { changePassword } from '../../api/auth';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const empty = { currentPassword: '', password: '', confirmPassword: '' };

/** Lets a signed-in user change their password by confirming the current one. */
export default function ChangePasswordCard() {
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (form.password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(form);
      setForm(empty);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <h3 className="text-base font-bold text-slate-900">Change Password</h3>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">Confirm your current password to set a new one.</p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
          <input
            name="currentPassword"
            type={show ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
          <div className="relative">
            <input
              name="password"
              type={show ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
          <input
            name="confirmPassword"
            type={show ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Password updated successfully.</p>}
        <button
          type="submit"
          disabled={loading || !form.currentPassword}
          className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </Card>
  );
}
