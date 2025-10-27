import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AppContext = createContext();

export const useApp = () => {
  return useContext(AppContext);
};

// Removed all axios defaults and configurations

// Mock static employee data
const STATIC_EMPLOYEES = [
  {
    empId: 1,
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    phone: 9876543210,
    aadharNo: "1234 5678 9012",
    panCard: "ABCDE1234F",
    education: "graduate",
    bloodGroup: "o+",
    jobRole: "JAVA FULL STACK DEVELOPER",
    gender: "male",
    address: "123 Main St, Mumbai",
    birthDate: "1990-01-15",
    joiningDate: "2022-03-01",
    status: "Active",
    bankName: "State Bank of India",
    bankAccountNo: "12345678901",
    bankIfscCode: "SBIN0123456",
    branchName: "Andheri",
    salary: 65000,
    company: "ABC Pvt Ltd",
    roll: "EMPLOYEE"
  },
  {
    empId: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "janesmith@example.com",
    phone: 8765432109,
    aadharNo: "9876 5432 1098",
    panCard: "FGHIJ5678K",
    education: "post-graduate",
    bloodGroup: "b+",
    jobRole: "HR",
    gender: "female",
    address: "456 Park Avenue, Delhi",
    birthDate: "1992-05-20",
    joiningDate: "2021-06-15",
    status: "Active",
    bankName: "HDFC Bank",
    bankAccountNo: "98765432109",
    bankIfscCode: "HDFC0123456",
    branchName: "Connaught Place",
    salary: 75000,
    company: "ABC Pvt Ltd",
    roll: "EMPLOYEE"
  },
  {
    empId: 3,
    firstName: "Aditya",
    lastName: "Jadhav",
    email: "aditya.jadhav@example.com",
    phone: 7654321098,
    aadharNo: "8765 4321 0987",
    panCard: "LMNOP6789Q",
    education: "graduate",
    bloodGroup: "a+",
    jobRole: "MERN STACK DEVELOPER",
    gender: "male",
    address: "789 Tech Park, Pune",
    birthDate: "1994-08-12",
    joiningDate: "2023-01-10",
    status: "Active",
    bankName: "ICICI Bank",
    bankAccountNo: "87654321098",
    bankIfscCode: "ICIC0123456",
    branchName: "Hinjewadi",
    salary: 70000,
    company: "ABC Pvt Ltd",
    roll: "EMPLOYEE"
  },
  {
    empId: 4,
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@example.com",
    phone: 6543210987,
    aadharNo: "7654 3210 9876",
    panCard: "QRSTU7890V",
    education: "post-graduate",
    bloodGroup: "ab+",
    jobRole: "DIGITAL MARKETING INTERN",
    gender: "female",
    address: "101 Garden Road, Bangalore",
    birthDate: "1996-11-25",
    joiningDate: "2022-07-05",
    status: "Inactive",
    bankName: "Axis Bank",
    bankAccountNo: "76543210987",
    bankIfscCode: "UTIB0123456",
    branchName: "Koramangala",
    salary: 45000,
    company: "ABC Pvt Ltd",
    roll: "EMPLOYEE"
  }
];

// Add error tracking to prevent duplicate notifications
let lastErrorMessage = null;
let lastErrorTime = 0;
let errorCount = 0;

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      // Clear the corrupted data
      localStorage.removeItem("user");
      return null;
    }
  });
  
  const [emp, setEmp] = useState(STATIC_EMPLOYEES);
  const [role, setRole] = useState(user?.role || "");
  const [loading, setLoading] = useState(false);
  const [isProfitable, setIsProfitable] = useState(true);
  const [companyBudget] = useState(1000000); // 10 lakh budget
  const [stats, setStats] = useState({
    totalEmployees: STATIC_EMPLOYEES.length,
    activeEmployees: STATIC_EMPLOYEES.filter(employee => employee.status === "Active" || employee.status === "active").length,
    inactiveEmployees: STATIC_EMPLOYEES.filter(employee => employee.status === "Inactive" || employee.status === "inactive").length,
    totalSalary: STATIC_EMPLOYEES.reduce((sum, employee) => sum + (parseFloat(employee.salary) || 0), 0),
    activeSalary: STATIC_EMPLOYEES.filter(e => e.status === "Active" || e.status === "active")
      .reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0),
    inactiveSalary: STATIC_EMPLOYEES.filter(e => e.status === "Inactive" || e.status === "inactive")
      .reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0),
    profitLoss: 1000000 - STATIC_EMPLOYEES.reduce((sum, employee) => sum + (parseFloat(employee.salary) || 0), 0)
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error("Error storing user in localStorage:", error);
      }
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const loginUser = async (email, password) => {
    try {
      // Static login authentication
      let userData = null;
      
      // Master Admin login
      if (email === "9763746539" && password === "9763746539") {
        userData = {
          id: 1,
          email: "masteradmin@example.com",
          role: "MASTER_ADMIN",
          name: "Master Admin"
        };
      } 
      // Sub Admin login
      else if (email === "8080276014" && password === "8080276014") {
        userData = {
          id: 2,
          email: "subadmin@example.com",
          company: "ABC Pvt Ltd",
          registercompanyname: "ABC Pvt Ltd",
          role: "SUBADMIN",
          name: "Sub Admin"
        };
      } else {
        throw new Error("Invalid credentials");
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const saveUser = async (userData) => {
    try {
      // Simulate API response
      setUser({...userData, id: Date.now()});
      console.log("User saved:", userData);
      return {user: userData};
    } catch (error) {
      console.error("Failed to save user:", error);
      throw error;
    }
  };

  const logoutUser = () => {
    console.log("Explicit logout requested by user action");
    // Clear user data
    setUser(null);
    setEmp(STATIC_EMPLOYEES);
    // Clear local storage
    localStorage.removeItem('user');
    // Navigate to logout page with specific flag
    navigate('/logout', { state: { manualLogout: true } });
  };

  const fetchUserProfile = async () => {
    // Return static user profile
    console.log("Fetching user profile (static)");
    return user;
  };

  const forgotPassword = async (updatedUser) => {
    // Simulate password reset
    console.log("Password reset successful for:", updatedUser.email);
    toast.success("Password reset successful");
    return true;
  };

  const addEmp = async (userData) => {
    try {
      // Generate a new ID
      const newId = Math.max(...emp.map(e => e.empId)) + 1;
      
      // Create new employee object
      const newEmployee = {
        ...userData,
        empId: newId,
        phone: typeof userData.phone === 'string' ? parseInt(userData.phone, 10) : userData.phone,
        salary: typeof userData.salary === 'string' ? parseInt(userData.salary, 10) : userData.salary,
        status: userData.status || "Active",
        roll: "EMPLOYEE",
        company: userData.company || user?.registercompanyname || user?.company || "ABC Pvt Ltd",
        registerCompanyName: userData.company || user?.registercompanyname || user?.company || "ABC Pvt Ltd",
        subAdminId: user?.id || null,
        subAdminName: user?.name || null
      };
      
      // Add to local state
      setEmp(prevEmp => [...prevEmp, newEmployee]);
      
      // Update stats
      calculateStats([...emp, newEmployee]);
      
      // Success message
      toast.success("Employee added successfully!");
      return newEmployee;
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
      throw error;
    }
  };

  const createAttendance = async (attendanceData, email) => {
    try {
      // Simulate API call
      console.log("Creating attendance for:", email, attendanceData);
      toast.success("Attendance created successfully");
      return { id: Date.now(), ...attendanceData, email };
    } catch (err) {
      console.error("Failed to create attendance:", err.message);
      toast.error("Failed to create attendance");
      throw err;
    }
  };

  const fetchAllEmp = async () => {
    try {
      setLoading(true);
      
      // Check if we're on the login page, masteradmin or dashboard routes
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/login');
      const isMasterAdminRoute = currentPath.includes('/masteradmin');
      const isDashboardRoute = currentPath.includes('/dashboard');
      
      // Get the current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!currentUser || !currentUser.id) {
        // If we're on the login page, masteradmin or dashboard routes, or if this is the initial mount (no user yet), do NOT throw error or log
        if (isLoginPage || isMasterAdminRoute || isDashboardRoute || !localStorage.getItem('user')) {
          setLoading(false);
          return [];
        }
        // Only show error if a user object was present but invalid (corrupt/missing id)
        throw new Error('User information not found');
      }
      
      // Use the current user's SubAdmin ID instead of hardcoding it
      const subAdminId = currentUser.id;
      console.log('Fetching employees for SubAdmin ID:', subAdminId);
      
      // Fetch employees from the backend API with the dynamic SubAdmin ID
      const response = await axios.get(`https://api.managifyhr.com/api/employee/${subAdminId}/employee/all`);
      let employeesData = response.data;
      // Fix: Ensure employeesData is always an array
      if (!Array.isArray(employeesData)) {
        employeesData = [];
      }
      setEmp(employeesData);
      calculateStats(employeesData);
      setLoading(false);
      return employeesData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
      
      // Check if we're on routes where we should suppress error messages
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/login');
      const isMasterAdminRoute = currentPath.includes('/masteradmin');
      const isDashboardRoute = currentPath.includes('/dashboard');
      
      // If API fails, use static data as fallback
      setEmp(STATIC_EMPLOYEES);
      calculateStats(STATIC_EMPLOYEES);
      
      // Only show error toast if not on login page, masteradmin, dashboard, or if no user is present
      if (!isLoginPage && !isMasterAdminRoute && !isDashboardRoute && localStorage.getItem('user')) {
        toast.error('Failed to fetch employees: ' + (error.response?.data?.message || error.message));
      }
      
      return STATIC_EMPLOYEES;
    }
  };

  const calculateStats = (employees) => {
    try {
      const activeEmployees = employees.filter(employee => employee.status === "Active" || employee.status === "active");
      const inactiveEmployees = employees.filter(employee => employee.status === "Inactive" || employee.status === "inactive");
      
      const activeSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const inactiveSalary = inactiveEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const totalSalary = activeSalary + inactiveSalary;
      
      const profitLoss = companyBudget - totalSalary;
      const profitable = profitLoss > 0;
      setIsProfitable(profitable);
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: inactiveEmployees.length,
        totalSalary,
        activeSalary,
        inactiveSalary,
        profitLoss
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  // Define yearlyData which was missing
  const yearlyData = [
    { year: '2020', profit: 80000, loss: 20000 },
    { year: '2021', profit: 90000, loss: 15000 },
    { year: '2022', profit: 120000, loss: 25000 },
    { year: '2023', profit: 150000, loss: 30000 },
    { year: '2024', profit: 200000, loss: 40000 },
  ];

  // Other chart data remains unchanged...

  const deleteEmployee = async (empId) => {
    try {
      // Remove from local array
      setEmp(prevEmp => prevEmp.filter(emp => emp.empId !== empId));
      
      // Update stats
      const updatedEmployees = emp.filter(employee => employee.empId !== empId);
      calculateStats(updatedEmployees);
      
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  const updateEmployee = async (empId, updatedData) => {
    try {
      // Format data
      const formattedData = {
        ...updatedData,
        phone: typeof updatedData.phone === 'string' ? parseInt(updatedData.phone, 10) : updatedData.phone,
        salary: typeof updatedData.salary === 'string' ? parseInt(updatedData.salary, 10) : updatedData.salary
      };
      
      // Update in local array
      setEmp(prevEmp => prevEmp.map(emp => 
        emp.empId === empId ? {...emp, ...formattedData} : emp
      ));
      
      // Update stats
      const updatedEmployees = emp.map(employee => 
        employee.empId === empId ? {...employee, ...formattedData} : employee
      );
      calculateStats(updatedEmployees);
      
      toast.success("Employee updated successfully");
      return {...updatedData, empId};
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee");
      throw error;
    }
  };

  useEffect(() => {
    // Initial load of employees
    fetchAllEmp();
  }, []);

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; // Default to dark mode if not set
  });

  // Toggle theme function
  const toggleTheme = () => {
    console.log("Toggling theme", isDarkMode, "to", !isDarkMode);
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    
let id =localStorage.getItem("user", JSON.stringify(user));
console.log("User ID from localStorage:", id.id);

    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  };

  // Apply theme on initial load
  useEffect(() => {
    console.log("Applying theme on load:", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const value = {
    loading,
    user,
    setUser,
    emp,
    stats,
    isProfitable,
    companyBudget,
    loginUser,
    saveUser,
    logoutUser,
    fetchUserProfile,
    forgotPassword,
    addEmp,
    deleteEmployee,
    updateEmployee,
    createAttendance,
    fetchAllEmp,
    yearlyData,
    isDarkMode,
    toggleTheme,
    pieChartData: {
      labels: ['Active Salary', 'Inactive Salary'],
      datasets: [
        {
          data: [stats.activeSalary, stats.inactiveSalary],
          backgroundColor: [
            'rgba(56, 189, 248, 0.85)',   // Sky blue for active
            'rgba(251, 113, 133, 0.85)',  // Modern pink for inactive
          ],
          borderColor: [
            'rgba(56, 189, 248, 1)',
            'rgba(251, 113, 133, 1)',
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            'rgba(56, 189, 248, 1)',
            'rgba(251, 113, 133, 1)',
          ],
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
          borderRadius: 6,
          spacing: 8,
          offset: 6,
        },
      ],
    },
    barChartData: {
      labels: yearlyData.map(item => item.year),
      datasets: [
        {
          label: 'Profit',
          data: yearlyData.map(item => item.profit),
          backgroundColor: 'rgba(56, 189, 248, 0.85)',
          borderColor: 'rgba(56, 189, 248, 1)',
          borderWidth: 1,
        },
        {
          label: 'Loss',
          data: yearlyData.map(item => item.loss),
          backgroundColor: 'rgba(251, 113, 133, 0.85)',
          borderColor: 'rgba(251, 113, 133, 1)',
          borderWidth: 1,
        }
      ],
    },
    chartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      radius: '85%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: {
            size: 16,
            weight: 'bold'
          },
          bodyFont: {
            size: 14
          },
          padding: 15,
          cornerRadius: 8,
          caretSize: 0,
          borderColor: '#475569',
          borderWidth: 0,
          displayColors: false,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
            },
            labelTextColor: () => '#ffffff'
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutCirc',
        delay: (context) => context.dataIndex * 200
      },
      elements: {
        arc: {
          borderWidth: 0
        }
      }
    },
    barChartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#475569',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: (value) => `₹${value.toLocaleString()}`
          }
        }
      }
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
