import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.png';

const navItems = [
  { label: 'Product', hash: 'product' },
  { label: 'How it works', hash: 'how-it-works' },
  { label: 'Workflow', hash: 'workflow' },
  { label: 'FAQ', hash: 'faq' },
];

export default function PublicHeader() {
  const { pathname, hash } = useLocation();
  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="w-[92%] md:w-[60%] mx-auto h-16 flex items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-10 min-w-0">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logo} alt="HireScop" className="h-10 w-auto max-w-[190px] object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <Link
                key={item.hash}
                to={{ pathname: '/', hash: item.hash }}
                className={`text-[14px] font-medium transition-colors ${
                  pathname === '/' && hash === `#${item.hash}` ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link to="/login" className="text-[14px] font-medium text-slate-800 hover:text-indigo-600">
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#12121C] text-white text-[13.5px] font-semibold hover:bg-black"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
    {/* the header is fixed, so reserve its height in the page flow */}
    <div className="h-16" aria-hidden />
    </>
  );
}
