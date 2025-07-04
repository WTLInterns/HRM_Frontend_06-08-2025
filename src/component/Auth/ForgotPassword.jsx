import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEnvelope, FaKey, FaArrowLeft, FaSpinner } from "react-icons/fa";
import "../DashoBoard/animations.css";
import { useTranslation } from 'react-i18next';
import LanguageToggle from "../../components/LanguageToggle";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Request OTP function
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Requesting OTP for email:", email);
      
      // Try masteradmin reset first
      try {
        const masterAdminResponse = await axios.post(
          `https://api.managifyhr.com/masteradmin/forgot-password/request?email=${email}`
        );
        
        console.log("Master Admin OTP request response:", masterAdminResponse.data);
        toast.success("OTP sent to your email. You will be redirected to reset your password.");
        
        // Store email and user type in localStorage for the reset password page
        localStorage.setItem("resetEmail", email);
        localStorage.setItem("resetUserType", "masteradmin");
        console.log("Saved email to localStorage:", email);
        
        // Navigate to reset password page after a short delay
        setTimeout(() => {
          navigate("/reset-password");
        }, 1500);
        
        setLoading(false);
        return; // Exit if masteradmin request succeeds
      } catch (masterAdminError) {
        console.log("Not a master admin user, trying subadmin endpoint");
        // If masteradmin request fails, try subadmin endpoint
        const subadminResponse = await axios.post(
          `https://api.managifyhr.com/api/subadmin/forgot-password/request?email=${email}`
        );
        
        console.log("Subadmin OTP request response:", subadminResponse.data);
        toast.success("OTP sent to your email. You will be redirected to reset your password.");
        
        // Store email and user type in localStorage for the reset password page
        localStorage.setItem("resetEmail", email);
        localStorage.setItem("resetUserType", "subadmin");
        console.log("Saved email to localStorage:", email);
        
        // Navigate to reset password page after a short delay
        setTimeout(() => {
          navigate("/reset-password");
        }, 1500);
        
        setLoading(false);
      }
    } catch (error) {
      console.error("Error requesting OTP:", error.response || error);
      setError(error.response?.data || t('auth.failedToSendOTP'));
      toast.error(error.response?.data || t('auth.failedToSendOTP'));
      setLoading(false);
    }
  };

  // Go back to login
  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden animate-fadeIn bg-slate-900">
      {/* Language Toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle position="right" />
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full bg-login-image opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/80 via-slate-900/90 to-slate-900/95"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-blue-600/20 animate-float blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-indigo-600/20 animate-float-delay blur-3xl"></div>
        <div className="absolute top-[40%] right-[30%] w-64 h-64 rounded-full bg-sky-600/20 animate-pulse-slow blur-3xl"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-scaleIn">
            <FaKey className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide animate-fadeIn animate-delay-300">
            Forgot Password
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mt-2 rounded-full animate-fadeIn animate-delay-500"></div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-scaleIn animate-delay-500">
          <div className="p-8">
            <button
              onClick={goToLogin}
              className="flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-all duration-300"
            >
              <FaArrowLeft className="mr-2" /> {t('auth.backToLogin')}
            </button>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 animate-pulse">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Request OTP Form */}
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-blue-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                    placeholder={t('auth.enterEmailAddress')}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    t('auth.requestOTP')
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-slate-900/50 p-4 border-t border-slate-700/50">
            <p className="text-xs text-center text-gray-400">
              Please enter your registered email to reset your password. An OTP will be sent to this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;