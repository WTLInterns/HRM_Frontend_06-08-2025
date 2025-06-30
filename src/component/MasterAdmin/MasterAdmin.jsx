import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import SubAdminManagement from "../DashoBoard/SubAdminManagement";
import "../DashoBoard/animations.css";
import Sidebar from "./sidebar";
import RegisterCompany from "./RegisterCompany";
import ViewCompany from "./ViewCompany";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import { FaBars } from "react-icons/fa";

// Add a CSS module for background styles
const bgPattern = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%233B82F6' fill-opacity='0.07' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  backgroundSize: '100px 100px'
};

// Add global theme styles
const appTheme = {
  backgroundColor: '#1E293B', // darker background
  textColor: '#E2E8F0',      // light text
  accentColor: '#3B82F6'     // blue accent
};

const MasterAdmin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDarkMode } = useApp();

  useEffect(() => {
    console.log("MasterAdmin component mounted");
    // Check if user is in localStorage
    const user = localStorage.getItem("user");
    console.log("User in localStorage:", user);

    // Handle sidebar visibility based on screen size
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log("MasterAdmin component rendering");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-blue-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 to-white text-gray-800'}`}>
      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-30 transition-all duration-300 ease-in-out h-screen ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-lg'} ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar />
      </div>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20" 
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 overflow-auto h-full ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50'}`}>
        {/* Mobile Toggle Button */}
        <div className="md:hidden p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 bg-blue-800 text-blue-100 rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            <FaBars size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/register-company" element={<RegisterCompany />} />
            <Route path="/view-company" element={<ViewCompany />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MasterAdmin; 