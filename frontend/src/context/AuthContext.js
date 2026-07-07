import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to decode token safely
  const decodeToken = (tokenToDecode) => {
    try {
      if (!tokenToDecode) return null;

      // 🟢 HANDLE SIMULATED TOKEN (With Role)
      if (tokenToDecode.startsWith("SIMULATED_TOKEN_")) {
        console.log("🔍 Decoding Simulated Token:", tokenToDecode);
        
        const rawString = tokenToDecode.replace("SIMULATED_TOKEN_", "");

        // 🟢 FIX: Split by '_ROLES_'
        const parts = rawString.split("_ROLES_");
        const emailPart = parts[0];
        let rolePart = "USER"; 

        if (parts.length > 1) {
            rolePart = parts[1].replace("ROLE_", ""); 
        }

        console.log("✅ Simulated User Extracted:", { email: emailPart, role: rolePart });

        return {
          email: emailPart,
          role: rolePart,
        };
      }

      // 🟢 HANDLE STANDARD JWT
      console.log("🔍 Decoding Standard JWT...");
      const decoded = jwtDecode(tokenToDecode);
      const roleName = decoded.roles && decoded.roles[0] ? decoded.roles[0].authority : "ROLE_USER";
      let role = "USER"; 
      if (roleName === "ROLE_ADMIN") role = "ADMIN";

      return {
        email: decoded.sub,
        role: role,
      };
    } catch (error) {
      console.error("❌ Token Decode Error:", error);
      return null;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      const decodedUser = decodeToken(storedToken);
      if (decodedUser) {
        setUser(decodedUser);
        setToken(storedToken);
      } else {
        localStorage.removeItem("authToken"); 
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken) => {
    const decodedUser = decodeToken(newToken);
    if (decodedUser) {
      localStorage.setItem("authToken", newToken);
      setToken(newToken);
      setUser(decodedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const value = { token, user, isLoading, isAuthenticated: !!user, isAdmin: user?.role === "ADMIN", login, logout };

  if (isLoading) return <div>Loading...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => { return useContext(AuthContext); };
