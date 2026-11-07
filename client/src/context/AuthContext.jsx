import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const finish = (d) => {
    tokenStore.set(d.token);
    setUser(d.user);
  };
  const login = useCallback(async (b) => finish(await api.login(b)), []);
  const register = useCallback(async (b) => finish(await api.register(b)), []);
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
