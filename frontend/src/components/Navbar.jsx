import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, Menu, X, ShieldAlert, Search, Coins, Building2 } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Lapor Sampah Liar', path: '/lapor', icon: ShieldAlert },
    { name: 'Lacak Aduan', path: '/lacak', icon: Search },
    { name: 'Bank Sampah', path: '/setor', icon: Coins },
    { name: 'Portal Mitra', path: '/mitra', icon: Building2 },
    { name: 'Admin', path: '/admin' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
            <div className="w-9 h-9 rounded-lg bg-civic-700 text-white flex items-center justify-center transition-colors group-hover:bg-civic-800">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base tracking-tight leading-none text-slate-900">TrashManage</span>
              <span className="text-[11px] font-normal text-slate-500 tracking-normal mt-0.5">Smart City & Circular Hub</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'text-civic-700 bg-civic-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 opacity-75" />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium min-h-[44px] ${
                  isActive
                    ? 'text-civic-700 bg-civic-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.icon && <link.icon className="w-5 h-5 text-civic-600" />}
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
