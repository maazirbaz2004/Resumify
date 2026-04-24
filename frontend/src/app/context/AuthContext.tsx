/**
 * Auth context — provides login/register/logout state across the app.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth as authApi, getToken, setToken, clearToken, getStoredUser, setStoredUser } from "../services/api";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "candidate" | "recruiter" | "admin";
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; role: string; company_name?: string }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      authApi.me()
        .then((u) => { setUser(u); setStoredUser(u); })
        .catch(() => { clearToken(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    setStoredUser(res.user);
    return res.user;
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    setToken(res.token);
    setUser(res.user);
    setStoredUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
