import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import axios from "axios";
import "./animations.css";
import { FaUsers, FaUserCheck, FaUserMinus, FaBriefcase, FaArrowUp, FaArrowDown, FaUserCog } from "react-icons/fa";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const { emp, isDarkMode } = useApp();
  const { t } = useTranslation();

  // Defensive: fallback to empty array if emp is undefined 
  const employees = Array.isArray(emp) ? emp : [];

  // Calculate stats based on context data with robust status normalization
  const activeEmp = employees.filter((employee) => String(employee.status).toLowerCase() === "active");
  const inactiveEmp = employees.filter((employee) => String(employee.status).toLowerCase() === "inactive");
  const activeEmpCount = activeEmp.length;
  const inactiveEmpCount = inactiveEmp.length;

  // For salary calculations using actual data
  const activeSalary = activeEmp.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0);
  const inactiveSalary = inactiveEmp.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0);
  const totalSalary = activeSalary + inactiveSalary;
  const companyBudget = 1000000; // 10 lakh budget
  const profitLoss = companyBudget - totalSalary;
  const isProfitable = profitLoss > 0;

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: activeEmpCount,
    inactiveEmployees: inactiveEmpCount,
    totalSalary,
    activeSalary,
    inactiveSalary,
    profitLoss
  };

  // Prepare pie chart data for employee status
  const activePercentage = stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0;
  const inactivePercentage = stats.totalEmployees > 0 ? Math.round((stats.inactiveEmployees / stats.totalEmployees) * 100) : 0;

  const employeeStatusData = {
    labels: [
      `Active (${stats.activeEmployees}) ${activePercentage}%`,
      `Inactive (${stats.inactiveEmployees}) ${inactivePercentage}%`
    ],
    datasets: [
      {
        data: [stats.activeEmployees, stats.inactiveEmployees],
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',   // Blue for active
          'rgba(239, 68, 68, 0.85)',    // Red for inactive
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };

  // Group employees by job role and count active/inactive for each role using actual data
  const jobRoleSummary = employees.reduce((acc, employee) => {
    let role = (employee.jobRole || "Undefined").trim();
    if (role.toUpperCase().includes("MERN") && role.toUpperCase().includes("STACK") && role.toUpperCase().includes("DEVELOPER")) {
      role = "MERN STACK DEVELOPER";
    }
    if (role.toUpperCase().includes("JAVA") && role.toUpperCase().includes("FULL") && role.toUpperCase().includes("STACK")) {
      role = "JAVA FULL STACK";
    }
    if (!acc[role]) {
      acc[role] = { active: 0, inactive: 0 };
    }
    if (String(employee.status).toLowerCase() === "active") {
      acc[role].active += 1;
    } else if (String(employee.status).toLowerCase() === "inactive") {
      acc[role].inactive += 1;
    }
    return acc;
  }, {});

  // Create a table-like data structure for job roles and their statuses
  const jobRoleTable = Object.entries(jobRoleSummary).map(([role, counts]) => ({
    role,
    active: counts.active,
    inactive: counts.inactive,
    total: counts.active + counts.inactive
  }));

  // Update chart options based on theme
  const chartOptions = {
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
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
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
        borderColor: isDarkMode ? '#475569' : '#cbd5e1',
        borderWidth: 0,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
          labelTextColor: () => '#ffffff'
        }
      }
    }
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'text-white' : 'text-gray-800'} animate-fadeIn`}>
      {/* Stats Cards Section */}

      {/* Employee Status and Role Distribution Section */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} p-6 rounded-lg shadow-lg mt-6`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>{t('dashboard.employeeOverview')}</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Status Pie Chart */}
          <div>
            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>{t('dashboard.statusDistribution')}</h4>
            <div className="h-72">
              <Pie data={employeeStatusData} options={chartOptions} />
            </div>
            <div className="mt-4 flex justify-center space-x-8">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('common.active')} ({stats.activeEmployees}) <span className="ml-1 font-medium">{activePercentage}%</span></span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Inactive ({stats.inactiveEmployees})<span className="ml-1 font-medium">{inactivePercentage}%</span></span>
              </div>
            </div>
          </div>
          {/* Employee Role Distribution */}
          <div>
            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>Role Distribution</h4>
            <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-4 h-72 overflow-auto`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <th className={`text-left py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Inactive</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(jobRoleSummary)
                    .sort((a, b) => (b[1].active + b[1].inactive) - (a[1].active + a[1].inactive))
                    .map(([role, counts], index) => (
                      <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{role || 'Undefined'}</td>
                        <td className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.active + counts.inactive}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.active}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.inactive}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;