import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Upload, FileSearch, Zap, UserCheck, Mail, Lock, User, Building2, MapPin, Globe, Sparkles,
} from 'lucide-react';
import { register } from '../api/auth';
import logo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    city: '',
    country: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.company.trim() || !form.city.trim() || !form.country.trim()) {
      setError('Please enter your company, city and country');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2">
      {/* Left: logo, form, footer */}
      <div className="relative flex flex-col min-h-[640px] lg:min-h-screen">
        <div className="px-6 sm:px-8 pt-6">
          <Link to="/" aria-label="HireScop home" className="inline-flex">
            <img src={logo} alt="HireScop" className="h-10 w-auto max-w-[190px] object-contain object-left" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[340px]">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 leading-tight">Create your account</h1>
            <p className="text-[13px] text-slate-500 mt-1.5 mb-6">Get started with your free account</p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="w-full h-10 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Work email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" className="w-full h-10 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." autoComplete="organization" required className="w-full h-10 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Surat" autoComplete="address-level2" required className="w-full h-10 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="country" value={form.country} onChange={handleChange} placeholder="India" autoComplete="country-name" required className="w-full h-10 pl-9 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                </div>
              </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Create a password" className="w-full h-10 pl-9 pr-10 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" strokeWidth={1.8} />
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="w-full h-10 pl-9 pr-10 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-white text-[13px] font-semibold disabled:opacity-60 transition-opacity hover:opacity-95 shadow-[0_10px_22px_-8px_rgba(107,71,230,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] mt-1"
                style={{ background: 'linear-gradient(180deg, #7B5CF0 0%, #6B47E6 100%)' }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} HireScop</span>
          <span className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </span>
        </div>
      </div>

      {/* Right: lavender gradient with a faint grid, headline, badges, match card and ranking */}
      <div className="p-3 lg:min-h-screen">
        <div
          className="relative h-full min-h-[460px] rounded-[26px] overflow-hidden border border-indigo-100/80 px-6 sm:px-10 pt-10 pb-8 flex flex-col"
          style={{
            background:
              'linear-gradient(rgba(107,71,230,0.07) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(90deg, rgba(107,71,230,0.07) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(180deg, #F1EEFD 0%, #F6F4FE 100%)',
          }}
        >
          <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(129,104,238,0.35) 0%, rgba(129,104,238,0) 70%)' }} />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white border border-indigo-100 text-[11px] font-medium text-indigo-700 shadow-sm">
              <Sparkles className="w-3 h-3" /> AI Resume Screening
            </span>
            <h2 className="mt-5 text-[30px] font-bold tracking-tight text-slate-900 leading-tight">Smart hiring with HireScop</h2>
            <p className="mt-3 text-[13px] text-slate-600 leading-relaxed max-w-[360px]">
              Our AI analyzes resumes, matches candidates with jobs, and helps you build the best team.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Upload, label: 'Upload Resumes' },
                { icon: FileSearch, label: 'AI Analysis' },
                { icon: Zap, label: 'Match Score' },
                { icon: UserCheck, label: 'Shortlist & Hire' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 pl-1.5 pr-3 h-8 rounded-xl bg-white border border-slate-200/80 text-[11px] font-medium text-slate-800 shadow-[0_1px_2px_rgba(18,18,28,0.05)]">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-white" strokeWidth={2} />
                  </span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* floating match-score card (desktop) */}
          <div className="hidden lg:flex relative self-end mt-8 mr-2 items-center gap-3 rounded-2xl px-3.5 py-3 text-white shadow-[0_18px_40px_-14px_rgba(31,20,80,0.7)]" style={{ background: '#1B1442' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90 shrink-0" aria-hidden>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#A58BFF" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 16 * 0.92} ${2 * Math.PI * 16}`} />
            </svg>
            <span className="absolute left-3.5 top-3 w-10 h-10 flex items-center justify-center text-[10px] font-bold">92%</span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold">Top match</p>
              <p className="text-[10px] text-indigo-300">Recommended</p>
            </div>
          </div>

          {/* candidate ranking panel (desktop) */}
          <div className="hidden lg:block relative mt-auto -mb-8 -mr-10 ml-0 rounded-tl-2xl bg-white border border-slate-200/80 shadow-[0_-10px_40px_-16px_rgba(31,20,80,0.25)] p-4 pr-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Full Stack Developer</p>
                <p className="font-mono text-[9.5px] text-slate-500 mt-0.5">JOB-A104B6 · ranked by match</p>
              </div>
              <span className="font-mono text-[9px] tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">LIVE</span>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {[
                ['AM', 'Aarav Mehta', 78],
                ['DS', 'Diya Shah', 76],
                ['KN', 'Kabir Nair', 75],
                ['AR', 'Anaya Rao', 70],
                ['VI', 'Vihaan Iyer', 67],
              ].map(([initials, name, pct]) => (
                <div key={name} className="flex items-center gap-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-semibold flex items-center justify-center">{initials}</span>
                  <span className="flex-1 text-[11px] font-medium text-slate-800">{name}</span>
                  <span className="w-20 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#1FA971' : '#C98A00' }} />
                  </span>
                  <span className={`w-7 text-right text-[11px] font-semibold tabular-nums ${pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
