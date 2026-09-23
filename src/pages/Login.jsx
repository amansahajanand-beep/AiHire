import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Upload, FileSearch, Zap, UserCheck, LayoutDashboard,
} from 'lucide-react';
import { login } from '../api/auth';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
        {/* Left — Form */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-1">
              <img
                src={logo}
                alt="HireAI"
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            </div>
            <p className="text-sm text-slate-400 mb-8">AI-Powered Hiring Intelligence</p>

            <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-slate-500 mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Right — Promo */}
        <div className="hidden lg:flex w-[42%] bg-gradient-to-br from-[#0F172A] via-[#1e1b4b] to-[#312e81] flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-0 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-3 leading-tight">Hire smarter with AI</h2>
            <p className="text-indigo-100/80 text-sm leading-relaxed mb-8">
              Our AI analyzes resumes, matches candidates with jobs, and helps you build the best team.
            </p>

            <div className="space-y-3">
              {[
                { icon: Upload, label: 'Upload Resumes' },
                { icon: FileSearch, label: 'AI Analysis' },
                { icon: Zap, label: 'Match Score' },
                { icon: UserCheck, label: 'Shortlist & Hire' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Laptop mock illustration */}
          <div className="relative mt-10">
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 shadow-2xl rotate-[-2deg]">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[10px] text-slate-400 flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3" /> HireAI Dashboard
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <div className="h-2 bg-indigo-500/40 rounded w-full" />
                  <div className="h-2 bg-slate-700 rounded w-4/5" />
                  <div className="h-12 bg-indigo-600/30 rounded-lg mt-2 flex items-end gap-1 p-2">
                    <div className="w-2 bg-indigo-400 rounded-t h-4" />
                    <div className="w-2 bg-violet-400 rounded-t h-7" />
                    <div className="w-2 bg-indigo-300 rounded-t h-5" />
                    <div className="w-2 bg-violet-300 rounded-t h-8" />
                    <div className="w-2 bg-indigo-400 rounded-t h-6" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-emerald-300 font-bold">92%</span>
                  </div>
                  <div className="h-8 bg-slate-700/80 rounded-lg" />
                  <div className="h-8 bg-slate-700/50 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
