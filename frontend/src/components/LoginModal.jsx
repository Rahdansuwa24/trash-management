import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { X, Lock, Mail, Loader2, UserCheck, ShieldCheck, User } from 'lucide-react';

export default function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!loginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Kombinasi email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (acc) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await quickLogin(acc);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-lg"
          aria-label="Tutup modal login"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Masuk ke TrashManage
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gunakan akun warga atau petugas untuk mengakses layanan terpadu lingkungan RT/RW.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Quick Demo Switcher for Testing */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Uji Coba Cepat (Pilih Peran Demo):
          </span>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuick(acc)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-civic-600 hover:bg-civic-50/50 transition-all flex items-center justify-between group min-h-[44px]"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-civic-800 flex items-center gap-1.5">
                    {acc.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-civic-700" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-civic-700" />
                    )}
                    {acc.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{acc.desc}</div>
                </div>
                <span className="text-xs font-semibold text-civic-700 group-hover:translate-x-0.5 transition-transform">
                  Pilih →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-medium">atau manual</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-civic-600 min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
