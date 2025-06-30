import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";

// Simplified session check - just verifies if user data exists
const isSessionValid = (user) => {
  return !!user; // Session is valid if we have a user object
};

const ProtectRoute = ({ children }) => {
  const location = useLocation();
  const authContext = useApp();
  
  if (!authContext) {
    console.error("AuthContext is undefined. Ensure it is wrapped properly.");
    return null;
  }

  const { user, logoutUser } = authContext;
  const storedUser = localStorage.getItem("user");
  const [hasToastShown, setHasToastShown] = useState(false);

  // Debug logs
  console.log("ProtectRoute - Current path:", location.pathname);
  console.log("ProtectRoute - Has user in context:", !!user);
  console.log("ProtectRoute - Has user in localStorage:", !!storedUser);

  // Consider all sessions valid for certain routes
  const isAuthFlow = location.pathname.includes('/login') || 
                     location.pathname.includes('/logout') || 
                     location.pathname.includes('/reset-password');
  
  // If we have user data in context or localStorage, consider authentication valid
  // for dashboard route right after login
  const isJustLoggedIn = (!!user || !!storedUser) && 
                         location.pathname.includes('/dashboard');
                         
  // Check for existing user in localStorage if context doesn't have it
  const effectiveUser = user || (storedUser ? JSON.parse(storedUser) : null);
                         
  // Session is valid if:
  // 1. We're in an auth flow OR
  // 2. We just logged in and going to dashboard OR
  // 3. The user session is valid
  const isValidSession = isAuthFlow || isJustLoggedIn || isSessionValid(effectiveUser);
  
  console.log("ProtectRoute - isAuthFlow:", isAuthFlow);
  console.log("ProtectRoute - isJustLoggedIn:", isJustLoggedIn);
  console.log("ProtectRoute - isValidSession:", isValidSession);

  useEffect(() => {
    // Only validate sessions for non-auth flows
    // And don't do it if user just logged in
    if (!isAuthFlow && !isJustLoggedIn && !isValidSession && !hasToastShown) {
      console.log("Session validation failed, logging out");
      localStorage.removeItem("user");
      toast.error("Your session has expired. Please login again.");
      setHasToastShown(true);
    }
  }, [isValidSession, hasToastShown, isAuthFlow, isJustLoggedIn]);

  if (!effectiveUser || !isValidSession) {
    console.log("Protected route access denied - redirecting to login");
    console.log("effectiveUser:", effectiveUser);
    console.log("isValidSession:", isValidSession);
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectRoute;
