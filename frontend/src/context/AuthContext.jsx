import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    role: 'warga',
    label: 'Warga (Budi Santoso - RT 03)',
    email: 'warga.budi@trashmanage.com',
    password: 'Password123!',
    desc: 'Menyetor sampah terpilah & memantau saldo poin'
  },
  {
    role: 'mitra',
    label: 'Petugas Lapangan (Satgas RW 05)',
    email: 'petugas.rw05@trashmanage.com',
    password: 'Password123!',
    desc: 'Menindaklanjuti aduan sampah liar & unggah bukti foto'
  },
  {
    role: 'admin',
    label: 'Koordinator Lingkungan (RW 05)',
    email: 'admin@trashmanage.com',
    password: 'Password123!',
    desc: 'Pengawasan sistem, statistik, & moderasi akun'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (e) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
      setLoginModalOpen(false);
      return res.user;
    }
    throw new Error(res.message || 'Gagal login.');
  };

  const quickLogin = async (demoAccount) => {
    return await login(demoAccount.email, demoAccount.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        quickLogin,
        logout,
        loginModalOpen,
        setLoginModalOpen,
        refreshUser: checkCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
