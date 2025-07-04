import React, { useState, useEffect } from "react";
import { Link, Routes, Route } from "react-router-dom";
import SalarySlip from "./SalarySlip";
import ViewAttendance from "./ViewAttendance";
import LeaveApplication from "./LeaveApplication";
import ResumeUpload from "./ResumeUpload";
import {
  FaCalendarWeek,
  FaReceipt,
  FaUser,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaCalendarAlt,
  FaFileUpload
} from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import Profile from "../Auth/Profile";
import { useApp } from "../../context/AppContext";
import firebaseService from "../../services/firebaseService";
import { toast } from "react-toastify";
import "../DashoBoard/animations.css";
import { useTranslation } from 'react-i18next';

const UserDashboard = () => {
  const { logoutUser, isDarkMode, toggleTheme } = useApp();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Initialize FCM for notifications
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.empId) return;

        console.log('🔄 Initializing FCM for user dashboard...');

        // Setup FCM token and register with backend
        await firebaseService.registerTokenWithBackend(user.empId, 'EMPLOYEE');

        // Setup foreground message listener
        firebaseService.setupForegroundMessageListener();

        console.log('✅ FCM initialized successfully for user dashboard');
      } catch (error) {
        console.error('❌ Failed to initialize FCM for user dashboard:', error);
      }
    };

    initializeFCM();
  }, []);

  // Global notification listener for all notification types
  useEffect(() => {
    const handleNotificationReceived = (event) => {
      const payload = event.detail;

      // Handle different notification types
      if (payload.data && payload.data.type && payload.notification) {
        const { title, body } = payload.notification;

        // Leave-related notifications
        if (payload.data.type.startsWith('LEAVE_')) {
          if (payload.data.type === 'LEAVE_APPROVED') {
            toast.success(`✅ ${title}: ${body}`, { autoClose: 5000 });
          } else if (payload.data.type === 'LEAVE_REJECTED') {
            toast.error(`❌ ${title}: ${body}`, { autoClose: 5000 });
          } else {
            toast.info(`📅 ${title}: ${body}`, { autoClose: 5000 });
          }
        }

        // Job opening notifications
        else if (payload.data.type === 'JOB_OPENING') {
          toast.info(`🎯 ${title}: ${body}`, { autoClose: 7000 });
          console.log('🎯 Job opening notification data:', payload.data);
        }

        // Resume submission notifications (shouldn't receive these as employee)
        else if (payload.data.type === 'RESUME_SUBMITTED') {
          toast.info(`📄 ${title}: ${body}`, { autoClose: 6000 });
        }

        // Generic notifications
        else {
          toast.info(`📢 ${title}: ${body}`, { autoClose: 5000 });
        }
      }
    };

    window.addEventListener('firebaseNotification', handleNotificationReceived);
    return () => window.removeEventListener('firebaseNotification', handleNotificationReceived);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation links array for DRY code
  const navLinks = [
    { to: "/userdashboard", label: t('navigation.dashboard'), icon: null },
    {
      to: "/userdashboard/viewAtten",
      label: t('navigation.viewAttendance'),
      icon: <FaCalendarWeek className="animate-float" />
    },
    {
      to: "/userdashboard/salaryslip",
      label: t('navigation.salarySlip'),
      icon: <FaReceipt className="animate-float" />
    },
    {
      to: "/userdashboard/leave-application",
      label: t('navigation.applyForLeave'),
      icon: <FaCalendarAlt className="animate-float" />
    },
    {
      to: "/userdashboard/resume-upload",
      label: t('navigation.uploadResume'),
      icon: <FaFileUpload className="animate-float" />
    },
    {
      to: "/userdashboard/profile",
      label: t('navigation.viewProfile'),
      icon: <FaUser className="animate-float" />
    },
  ];

  return (
    <div className={`flex h-screen overflow-hidden page-container ${isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      {/* Mobile menu button - only visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-blue-800 text-white transform transition duration-300 hover:scale-110 hover:bg-blue-700 active:scale-95"
        >
          {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Header - only visible on small screens */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-900'} text-white animate-fadeIn`}>
        <h1 className="text-xl font-bold">{t('navigation.userDashboard')}</h1>
      </div>

      {/* Sidebar */}
      <aside 
        className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative left-0 h-full w-64 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-800'} text-white shadow-xl z-40 overflow-y-auto flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-5 animate-fadeIn">{t('navigation.userDashboard')}</h1>
        </div>

        <nav className="px-4">
          <div className="space-y-1">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="flex items-center gap-2 p-2 rounded hover:bg-blue-700 hover:text-gray-200 transform transition duration-300 hover:translate-x-1 sidebar-menu-item animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={closeMobileMenu}
              >
                {link.icon && link.icon} {link.label}
              </Link>
            ))}
          </div>

          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 mt-20 mb-3 w-full rounded hover:bg-blue-700 text-gray-200 transform transition duration-300 hover:translate-x-1 hover:bg-blue-600"
          >
            {isDarkMode ? (
              <>
                <FaSun className="text-yellow-300" /> Light Mode
              </>
            ) : (
              <>
                <FaMoon className="text-gray-300" /> Dark Mode
              </>
            )}
          </button>

          <button
            onClick={logoutUser}
            className="flex items-center gap-2 p-2 w-full rounded hover:bg-blue-700 hover:text-gray-200 transform transition duration-300 hover:translate-x-1 hover:bg-red-600 animate-pulse-slow"
          >
            <FaSignOutAlt /> {t('auth.logout')}
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile menu - only visible when menu is open on small screens */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 animate-fadeIn"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 animate-fadeIn">
        {/* Add top padding on mobile to account for the fixed header */}
        <div className="pt-16 lg:pt-0 h-full">
          <Routes>
            <Route path="/" element={<div className="p-6 bg-white rounded-lg shadow-md transform transition duration-300 hover:shadow-xl card">{t('dashboard.welcome')} {t('navigation.userDashboard')}</div>} />
            <Route path="/salaryslip" element={<SalarySlip />} />
            <Route path="/viewAtten" element={<ViewAttendance />} />
            <Route path="/leave-application" element={<LeaveApplication />} />
            <Route path="/resume-upload" element={<ResumeUpload />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
