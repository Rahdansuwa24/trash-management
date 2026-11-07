import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, Menu, X, ShieldAlert, Search, Coins, Building2, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, setLoginModalOpen } = useAuth();

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Lapor Sampah Liar', path: '/lapor', icon: ShieldAlert },
    { name: 'Lacak Aduan', path: '/lacak', icon: Search },
    { name: 'Bank Sampah', path: '/setor', icon: Coins },
    { name: 'Portal Petugas', path: '/mitra', icon: Building2 },
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
              <span className="text-[11px] font-normal text-slate-500 tracking-normal mt-0.5">Sistem Sampah RT/RW</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigasi Utama">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'text-civic-700 bg-civic-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 opacity-75" />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-3">
                <div className="w-7 h-7 rounded-lg bg-civic-100 text-civic-800 flex items-center justify-center font-bold text-xs">
                  {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-800 line-clamp-1 max-w-[130px]">{user.nama}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Keluar"
                  className="ml-1 p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-civic-50 hover:bg-civic-100 text-civic-800 text-xs font-semibold border border-civic-200 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <LogIn className="w-4 h-4 text-civic-700" />
                Masuk / Akun Uji
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            {!user && (
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-civic-50 text-civic-800 border border-civic-200 rounded-lg"
              >
                Masuk
              </button>
            )}
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
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-civic-700 text-white flex items-center justify-center font-bold text-sm">
                  {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{user.nama}</div>
                  <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-rose-600 font-semibold p-2"
              >
                Keluar
              </button>
            </div>
          )}

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
