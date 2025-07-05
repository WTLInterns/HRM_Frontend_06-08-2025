import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTachometerAlt,
  FaUserCog,
  FaBuilding,
  FaList,
  FaChevronDown,
  FaChevronUp,
  FaUser,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaTimes
} from "react-icons/fa";
import "../DashoBoard/animations.css";
import { useApp } from "../../context/AppContext";

const Sidebar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const [userName, setUserName] = useState("Master Admin");
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser, isDarkMode } = useApp();
  
  // Load user data and profile image from localStorage
  useEffect(() => {
    loadUserProfile();
    
    // Add event listener to detect profile updates
    const handleStorageChange = () => {
      const profileUpdated = sessionStorage.getItem("profileUpdated");
      if (profileUpdated) {
        // Clear the flag
        sessionStorage.removeItem("profileUpdated");
        // Reload the profile
        loadUserProfile();
      }
    };
    
    // Check for updates every second
    const intervalId = setInterval(handleStorageChange, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Function to load user profile from localStorage
  const loadUserProfile = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Set the user's name
        if (parsedUser.name) {
          setUserName(parsedUser.name);
        }
        
        // Use the email to build the profile image URL
        if (parsedUser.email) {
          const imageUrl = `http://localhost:8282/masteradmin/profileImg?email=${parsedUser.email}`;
          setProfileImg(imageUrl);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Check if a given path is the current active path
  const isActive = (path) => {
    if (path === '/masteradmin' || path === '/masteradmin/') {
      return location.pathname === '/masteradmin' || location.pathname === '/masteradmin/';
    }
    return location.pathname.includes(path);
  };

  // Apply active styles based on current path
  const getItemClass = (path) => {
    const baseClass = "flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-blue-800/50 hover:pl-6";
    const activeClass = "bg-blue-900/70 text-blue-100 shadow-md pl-6";
    const inactiveClass = "text-gray-300 hover:text-white";
    
    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };
  
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutUser();
  };
  
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className={`w-64 h-full overflow-y-auto ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
            onClick={cancelLogout}
          ></div>
          
          <div className={`relative w-96 rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Logout Confirmation</h3>
              <button 
                onClick={cancelLogout} 
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-2 text-gray-200">Are you sure you want to logout?</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={confirmLogout}
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col items-center justify-center`}>
        <div className="h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden mb-4 shadow-lg bg-blue-900/50 flex items-center justify-center">
          {profileImg ? (
            <img
              src={profileImg}
              alt="Admin"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%233B82F6'/%3E%3Ctext x='50%25' y='50%25' font-size='60' text-anchor='middle' dy='.3em' fill='white'%3E${userName.charAt(0)}%3C/text%3E%3C/svg%3E`;
              }}
            />
          ) : (
            <FaUser className="text-white/70 text-4xl" />
          )}
        </div>
        <h1 className="text-xl font-bold text-center">{userName}</h1>
        <p className="text-blue-400 text-sm">Master Admin HRM</p>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 flex-1">
        <ul className="space-y-1">
          <li>
            <Link to="/masteradmin/profile" className={getItemClass("/profile")}>
              <FaUser />
              <span>Profile</span>
            </Link>
          </li>
          
          <li>
            <Link to="/masteradmin/dashboard" className={getItemClass("/dashboard")}>
              <FaTachometerAlt />
              <span>Dashboard</span>
            </Link>
          </li>
          
          {/* Company Dropdown */}
          <li className="mt-4">
            <button
              onClick={toggleDropdown}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 hover:bg-blue-800/50 text-gray-300 hover:text-white group ${dropdownOpen ? 'bg-blue-900/30' : ''}`}
            >
              <div className="flex items-center gap-2">
                <FaBuilding className="group-hover:text-blue-400" />
                <span>Sub-Admins</span>
              </div>
              {dropdownOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
            </button>
            
            {dropdownOpen && (
              <ul className="pl-6 mt-1 space-y-1 animate-fadeIn">
                <li>
                  <Link to="/masteradmin/register-company" className={getItemClass("/register-company")}>
                    <FaBuilding />
                    <span>Register Company</span>
                  </Link>
                </li>
                <li>
                  <Link to="/masteradmin/view-company" className={getItemClass("/view-company")}>
                    <FaList />
                    <span>View Companies</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="mt-auto p-4 border-t border-slate-700">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] group"
        >
          <FaSignOutAlt className="transform group-hover:translate-x-[-2px] transition-transform duration-300" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
