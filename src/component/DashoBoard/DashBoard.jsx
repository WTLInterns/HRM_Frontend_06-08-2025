import React, { useEffect, useState, useMemo } from "react";
import ReactConfetti from "react-confetti";
import axios from "axios";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Attendance from "./Attendance";
import TrackEmployee from "./TrackEmployee";
import AddOpenings from "./AddOpenings";
import Resume from "./Resume";
import EmergencyMessage from "./EmergencyMessage";
import SetSalary from "./SetSalary";
import SalarySheet from "./SalarySheet";
import SalarySlip from "./SalarySlip";
import AddEmp from "./AddEmp";
import ViewAttendanceFixed from "./ViewAttendanceFixed";
import CheckImages from "./CheckImages";
import { IoIosLogOut, IoIosPersonAdd } from "react-icons/io";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlinePageview, MdKeyboardArrowDown, MdKeyboardArrowRight, MdDashboard } from "react-icons/md";
import LanguageToggle from "../../components/LanguageToggle";
import { useTranslation } from 'react-i18next';
import { FaReceipt, FaCalendarAlt, FaRegIdCard, FaExclamationTriangle, FaTimes, FaSignOutAlt, FaChartPie, FaArrowUp, FaArrowDown, FaMoon, FaSun, FaFileAlt, FaBell, FaUserCog, FaBriefcase, FaRupeeSign } from "react-icons/fa";
import { BiSolidSpreadsheet } from "react-icons/bi";
import { HiMenu, HiX } from "react-icons/hi";
import { useApp } from "../../context/AppContext";
import Home from "./Home";
import ProfileForm from "./ProfileForm";
import Certificates from "./Certificates";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import "./animations.css";
import DashoBoardRouter from "./DashboardRouter/DashoBoardRouter";
import Reminders from "./Reminders";
import LeaveNotification from "./LeaveNotification";
import NotificationTest from "./NotificationTest";
import FCMTest from "./FCMTest";
import TokenDebugger from "./TokenDebugger";
import NotificationDebugger from "./NotificationDebugger";
import NotificationBell from "../../components/NotificationBell";
import firebaseService from "../../services/firebaseService";
import { toast } from "react-toastify";
import AddProducts from "./Products/AddProducts";
import CheckInvoice from "./Products/CheckInvoice";
import CheckData from "./Products/CheckData";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.5);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(59, 130, 246, 0.8);
  }
`;

const Dashboard = () => {
  const { fetchAllEmp, emp, logoutUser, isDarkMode, toggleTheme } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State declarations
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [birthdayEmployees, setBirthdayEmployees] = useState([]);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
  const [openingsDropdownOpen, setOpeningsDropdownOpen] = useState(false);
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfitable, setIsProfitable] = useState(false);
  const [companyBudget] = useState(1000000);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    activeSalary: 0,
    inactiveSalary: 0,
    profitLoss: 0,
  });
  const [userData, setUserData] = useState({
    name: "",
    lastname: "",
    companylogo: "",
    registercompanyname: t('dashboardExtended.companyInfo.defaultCompanyName'),
    status: "active",
  });
  const [logoLoadAttempt, setLogoLoadAttempt] = useState(0);
  const BACKEND_URL = useMemo(() => "http://localhost:8081", []);
  const defaultImage = "/image/admin-profile.jpg";

  // Handle inactive user logout with polling
  useEffect(() => {
    const checkUserStatus = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id) return;

      try {
        const response = await axios.get(`${BACKEND_URL}/api/subadmin/status/${user.id}`);
        const currentStatus = response.data.status?.toLowerCase() || "";

        if (currentStatus === "inactive") {
          console.log("User status is inactive, initiating logout");
          logoutUser();
          localStorage.removeItem("user");
          navigate("/login", { state: { fromLogout: true }, replace: true });
        } else {
          // Update localStorage and state with the latest status
          setUserData((prev) => ({ ...prev, status: currentStatus }));
          localStorage.setItem("user", JSON.stringify({ ...user, status: currentStatus }));
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    // Initial check
    checkUserStatus();

    // Set up polling every 5 seconds
    const intervalId = setInterval(checkUserStatus, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [logoutUser, navigate, BACKEND_URL]);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const subadminId = user?.id;
        if (!subadminId) {
          setExpenses([]);
          return;
        }
        const res = await axios.get(`${BACKEND_URL}/api/expenses/${subadminId}/getAll`);
        setExpenses(res.data || []);
      } catch (err) {
        setExpenses([]);
      }
    };
    fetchExpenses();
    window.addEventListener("expensesUpdated", fetchExpenses);
    return () => window.removeEventListener("expensesUpdated", fetchExpenses);
  }, []);

  useEffect(() => {
    const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    setTotalExpenses(total);
  }, [expenses]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scrollbar styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = scrollbarStyles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  // Load user data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        name: user.name || "",
        lastname: user.lastname || "",
        companylogo: user.companylogo || "",
        registercompanyname: user.registercompanyname || t('dashboardExtended.companyInfo.defaultCompanyName'),
        status: user.status || "active",
      });
    }
  }, []);

  // Fetch employees
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.id && (!emp || emp.length === 0)) {
      fetchAllEmp();
    }
  }, [emp, fetchAllEmp]);

  // Check birthdays
  useEffect(() => {
    const fetchEmployeesAndCheckBirthdays = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.id) {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/employee/${user.id}/employee/all`);
          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentDay = today.getDate();
          const birthdayPeople = response.data.filter((emp) => {
            if (!emp.birthDate) return false;
            const birthDate = new Date(emp.birthDate);
            const birthMonth = birthDate.getMonth() + 1;
            const birthDay = birthDate.getDate();
            return birthMonth === currentMonth && birthDay === currentDay;
          });
          if (birthdayPeople.length > 0) {
            setBirthdayEmployees(birthdayPeople);
            setShowBirthdayPopup(true);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
        }
      }
    };
    fetchEmployeesAndCheckBirthdays();
  }, []);

  // Check reminders
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;
        const response = await axios.get(`${BACKEND_URL}/api/reminders/${user.id}`);
        const currentDate = new Date();
        const dueReminder = response.data.find((reminder) => {
          const reminderDate = new Date(reminder.reminderDate);
          return (
            reminderDate.getDate() === currentDate.getDate() &&
            reminderDate.getMonth() === currentDate.getMonth() &&
            reminderDate.getFullYear() === currentDate.getFullYear()
          );
        });
        if (dueReminder) {
          setCurrentReminder(dueReminder);
          setShowReminderPopup(true);
        }
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };
    checkReminders();
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;
    const timeout = setTimeout(() => {
      checkReminders();
      const interval = setInterval(checkReminders, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);
    return () => clearTimeout(timeout);
  }, []);

  // Calculate stats
  useEffect(() => {
    const calculateStats = () => {
      try {
        setLoading(true);
        const activeEmployees = emp.filter((employee) => employee.status?.toLowerCase() === "active");
        const inactiveEmployees = emp.filter((employee) => employee.status?.toLowerCase() === "inactive");
        const activeSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const inactiveSalary = inactiveEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const totalSalary = activeSalary + inactiveSalary;
        const profitLoss = companyBudget - totalSalary;
        setIsProfitable(profitLoss > 0);
        setStats({
          totalEmployees: emp.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: inactiveEmployees.length,
          totalSalary,
          activeSalary,
          inactiveSalary,
          profitLoss,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error calculating stats:", error);
        setLoading(false);
      }
    };
    calculateStats();
    window.addEventListener("employeesUpdated", calculateStats);
    return () => window.removeEventListener("employeesUpdated", calculateStats);
  }, [emp, companyBudget]);

  // Chart data
  const pieChartData = {
    labels: [t('dashboard.charts.activeSalary'), t('dashboard.charts.inactiveSalary')],
    datasets: [
      {
        data: [stats.activeSalary, stats.inactiveSalary],
        backgroundColor: ["rgba(56, 189, 248, 0.85)", "rgba(251, 113, 133, 0.85)"],
        borderColor: ["rgba(56, 189, 248, 1)", "rgba(251, 113, 133, 1)"],
        borderWidth: 0,
        hoverBackgroundColor: ["rgba(56, 189, 248, 1)", "rgba(251, 113, 133, 1)"],
        hoverBorderColor: "#ffffff",
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };

  const employeeStatusData = {
    labels: [t('dashboard.charts.activeEmployees'), t('dashboard.charts.inactiveEmployees')],
    datasets: [
      {
        data: [stats.activeEmployees, stats.inactiveEmployees],
        backgroundColor: ["rgba(34, 197, 94, 0.85)", "rgba(239, 68, 68, 0.85)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 0,
        hoverBackgroundColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
        hoverBorderColor: "#ffffff",
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };

  const yearlyData = [
    { year: "2020", profit: 80000, loss: 20000 },
    { year: "2021", profit: 90000, loss: 15000 },
    { year: "2022", profit: 120000, loss: 25000 },
    { year: "2023", profit: 150000, loss: 30000 },
    { year: "2024", profit: 200000, loss: 40000 },
  ];

  const barChartData = {
    labels: yearlyData.map((item) => item.year),
    datasets: [
      { label: t('dashboard.charts.profit'), data: yearlyData.map((item) => item.profit), backgroundColor: "rgba(56, 189, 248, 0.85)", borderColor: "rgba(56, 189, 248, 1)", borderWidth: 1 },
      { label: t('dashboard.charts.loss'), data: yearlyData.map((item) => item.loss), backgroundColor: "rgba(251, 113, 133, 0.85)", borderColor: "rgba(251, 113, 133, 1)", borderWidth: 1 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    radius: "85%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        padding: 15,
        cornerRadius: 8,
        caretSize: 0,
        borderColor: "#475569",
        borderWidth: 0,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
          labelTextColor: () => "#ffffff",
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: "easeOutCirc",
      delay: (context) => context.dataIndex * 200,
    },
    elements: { arc: { borderWidth: 0 } },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#ffffff", font: { size: 12 } } },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#475569",
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (context) => `${context.dataset.label}: ₹${context.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#ffffff" } },
      y: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#ffffff", callback: (value) => `₹${value.toLocaleString()}` } },
    },
  };

  // Job role chart data
  const jobRoleSummary = emp.reduce((acc, employee) => {
    const role = employee.jobRole || t('dashboardExtended.jobRoles.unassigned');
    if (!acc[role]) acc[role] = { active: 0, inactive: 0 };
    if (employee.status?.toLowerCase() === "active") acc[role].active += 1;
    else acc[role].inactive += 1;
    return acc;
  }, {});
  const jobRoleLabels = Object.keys(jobRoleSummary);
  const activeJobRoleCounts = jobRoleLabels.map((role) => jobRoleSummary[role].active);
  const inactiveJobRoleCounts = jobRoleLabels.map((role) => jobRoleSummary[role].inactive);
  const jobRoleChartData = {
    labels: jobRoleLabels,
    datasets: [
      { label: t('dashboard.charts.activeEmployees'), data: activeJobRoleCounts, backgroundColor: "rgba(34, 197, 94, 0.85)", borderColor: "rgba(34, 197, 94, 1)", borderWidth: 1 },
      { label: t('dashboard.charts.inactiveEmployees'), data: inactiveJobRoleCounts, backgroundColor: "rgba(239, 68, 68, 0.85)", borderColor: "rgba(239, 68, 68, 1)", borderWidth: 1 },
    ],
  };

  // Navigation handlers
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleAttendanceDropdown = () => setAttendanceDropdownOpen(!attendanceDropdownOpen);
  const toggleOpeningsDropdown = () => setOpeningsDropdownOpen(!openingsDropdownOpen);
  const toggleSalaryDropdown = () => setSalaryDropdownOpen(!salaryDropdownOpen);
  const toggleProductsDropdown = () => setProductsDropdownOpen(!productsDropdownOpen);
  const handleLogoutClick = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutUser();
    navigate("/login", { state: { fromLogout: true }, replace: true });
  };
  const cancelLogout = () => setShowLogoutModal(false);

  // Navigation links
  const navLinks = [
    { to: "/dashboard", label: t('navigation.dashboard'), icon: <MdDashboard /> },
    { to: "/dashboard/profileform", label: t('navigation.profile'), icon: <FaRegIdCard /> },
    { to: "/dashboard/addEmp", label: t('navigation.addEmployee'), icon: <IoIosPersonAdd /> },
    { id: 'attendance', label: t('navigation.attendance'), icon: <LuNotebookPen />, dropdown: true, children: [
      { to: "/dashboard/attendance", label: t('navigation.markAttendance'), icon: <FaCalendarAlt /> },
      { to: "/dashboard/viewAtt", label: t('navigation.viewAttendance'), icon: <MdOutlinePageview /> },
      { to: "/dashboard/check-images", label: t('navigation.checkImages'), icon: <FaFileAlt /> },
    ]},
    { id: 'salary', label: t('navigation.salary'), icon: <FaRupeeSign />, dropdown: true, children: [
      { to: "/dashboard/set-salary", label: t('navigation.setSalary'), icon: <FaArrowDown className="text-blue-400" /> },
      { to: "/dashboard/salarysheet", label: t('navigation.salarySheet'), icon: <BiSolidSpreadsheet className="text-blue-400" /> },
      { to: "/dashboard/salaryslip", label: t('navigation.salarySlip'), icon: <FaReceipt className="text-blue-400" /> },
    ]},
    { to: "/dashboard/certificates", label: t('navigation.certificates'), icon: <FaFileAlt /> },
    { to: "/dashboard/expenses", label: t('navigation.expenses'), icon: <FaArrowDown /> },
    { to: "/dashboard/reminders", label: t('navigation.setReminder'), icon: <FaBell /> },
    { to: "/dashboard/leave-notification", label: t('navigation.leaveApproval'), icon: <FaExclamationTriangle /> },
    { to: "/dashboard/track-employee", label: t('navigation.trackEmployee'), icon: <FaUserCog /> },
    { id: 'openings', label: t('navigation.openings'), icon: <FaBriefcase />, dropdown: true, children: [
      { to: "/dashboard/add-openings", label: t('navigation.addOpening'), icon: <FaArrowDown className="text-blue-400" /> },
      { to: "/dashboard/resume", label: t('navigation.resume'), icon: <FaArrowDown className="text-blue-400" /> },
    ]},
    { id: 'products', label: 'Products', icon: <FaChartPie />, dropdown: true, children: [
      { to: "/dashboard/add-products", label: 'Add Products', icon: <FaArrowDown className="text-blue-400" /> },
      { to: "/dashboard/check-invoice", label: 'Check Invoice', icon: <FaReceipt className="text-blue-400" /> },
      { to: "/dashboard/check-data", label: 'Check Data', icon: <FaChartPie className="text-blue-400" /> },
    ]},
    { to: "/dashboard/emergency-message", label: t('navigation.emergencyMessage'), icon: <FaExclamationTriangle /> },
  ];

  const handleLogoError = () => {
    console.log("Error loading dashboard logo, using fallback.");
    if (logoLoadAttempt > 1) return;
    setLogoLoadAttempt((prev) => prev + 1);
  };

  useEffect(() => {
    console.log("Dashboard: Theme changed to", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Initialize FCM for notifications
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) return;

        console.log('🔄 Initializing FCM for dashboard...');

        // Setup FCM token and register with backend
        const userType = user.role === 'SUB_ADMIN' ? 'SUBADMIN' : 'EMPLOYEE';
        await firebaseService.registerTokenWithBackend(user.id, userType);

        // Setup foreground message listener
        firebaseService.setupForegroundMessageListener();

        console.log('✅ FCM initialized successfully for dashboard');
      } catch (error) {
        console.error('❌ Failed to initialize FCM for dashboard:', error);
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
          if (payload.data.type === 'LEAVE_APPLIED') {
            toast.info(`📅 ${title}: ${body}`, { autoClose: 5000 });
          } else if (payload.data.type === 'LEAVE_APPROVED') {
            toast.success(`✅ ${title}: ${body}`, { autoClose: 5000 });
          } else if (payload.data.type === 'LEAVE_REJECTED') {
            toast.error(`❌ ${title}: ${body}`, { autoClose: 5000 });
          }
        }

        // Job opening notifications
        else if (payload.data.type === 'JOB_OPENING') {
          toast.info(`🎯 ${title}: ${body}`, { autoClose: 7000 });
        }

        // Resume submission notifications
        else if (payload.data.type === 'RESUME_SUBMITTED') {
          toast.info(`📄 ${title}: ${body}`, { autoClose: 6000 });
          console.log('📄 Resume notification data:', payload.data);
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

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? "bg-gradient-to-br from-slate-900 to-blue-900 text-gray-100" : "bg-gradient-to-br from-blue-50 to-white text-gray-800"}`}>
      {showReminderPopup && currentReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"} max-w-md w-full mx-4`}>
            <button onClick={() => setShowReminderPopup(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="mb-4">
                <FaBell className="text-4xl text-yellow-500 mx-auto animate-bounce" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{t('dashboardExtended.reminders.todaysFestival')}: {currentReminder.functionName}</h3>
              <div className={`mt-4 p-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{t('dashboardExtended.reminders.date')}: {new Date(currentReminder.reminderDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBirthdayPopup && birthdayEmployees.length > 0 && (
        <ReactConfetti width={windowDimensions.width} height={windowDimensions.height} numberOfPieces={200} recycle={true} colors={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]} tweenDuration={5000} />
      )}
      {showBirthdayPopup && birthdayEmployees.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"} max-w-md w-full mx-4`}>
            <button onClick={() => setShowBirthdayPopup(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">🎂</span>
              </div>
              {birthdayEmployees.map((emp, index) => (
                <div key={index} className="mb-4">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Today is {emp.firstName} {emp.lastName}'s Birthday!</h3>
                  <p className={`mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Let's make their day special! 🎉</p>
                </div>
              ))}
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>Don't forget to wish them a fantastic birthday! 🎈</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={toggleMobileMenu} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-slate-800 text-white shadow-md">
        <div></div>
        <h1 className="text-xl font-bold animate-pulse-slow">{userData.registercompanyname || t('dashboardExtended.companyInfo.fallbackCompanyName')}</h1>
        <div className="flex items-center gap-2">
          <LanguageToggle position="right" />
        </div>
      </div>
      <aside className={`w-64 h-full ${isDarkMode ? "bg-slate-800" : "bg-white shadow-lg"} fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className={`flex flex-col items-center px-4 py-5 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-blue-50 border-blue-200"} border-b relative flex-shrink-0`}>
          <Link to="/dashboard/profileform" className="group transition-all duration-300">
            <div className={`w-24 h-24 rounded-full ${isDarkMode ? "bg-slate-100 border-blue-800" : "bg-white border-blue-500"} border-4 overflow-hidden mb-4 group-hover:border-blue-400 transition-all duration-300 shadow-lg group-hover:shadow-blue-900/40`}>
              {userData.companylogo && logoLoadAttempt < 1 ? (
                <img src={`${BACKEND_URL}/images/profile/${userData.companylogo}`} alt="Company Logo" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300" onError={(e) => { handleLogoError(); e.target.src = defaultImage; e.target.onerror = null; }} />
              ) : (
                <img src={defaultImage} alt="Admin" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300" onError={(e) => { e.target.src = "/image/lap2.jpg"; e.target.onerror = null; }} />
              )}
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"} group-hover:text-blue-400 transition-all duration-300 text-center`}>{userData.registercompanyname || t('dashboardExtended.companyInfo.fallbackCompanyName')}</h2>
            {userData.name && (
              <p className={`${isDarkMode ? "text-blue-400" : "text-blue-600"} group-hover:text-blue-300 transition-all duration-300 text-center`}>{t('dashboardExtended.companyInfo.hrmDashboard')}</p>
            )}
          </Link>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <LanguageToggle position="left" />
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-700/50 transition-all duration-300" title={isDarkMode ? t('dashboardExtended.themeToggle.switchToLight') : t('dashboardExtended.themeToggle.switchToDark')}>
              {isDarkMode ? <FaSun className="text-yellow-300 text-xl" /> : <FaMoon className="text-gray-600 text-xl" />}
            </button>
          </div>
        </div>
        <nav className="px-4 py-3 flex-grow overflow-y-auto custom-scrollbar">
          <div className="space-y-0">
            {navLinks.map((link, index) => (
              link.dropdown ? (
                <div key={index} className="mb-1 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <button onClick={link.id === "attendance" ? toggleAttendanceDropdown : link.id === "salary" ? toggleSalaryDropdown : link.id === "openings" ? toggleOpeningsDropdown : link.id === "products" ? toggleProductsDropdown : undefined} className="flex items-center justify-between w-full gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple">
                    <div className="flex items-center gap-2">{link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}</div>
                    {(link.id === "attendance" ? attendanceDropdownOpen : link.id === "salary" ? salaryDropdownOpen : link.id === "openings" ? openingsDropdownOpen : link.id === "products" ? productsDropdownOpen : false) ? (
                      <MdKeyboardArrowDown className="transition-transform duration-300 text-blue-400" />
                    ) : (
                      <MdKeyboardArrowRight className="transition-transform duration-300 text-blue-400" />
                    )}
                  </button>
                  {((link.id === "attendance" && attendanceDropdownOpen) || (link.id === "salary" && salaryDropdownOpen) || (link.id === "openings" && openingsDropdownOpen) || (link.id === "products" && productsDropdownOpen)) && (
                    <div className="pl-8 mt-1 space-y-1 animate-slideIn">
                      {link.children.map((child, childIndex) => (
                        <Link key={childIndex} to={child.to} state={child.state} className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item hover:translate-x-2" onClick={closeMobileMenu}>
                          {child.icon && <span className="text-blue-400 w-6">{child.icon}</span>} {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={index} to={link.to} className="flex items-center gap-2 p-2 my-1 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }} onClick={closeMobileMenu}>
                  {link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}
                </Link>
              )
            ))}
          </div>
        </nav>
        <div className="mt-auto px-4 pb-6 flex-shrink-0">
          <button onClick={handleLogoutClick} className="flex items-center justify-center gap-2 p-3 w-full rounded bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md btn-interactive">
            <FaSignOutAlt className="text-white" /> {t('auth.logout')}
          </button>
        </div>
      </aside>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-30" onClick={closeMobileMenu}></div>
      )}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {(window.location.pathname === "/dashboard" || window.location.pathname === "/") && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? "bg-slate-900 text-cyan-300" : "bg-white text-cyan-700"}`}>
              <span className="text-4xl mb-2">👥</span>
              <div className="text-lg font-semibold mb-1">{t('dashboard.totalEmployees')}</div>
              <div className="text-3xl font-bold">{stats.activeEmployees + stats.inactiveEmployees}</div>
            </div>
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? "bg-slate-900 text-blue-300" : "bg-white text-blue-700"}`}>
              <span className="text-4xl mb-2">👨‍💼</span>
              <div className="text-lg font-semibold mb-1">{t('dashboard.activeEmployees')}</div>
              <div className="text-3xl font-bold">{stats.activeEmployees}</div>
            </div>
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? "bg-slate-900 text-red-300" : "bg-white text-red-600"}`}>
              <span className="text-4xl mb-2">🛑</span>
              <div className="text-lg font-semibold mb-1">{t('dashboard.inactiveEmployees')}</div>
              <div className="text-3xl font-bold">{stats.inactiveEmployees}</div>
            </div>
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? "bg-slate-900 text-amber-300" : "bg-white text-amber-600"}`}>
              <span className="text-4xl mb-2">💸</span>
              <div className="text-lg font-semibold mb-1">{t('navigation.expenses')}</div>
              <div className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            </div>
          </div>
        )}
        <div className="pt-16 lg:pt-0 h-full page-transition-container animate-fadeIn">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="addEmp" element={<AddEmp />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="set-salary" element={<SetSalary />} />
            <Route path="salarysheet" element={<SalarySheet />} />
            <Route path="salaryslip" element={<SalarySlip />} />
            <Route path="viewAtt" element={<ViewAttendanceFixed />} />
            <Route path="check-images" element={<CheckImages />} />
            <Route path="profileform" element={<ProfileForm />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="notification-test" element={<NotificationTest />} />
            <Route path="fcm-test" element={<FCMTest />} />
            <Route path="token-debugger" element={<TokenDebugger />} />
            <Route path="notification-debugger" element={<NotificationDebugger />} />
            <Route path="track-employee" element={<TrackEmployee />} />
            <Route path="add-openings" element={<AddOpenings />} />
            <Route path="resume" element={<Resume />} />
            <Route path="emergency-message" element={<EmergencyMessage />} />
            <Route path="add-products" element={<AddProducts />} />
            <Route path="check-invoice" element={<CheckInvoice />} />
            <Route path="check-data" element={<CheckData />} />
            <Route path="*" element={<DashoBoardRouter />} />
          </Routes>
        </div>
      </main>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" onClick={cancelLogout}></div>
          <div className="bg-slate-800 rounded-lg shadow-xl border border-orange-800 w-full max-w-md p-6 z-10 animate-scaleIn transform transition-all duration-300">
            <div className="flex items-center mb-4 text-orange-500">
              <FaExclamationTriangle className="text-2xl mr-3 animate-pulse" />
              <h3 className="text-xl font-semibold">{t('messages.confirmLogout')}</h3>
              <button onClick={cancelLogout} className="ml-auto p-1 hover:bg-slate-700 rounded-full transition-colors duration-200">
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="mb-6">
              <p className="mb-2 text-gray-200">{t('messages.confirmLogout')}</p>
              <p className="text-gray-400 text-sm">{t('messages.sessionExpired')}</p>
            </div>
            <div className="flex space-x-3 justify-end">
              <button onClick={cancelLogout} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                {t('common.cancel')}
              </button>
              <button onClick={confirmLogout} className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                <FaSignOutAlt className="transform group-hover:translate-x-[-2px] transition-transform duration-300" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;