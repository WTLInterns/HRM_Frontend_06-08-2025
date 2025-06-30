import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(true);

  useEffect(() => {
    console.log("Logout component mounted, beginning logout process");
    
    // Start logout process immediately - no need to wait
    const timer = setTimeout(() => {
      console.log("Clearing ALL localStorage and sessionStorage items");
      
      // Clear specific auth items first for better debugging/logging
      localStorage.removeItem("user");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetOtp");
      
      // Then completely clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("Logout successful, showing success message");
      setIsLoggingOut(false);
      
      // Redirect to login page after showing success message
      const redirectTimer = setTimeout(() => {
        console.log("Redirecting to login page with fromLogout state");
        // Using replace: true ensures the history is replaced and user can't go back
        navigate('/login', { 
          state: { fromLogout: true },
          replace: true 
        });
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }, 1500); // Reduced from 2000 to 1500 for faster logout

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 bg-gradient-animate">
      <div className="bg-white p-8 rounded-xl shadow-2xl transform transition-all duration-500 hover-scale">
        <div className="text-center">
          {isLoggingOut ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <FaSpinner className="text-blue-600 text-4xl animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Logging Out</h2>
              <p className="text-gray-600">Please wait while we secure your session...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-progress"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-center">
                <FaSignOutAlt className="text-green-500 text-4xl animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Successfully Logged Out</h2>
              <p className="text-gray-600">You have been securely logged out of your account.</p>
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logout; 