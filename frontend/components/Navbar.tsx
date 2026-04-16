'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, MessageSquare, BarChart3 } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Library', icon: BookOpen },
  { href: '/qa', label: 'Ask AI', icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06030c]/90 shadow-xl shadow-[#020106]/80 backdrop-blur-2xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)] group-hover:shadow-[0_0_25px_rgba(181,55,242,0.6)] transition-shadow">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl heading-font gradient-text tracking-wide">BookMind</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    active
                      ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,245,255,0.2)]'
                      : 'text-gray-400 hover:text-cyan-100 hover:bg-cyan-900/10'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
