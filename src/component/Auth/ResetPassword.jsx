import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaLock, FaArrowLeft, FaSpinner, FaCheck, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
import "../DashoBoard/animations.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invalidOtp, setInvalidOtp] = useState(false);
  const [userType, setUserType] = useState("masteradmin"); // Default to masteradmin

  // Get email and user type from localStorage - OTP will be entered by user
  useEffect(() => {
    const resetEmail = localStorage.getItem("resetEmail");
    const userType = localStorage.getItem("resetUserType") || "masteradmin"; // Default to masteradmin for backwards compatibility
    
    if (!resetEmail) {
      toast.error("Session expired. Please restart the password reset process.");
      navigate("/forgot-password");
      return;
    }
    
    setEmail(resetEmail);
    setUserType(userType);
    console.log("Retrieved email from localStorage:", resetEmail);
    console.log("User type for password reset:", userType);
  }, [navigate]);

  // Handle password reset submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInvalidOtp(false);
    
    // Validate inputs
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP code");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Verifying OTP - Email:", email, "OTP:", otp, "User type:", userType);
      
      let response;
      
      // Choose the appropriate API endpoint based on user type
      if (userType === "masteradmin") {
        // Use Master Admin API for password reset
        response = await axios.post(
          `https://api.managifyhr.com/masteradmin/forgot-password/verify?email=${email}&otp=${otp}&newPassword=${newPassword}`
        );
        console.log("Master Admin password reset response:", response.data);
      } else if (userType === "subadmin") {
        // Use Subadmin API for password reset
        response = await axios.post(
          `https://api.managifyhr.com/api/subadmin/forgot-password/verify?email=${email}&otp=${otp}&newPassword=${newPassword}`
        );
        console.log("Subadmin password reset response:", response.data);
      } else {
        throw new Error("Unknown user type for password reset");
      }
      
      toast.success("Password reset successful!");
      setPasswordUpdated(true);
      setLoading(false);
      
      // Clear reset data from localStorage
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetUserType");
      localStorage.removeItem("resetOtp");
      
      // Redirect to login after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error.response || error);
      setInvalidOtp(true);
      setError(error.response?.data || "Invalid OTP or password reset failed. Please try again.");
      setLoading(false);
    }
  };

  // Go back to forgot password
  const goBack = () => {
    navigate("/forgot-password");
  };

  // Toggle password visibility
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden animate-fadeIn bg-slate-900">
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
            <FaLock className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide animate-fadeIn animate-delay-300">Reset Password</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mt-2 rounded-full animate-fadeIn animate-delay-500"></div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-scaleIn animate-delay-500">
          <div className="p-8">
            {!passwordUpdated ? (
              <>
                <button 
                  onClick={goBack}
                  className="flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-all duration-300"
                >
                  <FaArrowLeft className="mr-2" /> Back
                </button>
                
                {invalidOtp && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 animate-pulse">
                    <p className="text-red-400 text-sm">Invalid OTP. Please check and try again.</p>
          </div>
        )}
                
                {error && !invalidOtp && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 animate-pulse">
                    <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* OTP Input Field */}
                  <div className="space-y-2">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
                      OTP Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaKey className="text-blue-400" />
                      </div>
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                        placeholder="Enter OTP code sent to your email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
            New Password
          </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-blue-400" />
                      </div>
          <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
            placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                        onClick={toggleNewPasswordVisibility}
                      >
                        {showNewPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-blue-400 transition-colors duration-200" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-blue-400 transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-blue-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
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
                      className="w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group flex items-center justify-center"
                      disabled={loading || invalidOtp}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        "Update Password"
                      )}
        </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-600/30 flex items-center justify-center">
                    <FaCheck className="text-green-400 text-4xl animate-pulse-slow" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                <p className="text-green-100 mb-6">Your password has been successfully updated. Redirecting to login...</p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-slate-900/50 p-4 border-t border-slate-700/50">
            <p className="text-xs text-center text-gray-400">
              Please create a strong password using a mix of letters, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
