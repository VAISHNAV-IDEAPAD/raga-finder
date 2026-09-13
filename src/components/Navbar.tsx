import Link from 'next/link';
import { Music, ShieldAlert, BookOpen, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-amber-200/60 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-raga-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-raga-500/20 group-hover:scale-105 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-stone-900 group-hover:text-raga-600 transition-colors">
                  Raga<span className="text-raga-600">Finder</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Carnatic & Hindustani Musicology
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Music className="w-4 h-4 text-raga-500" />
              <span>Finder</span>
            </Link>

            <Link
              href="/melakarta"
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-raga-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">72 Melakartas</span>
              <span className="sm:hidden">Melakarta</span>
            </Link>

            <Link
              href="/admin"
              className="ml-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-stone-800"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Teaching</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
