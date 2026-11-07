import React from 'react';
import { useAuth } from '../context/AuthContext';
import Forbidden403 from './Forbidden403';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
        <span className="text-xs font-medium">Memverifikasi hak akses pengguna...</span>
      </div>
    );
  }

  // Jika belum login atau role tidak memenuhi syarat
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Forbidden403 requiredRoles={allowedRoles} />;
  }

  return children;
}
