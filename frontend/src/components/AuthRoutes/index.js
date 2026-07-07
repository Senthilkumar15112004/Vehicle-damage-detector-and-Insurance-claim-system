import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
// Note: We go up 2 levels (../../) to find context
import { useAuth } from "../../context/AuthContext";

export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  // Keep this as /oauth/redirect.
  // The Backend will send the user HERE after it finishes talking to Google.
  if (location.pathname === '/oauth/redirect') {
    return <Outlet />;
  }

  return isAuthenticated ? <Navigate to="/new-claim" replace /> : <Outlet />;
};

export const UserRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/new-claim" replace />;
};

export const AuthenticatedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
