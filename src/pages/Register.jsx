import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, ShieldCheck, Cpu, Rocket } from 'lucide-react';
import { register } from '../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen flex bg-white">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="text-xl font-bold text-slate-900">HireAI</span>
          </div>
          <p className="text-sm text-slate-400 mb-8 ml-11 -mt-1">AI-Powered Hiring Intelligence</p>

          <h1 className="text-3xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 mb-8">Get started with your free account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Create a password" className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right — Light branding panel */}
      <div className="hidden lg:flex flex-1 bg-slate-50 items-center justify-center p-12 border-l border-slate-100">
        <div className="max-w-md text-center">
          <div className="relative mx-auto mb-10 w-56 h-56">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl rotate-6" />
            <div className="absolute inset-4 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center p-6 -rotate-2">
              <div className="w-14 h-14 rounded-full bg-indigo-100 mb-3 overflow-hidden flex items-center justify-center">
                <span className="text-lg font-bold text-indigo-600">JS</span>
              </div>
              <div className="h-2 bg-slate-200 rounded w-20 mb-1.5" />
              <div className="h-2 bg-slate-100 rounded w-14 mb-3" />
              <div className="w-full h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">Match 92%</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg flex items-center justify-center rotate-6">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="space-y-4 text-left">
            {[
              { icon: ShieldCheck, title: 'Secure & Reliable' },
              { icon: Cpu, title: 'AI-Powered Matching' },
              { icon: Rocket, title: 'Save Time & Hire Better' },
            ].map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
