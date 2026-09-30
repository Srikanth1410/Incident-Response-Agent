import Link from "next/link";
import { ShieldCheck, Database, Search } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <Link href="/" className="text-base font-bold text-slate-100 hover:text-white transition-colors">
              PayRecall
            </Link>
            <p className="text-[11px] text-slate-400">
              Self-Learning Payment Operations Agent
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/investigate"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Investigate
          </Link>
          <Link
            href="/insights"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Agent Memory & Insights
          </Link>
        </nav>
      </div>
    </header>
  );
}
