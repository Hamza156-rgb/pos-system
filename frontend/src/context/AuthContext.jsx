import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isSuperadmin = user?.role === 'superadmin';

  // Screen-access check: admins can do anything; cashiers are limited to their granted screens.
  const can = useCallback(
    (key) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return Array.isArray(user.permissions) && user.permissions.includes(key);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSuperadmin, can, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
