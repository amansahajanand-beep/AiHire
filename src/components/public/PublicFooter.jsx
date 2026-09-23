import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-sm text-slate-500 break-words leading-relaxed">
            HireAI — AI-Powered Hiring Intelligence
          </span>
        </div>
        <nav className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 text-sm font-medium min-w-0">
          <Link to={{ pathname: '/', hash: 'features' }} className="text-slate-600 hover:text-slate-900">
            Features
          </Link>
          <Link to={{ pathname: '/', hash: 'how-it-works' }} className="text-slate-600 hover:text-slate-900">
            How It Works
          </Link>
          <Link to="/pricing" className="text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
            Sign In
          </Link>
        </nav>
      </div>
    </footer>
  );
}
