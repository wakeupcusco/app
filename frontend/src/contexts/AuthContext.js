import { createContext, useContext, useState, useEffect } from "react";
import api from "@/utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await api.get("/auth/me");
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem("access_token");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, ...userData } = response.data;
    localStorage.setItem("access_token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore errors
    }
    localStorage.removeItem("access_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
