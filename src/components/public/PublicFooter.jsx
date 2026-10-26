import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const linkClass = 'block text-[11px] text-slate-500 hover:text-slate-900';

export default function PublicFooter() {
  return (
    <footer className="overflow-x-clip">
      <div className="w-[92%] md:w-[60%] mx-auto mt-14 pt-8 pb-8 border-t border-slate-200/80">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="HireScop" className="h-9 w-auto max-w-[170px] object-contain" />
            </Link>
            <p className="mt-3 text-[11px] text-slate-500">AI-Powered Hiring Intelligence.</p>
          </div>
          <div className="flex gap-16">
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-900">Product</p>
              <Link to={{ pathname: '/', hash: 'product' }} className={linkClass}>AI agents</Link>
              <Link to={{ pathname: '/', hash: 'how-it-works' }} className={linkClass}>How it works</Link>
              <Link to={{ pathname: '/', hash: 'workflow' }} className={linkClass}>Workflow</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-900">Company</p>
              <Link to={{ pathname: '/', hash: 'faq' }} className={linkClass}>FAQ</Link>
              <span className={linkClass}>Help &amp; Support</span>
              <span className={linkClass}>Privacy</span>
            </div>
          </div>
        </div>
        <p className="mt-8 text-[10.5px] text-slate-500">© {new Date().getFullYear()} HireScop. All rights reserved.</p>
      </div>
    </footer>
  );
}
