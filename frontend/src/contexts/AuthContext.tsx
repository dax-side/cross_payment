import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  sessionRestored: boolean;
  clearSessionRestored: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // The axios interceptor handles token refresh automatically.
        // If the access token is expired, it will refresh and retry the profile call.
        // If the refresh token is also expired, it rejects and we just stay logged out.
        const { data } = await authApi.getProfile();
        setUser(data.data.user);
      } catch {
        // Not authenticated — stay as guest, don't redirect
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.data.user);
  };

  const register = async (email: string, password: string) => {
    const { data } = await authApi.register({ email, password });
    setUser(data.data.user);
  };

  const logout = () => {
    setUser(null);
    setSessionRestored(false);
    authApi.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        sessionRestored,
        clearSessionRestored: () => setSessionRestored(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
