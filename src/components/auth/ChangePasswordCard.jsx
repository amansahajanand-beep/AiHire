import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../../api/auth';

const inputClass =
  'w-full h-10 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.03)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400';

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
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Change Password</h2>
        <p className="text-xs text-slate-500 mt-1">Confirm your current password to set a new one.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-lg">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">Current Password</label>
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
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">New Password</label>
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
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">Confirm New Password</label>
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
          className="w-full sm:w-auto h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </section>
  );
}
