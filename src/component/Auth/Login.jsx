import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { FaEnvelope, FaLock, FaBuilding, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import "../DashoBoard/animations.css";
import axios from "axios";
import firebaseService from "../../services/firebaseService"; // Add this import
import { useTranslation } from 'react-i18next';
import LanguageToggle from "../../components/LanguageToggle";

const Login = () => {
  console.log("Login component rendering");
  const { loginUser, user, setUser } = useApp();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [fromLogout, setFromLogout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear form fields on initial load and check if coming from logout
  useEffect(() => {
    console.log("Login component mounted, location state:", location.state);
    setEmail("");
    setPassword("");

    if (location.state && location.state.fromLogout) {
      console.log("Coming from logout page, preventing auto-redirect");
      console.log("fromLogout state detected in location:", location.state.fromLogout);
      setFromLogout(true);

      console.log("Clearing localStorage items due to logout redirect");
      localStorage.removeItem("user");
    } else {
      console.log("Not coming from logout page, fromLogout set to false");
      setFromLogout(false);
    }
  }, [location]);

  // Handle user state changes and redirections
  useEffect(() => {
    try {
      console.log("Login Component - Initial Render");

      if (fromLogout) {
        console.log("User is coming from logout, staying on login page");
        return;
      }

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Found user in localStorage:", parsedUser);

          if (parsedUser.role === "SUBADMIN" || parsedUser.role === "SUB_ADMIN") {
            navigate("/dashboard");
          } else if (parsedUser.role === "EMPLOYEE") {
            navigate("/userDashboard");
          } else if (parsedUser.role === "MASTER_ADMIN") {
            navigate("/masteradmin");
          }
        } catch (parseError) {
          console.error("Error parsing user from localStorage:", parseError);
          localStorage.removeItem("user");
        }
      }

      if (user) {
        if (user.role === "SUBADMIN" || user.role === "SUB_ADMIN") {
          navigate("/dashboard");
        } else if (user.role === "EMPLOYEE") {
          navigate("/userDashboard");
        } else if (user.role === "MASTER_ADMIN") {
          navigate("/masteradmin");
        }
      }
    } catch (error) {
      console.error("Error in Login useEffect:", error);
      localStorage.removeItem("user");
    }
  }, [user, navigate, fromLogout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    setLoading(true);

    try {
      let response;
      let userData;

      // Try subadmin login first
      try {
        console.log("Attempting subadmin login...");
        response = await axios.post(
          `http://localhost:8081/api/subadmin/login?email=${email}&password=${password}`
        );
        const data = response.data;
        console.log("Subadmin login response:", data);

        if (data && (data.roll.toLowerCase() === "subadmin" || data.roll === "SUB_ADMIN")) {
          userData = { ...data, role: "SUBADMIN" };
          console.log("Subadmin login successful:", userData);
        } else {
          throw new Error("Not a valid subadmin account");
        }
      } catch (subadminError) {
        console.log("Subadmin login failed, trying masteradmin login...", subadminError);

        if (subadminError.response?.status === 403) {
          throw new Error("Your account is inactive. Please contact support.");
        }

        // Try masteradmin login
        response = await axios.post(
          `http://localhost:8081/masteradmin/login?email=${email}&password=${password}`
        );
        const data = response.data;
        console.log("Masteradmin login response:", data);

        if (data && data.roll) {
          userData = { ...data, role: data.roll };
          console.log("Masteradmin login successful:", userData);
        } else {
          throw new Error("Invalid response from server");
        }
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // 🔥 FCM TOKEN GENERATION - START (NON-BLOCKING) 🔥
      // Run FCM token registration in background without blocking login
      const handleFCMRegistration = async () => {
        try {
          console.log('🚀 Starting FCM token generation...');

          // Check if FCM is available (skip in development if needed)
          if (!window.navigator || !window.navigator.serviceWorker) {
            console.log('⚠️ Service Worker not available, skipping FCM registration');
            return;
          }

          // Determine user type based on role
          const userType = userData.role === 'SUB_ADMIN' || userData.role === 'SUBADMIN' ? 'SUBADMIN' : 'EMPLOYEE';
          console.log('📱 User type for FCM:', userType);

          // Generate and register FCM token with timeout
          const tokenRegistered = await Promise.race([
            firebaseService.registerTokenWithBackend(userData.id, userType),
            new Promise((_, reject) => setTimeout(() => reject(new Error('FCM registration timeout')), 5000))
          ]);

          if (tokenRegistered) {
            console.log('✅ FCM token registered successfully for user:', userData.id);
            // Setup message listener for real-time notifications
            firebaseService.setupForegroundMessageListener();
            toast.success("Notifications enabled successfully!");
          } else {
            console.log('⚠️ FCM token registration failed, but continuing with login');
            toast.warning("Notifications could not be enabled, but login successful");
          }
        } catch (fcmError) {
          console.error('❌ FCM token generation failed:', fcmError);
          toast.warning("Notifications could not be enabled, but login successful");
          // Don't break login flow if FCM fails
        }
      };

      // Start FCM registration in background
      // Allow FCM in development for testing, but with better error handling
      handleFCMRegistration();
      // 🔥 FCM TOKEN GENERATION - END (NON-BLOCKING) 🔥

      setSuccessMessage("Login successful! Welcome to your dashboard.");
      setShowSuccessModal(true);

      // Reduce timeout for faster navigation
      const navigateUser = () => {
        setShowSuccessModal(false);
        setLoading(false);

        if (userData.role === "MASTER_ADMIN") {
          navigate("/masteradmin", { replace: true });
        } else if (userData.role === "SUBADMIN" || userData.role === "SUB_ADMIN") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      };

      setTimeout(navigateUser, 1000);

      // Fallback navigation in case something goes wrong
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log('🔄 Fallback navigation triggered');
          navigateUser();
        }
      }, 3000);
    } catch (error) {
      console.error("Login error:", error);
      setIsSubmitting(false);
      setLoading(false);
      setError(error.message || "Invalid email or password. Please try again.");
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const forceCleanLogin = (e) => {
    e.preventDefault();
    console.log("Force cleaning all storage and state");
    localStorage.clear();
    sessionStorage.clear();
    setFromLogout(true);
    setEmail("");
    setPassword("");
    setError("");
    toast.success("Login state cleared successfully");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Emergency navigation function for testing
  const forceNavigate = (e) => {
    e.preventDefault();
    console.log("🚨 Force navigation triggered");
    setLoading(false);
    setIsSubmitting(false);

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        if (userData.role === "MASTER_ADMIN") {
          navigate("/masteradmin", { replace: true });
        } else if (userData.role === "SUBADMIN" || userData.role === "SUB_ADMIN") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        toast.success("Force navigation completed");
      } else {
        toast.error("No user data found");
      }
    } catch (error) {
      console.error("Force navigate error:", error);
      toast.error("Force navigation failed");
    }
  };

  useEffect(() => {
    return () => {
      console.log("Login component unmounting, current user:", user);
      console.log("Login localStorage on unmount:", {
        user: localStorage.getItem("user"),
      });
    };
  }, [user]);

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden animate-fadeIn bg-slate-900">
      {/* Language Toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle position="right" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full bg-login-image opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/80 via-slate-900/90 to-slate-900/95"></div>
        <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-blue-600/20 animate-float blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-indigo-600/20 animate-float-delay blur-3xl"></div>
        <div className="absolute top-[40%] right-[30%] w-64 h-64 rounded-full bg-sky-600/20 animate-pulse-slow blur-3xl"></div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="bg-gradient-to-br from-green-900/90 to-green-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-green-700/50 max-w-md p-6 z-10 animate-scaleIn text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-600/30 flex items-center justify-center">
                <FaCheckCircle className="text-green-400 text-4xl animate-pulse-slow" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Login Successful!</h3>
            <p className="text-green-100 mb-6">{successMessage}</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full mx-4 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-scaleIn">
            <FaBuilding className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide animate-fadeIn animate-delay-300">{t('dashboard.hrmSystem')}</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mt-2 rounded-full animate-fadeIn animate-delay-500"></div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-scaleIn animate-delay-500">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('dashboard.welcome')}</h2>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 animate-pulse">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  {t('auth.emailOrMobile')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-blue-400" />
                  </div>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                    placeholder={t('auth.enterEmail')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-blue-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                    placeholder={t('auth.enterPassword')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-gray-400 hover:text-blue-400 transition-colors duration-200" />
                    ) : (
                      <FaEye className="text-gray-400 hover:text-blue-400 transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                  disabled={loading}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <ClipLoader color="#fff" size={20} />
                        <span className="ml-2">{t('auth.loggingIn')}</span>
                      </>
                    ) : (
                      t('auth.signIn')
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 transform scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100"></span>
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-blue-400 hover:text-blue-300 transition duration-300 hover:underline"
                >
                  {t('auth.forgotPassword')}?
                </button>

                <div className="flex gap-2">
                  {localStorage.getItem('user') && (
                    <button
                      type="button"
                      onClick={forceNavigate}
                      className="text-xs text-green-400 hover:text-green-300 hover:underline transition-all duration-300"
                      title="Force navigate to dashboard if stuck"
                    >
                      {t('navigation.dashboard')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={forceCleanLogin}
                    className="text-xs text-gray-400 hover:text-blue-400 hover:underline transition-all duration-300"
                  >
                    {t('common.clear')}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-900/50 p-4 border-t border-slate-700/50">
            <p className="text-xs text-center text-gray-400">
              By signing in, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;