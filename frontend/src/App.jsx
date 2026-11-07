import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import LaporSampahLiar from './pages/LaporSampahLiar';
import LacakAduan from './pages/LacakAduan';
import SetorSampah from './pages/SetorSampah';
import PortalMitra from './pages/PortalMitra';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Rute Publik Terbuka */}
            <Route path="/" element={<Home />} />
            <Route path="/lapor" element={<LaporSampahLiar />} />
            <Route path="/lacak" element={<LacakAduan />} />

            {/* Rute Warga (Bank Sampah & Tabungan Poin) */}
            <Route path="/setor" element={<SetorSampah />} />

            {/* Rute Khusus Petugas Satgas Lapangan & Bank Sampah Unit */}
            <Route
              path="/mitra"
              element={
                <ProtectedRoute allowedRoles={['mitra', 'admin']}>
                  <PortalMitra />
                </ProtectedRoute>
              }
            />

            {/* Rute Khusus Administrator / Koordinator RW */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
        <LoginModal />
      </div>
    </AuthProvider>
  );
}
