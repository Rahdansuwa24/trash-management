import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Shield, Users, CheckCircle, Trash2, Coins, Loader2, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [selectedRole]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const statRes = await api.getStats().catch(() => ({ data: null }));
      setStats(statRes.data);

      const userRes = await api.getUsers(selectedRole ? `?role=${selectedRole}` : '');
      setUsers(userRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'frozen' : 'active';
    try {
      await api.updateUserStatus(user.id_user, nextStatus);
      fetchAdminData();
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-civic-700" />
          Dashboard Administrator Smart City
        </h1>
        <p className="text-sm text-slate-600">
          Pusat pemantauan metrik lingkungan dan moderasi akun pengguna sistem.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Aduan Masuk</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.total_reports}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Selesai Dibersihkan</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              {stats.resolved_reports}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">Sampah Terdaur Ulang</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
              {stats.total_waste_recycled_kg} <span className="text-sm font-semibold">Kg</span>
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-civic-600 uppercase tracking-wider block">Total Poin Beredar</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-civic-800 font-mono">
              {stats.total_points_distributed.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* User Moderation Directory */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-civic-700" />
              Direktori Akun Pengguna ({users.length})
            </h2>
            <p className="text-xs text-slate-500">Moderasi hak akses dan status operasional akun</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Peran:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="">Semua Peran</option>
              <option value="warga">Warga</option>
              <option value="mitra">Mitra</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-civic-700 mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">Tidak ada data pengguna.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama & Email</th>
                  <th className="py-3 px-4 font-semibold">Peran</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id_user} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.nama}</span>
                      <span className="text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                            u.status === 'active'
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Bekukan Akun' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
