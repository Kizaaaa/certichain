"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  login: (address: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedAddress = localStorage.getItem("auth_address");
    
    if (token && storedAddress) {
      try {
        const decoded = JSON.parse(atob(token));
        if (decoded.exp > Date.now()) {
          setIsAuthenticated(true);
          setAddress(storedAddress);
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_address");
        }
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_address");
      }
    }
  }, []);

  const login = (address: string, token: string) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_address", address);
    setIsAuthenticated(true);
    setAddress(address);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_address");
    setIsAuthenticated(false);
    setAddress(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, address, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
