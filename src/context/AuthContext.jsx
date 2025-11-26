import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  token: null,
  saveToken: () => {},
  refreshUser: () => Promise.resolve(null),
  logout: () => {},
});

const getInitialTokenSource = () => {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem("authToken")) return "local";
  if (sessionStorage.getItem("authToken")) return "session";
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenSource, setTokenSource] = useState(getInitialTokenSource);

  const readToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (tokenSource === "local") return localStorage.getItem("authToken");
    if (tokenSource === "session") return sessionStorage.getItem("authToken");
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, [tokenSource]);

  const saveToken = useCallback((token, remember) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    if (!token) {
      setTokenSource(null);
      return;
    }
    if (remember) {
      localStorage.setItem("authToken", token);
      setTokenSource("local");
    } else {
      sessionStorage.setItem("authToken", token);
      setTokenSource("session");
    }
  }, []);

  const clearToken = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setTokenSource(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load user profile");
      }
      setUser(data);
      return data;
    } catch (err) {
      console.error("Failed to load current user", err);
      clearToken();
      setUser(null);
      setError(err?.message || "Authentication required");
      return null;
    } finally {
      setLoading(false);
    }
  }, [readToken, clearToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setError(null);
  }, [clearToken]);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      token: readToken(),
      saveToken,
      refreshUser,
      logout,
      setUser,
    }),
    [user, loading, error, readToken, saveToken, refreshUser, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


