import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { X, Lock, Mail, Loader2, UserCheck, ShieldCheck, User, Phone, Home, CheckCircle2 } from 'lucide-react';

export default function LoginModal() {
  const navigate = useNavigate();
  const { loginModalOpen, setLoginModalOpen, login, register, quickLogin } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state (Warga Lingkungan)
  const [regData, setRegData] = useState({
    nama: '',
    email: '',
    password: '',
    no_telp: '',
    alamat: '',
    rt: '03',
    rw: '05',
    kelurahan: 'Kalirungkut',
    kecamatan: 'Rungkut',
    kota: 'Surabaya'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!loginModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser?.role === 'mitra') {
        navigate('/mitra');
      } else {
        navigate('/setor');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Kombinasi email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await register({
        ...regData,
        role: 'warga'
      });
      navigate('/setor');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal melakukan pendaftaran akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (acc) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const loggedUser = await quickLogin(acc);
      if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser?.role === 'mitra') {
        navigate('/mitra');
      } else {
        navigate('/setor');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-lg"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
              tab === 'login'
                ? 'border-civic-700 text-civic-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Masuk / Akun Uji
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
              tab === 'register'
                ? 'border-civic-700 text-civic-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Warga Baru
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Masuk ke TrashManage
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih akun demo untuk pengujian instan, atau masukkan email & password Anda.
              </p>
            </div>

            {/* Quick Demo Switcher */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                1-Klik Masuk Akun Uji:
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

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
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
        )}

        {/* TAB 2: REGISTER WARGA BARU */}
        {tab === 'register' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Pendaftaran Warga Baru
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Daftarkan akun warga untuk mulai menyetorkan sampah dan menabung poin di bank sampah unit RT/RW.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  required
                  value={regData.nama}
                  onChange={(e) => setRegData({ ...regData, nama: e.target.value })}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-civic-600 min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email <span className="text-rose-600">*</span></label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp <span className="text-rose-600">*</span></label>
                  <input
                    type="tel"
                    required
                    value={regData.no_telp}
                    onChange={(e) => setRegData({ ...regData, no_telp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password <span className="text-rose-600">*</span></label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blok & Nomor Rumah <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regData.alamat}
                  onChange={(e) => setRegData({ ...regData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Kenanga Blok B4 No. 12"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RT <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={regData.rt}
                    onChange={(e) => setRegData({ ...regData, rt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs min-h-[40px] bg-white"
                  >
                    <option value="01">RT 01</option>
                    <option value="02">RT 02</option>
                    <option value="03">RT 03</option>
                    <option value="04">RT 04</option>
                    <option value="05">RT 05</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wilayah RW</label>
                  <input
                    type="text"
                    readOnly
                    value="RW 05"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs min-h-[40px]"
                  />
                </div>
              </div>

              <div className="p-3 bg-civic-50/70 border border-civic-200 rounded-xl text-[11px] text-civic-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-700 shrink-0" />
                  Buku Tabungan Daur Ulang Mandiri
                </span>
                <p className="text-civic-700">
                  Akun Anda akan langsung memiliki saldo awal 0 Poin dan dapat digunakan menyetor sampah ke pengurus Bank Sampah Unit RT.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-civic-700 hover:bg-civic-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar & Langsung Masuk'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
