import React, { useEffect, useState } from "react";
import { FaBuilding, FaCheckCircle, FaTimesCircle, FaChartPie } from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import "../DashoBoard/animations.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  // Stats for companies
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0
  });
  const [loading, setLoading] = useState(true);
  const [isProfitable, setIsProfitable] = useState(false);

  useEffect(() => {
    // Function to fetch companies and calculate stats
    const fetchCompaniesAndCalculateStats = async () => {
      try {
        setLoading(true);
        
        // Fetch companies directly from the API instead of localStorage
        const response = await fetch('http://localhost:8282/api/subadmin/all');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const companies = await response.json();
        console.log('Fetched companies for dashboard:', companies);
        
        // Calculate stats from the fetched companies
        const activeCompanies = companies.filter(company => 
          company.status && company.status.toLowerCase() === 'active'
        ).length;
        
        const inactiveCompanies = companies.filter(company => 
          !company.status || company.status.toLowerCase() !== 'active'
        ).length;
        
        // Determine profitability - more active than inactive companies
        const profitable = activeCompanies > inactiveCompanies;
        setIsProfitable(profitable);
        
        setStats({
          totalCompanies: companies.length,
          activeCompanies,
          inactiveCompanies
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies and calculating stats:", error);
        setLoading(false);
      }
    };
    
    // Fetch companies and calculate stats on mount
    fetchCompaniesAndCalculateStats();
    
    // Add event listener for updates
    window.addEventListener('companiesUpdated', fetchCompaniesAndCalculateStats);
    
    return () => {
      window.removeEventListener('companiesUpdated', fetchCompaniesAndCalculateStats);
    };
  }, []);

  // Component for stat card
  const StatCard = ({ icon, title, count, bgColor }) => (
    <div className={`p-6 rounded-xl shadow-lg ${bgColor} border border-slate-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-800/50 p-3 rounded-full">
          {icon}
        </div>
        <div>
          <p className="text-lg font-medium text-gray-200">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{loading ? '...' : count}</h3>
        </div>
      </div>
    </div>
  );

  // Prepare chart data
  const chartData = {
    labels: ['Active Companies', 'Inactive Companies'],
    datasets: [
      {
        data: [stats.activeCompanies, stats.inactiveCompanies],
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
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Thinner donut style
    radius: '85%',
    plugins: {
      legend: {
        display: false // Hide default legend, we'll create a custom one
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
            return `${value} ${label} (${percentage}%)`;
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
  };

  return (
    <div className="p-6 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to your HRM Dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon={<FaBuilding className="text-blue-400 text-2xl" />} 
          title="Total Companies" 
          count={stats.totalCompanies}
          bgColor="bg-gradient-to-br from-blue-900 to-indigo-800"
        />
        
        <StatCard 
          icon={<FaCheckCircle className="text-green-400 text-2xl" />} 
          title="Active Companies" 
          count={stats.activeCompanies}
          bgColor="bg-gradient-to-br from-green-900 to-green-800"
        />
        
        <StatCard 
          icon={<FaTimesCircle className="text-red-400 text-2xl" />} 
          title="Inactive Companies" 
          count={stats.inactiveCompanies}
          bgColor="bg-gradient-to-br from-red-900 to-red-800"
        />
      </div>
      
      {/* Pie Chart Section */}
      <div className="mt-8 bg-slate-900/70 rounded-xl p-6 border border-slate-700 shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-900/50 rounded-full text-blue-400">
            <FaChartPie className="text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Company Status Analysis</h2>
            <p className={`text-sm mt-1 ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {isProfitable 
                ? '✓ Profitable: More active than inactive companies' 
                : '✗ Loss: More inactive than active companies'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart */}
          <div className="h-80 animate-fadeIn relative rounded-lg overflow-hidden shadow-lg bg-slate-900/90 p-2">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : (
              <div className="h-full w-full relative flex items-center justify-center">
                {/* Glowing background effect */}
                <div className="absolute inset-0 blur-xl">
                  <div className="absolute h-32 w-32 rounded-full left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-sky-500/30"></div>
                  <div className="absolute h-32 w-32 rounded-full right-1/4 bottom-1/4 transform translate-x-1/2 translate-y-1/2 bg-pink-500/30"></div>
                </div>
                
                {/* Inner content container */}
                <div className="relative h-full w-full flex flex-col items-center justify-center px-4">
                  {/* Chart */}
                  <div className="relative h-3/4 w-full max-w-xs">
                    <Pie data={chartData} options={chartOptions} />
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                      <span className="text-gray-300 text-sm font-medium">Status</span>
                      <span className={`text-2xl font-bold ${isProfitable ? 'text-sky-400' : 'text-pink-400'}`}>
                        {isProfitable ? 'Profit' : 'Loss'}
                      </span>
                      <span className="text-gray-400 text-xs mt-1">
                        {stats.totalCompanies} Companies
                      </span>
                    </div>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="flex justify-center items-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm bg-sky-400"></span>
                      <span className="text-sm text-gray-300">Active ({stats.activeCompanies})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm bg-pink-400"></span>
                      <span className="text-sm text-gray-300">Inactive ({stats.inactiveCompanies})</span>
                    </div>
                  </div>
                </div>
                
                {/* Subtle animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-pink-500/5 opacity-50 animate-pulse-slow"></div>
              </div>
            )}
          </div>
          
          {/* Analysis */}
          <div className="flex flex-col justify-center space-y-6 p-4">
            <div className={`rounded-lg p-5 ${isProfitable ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <h3 className="text-lg font-semibold mb-2">
                <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>Status Summary</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Companies:</span>
                  <span className="font-bold text-green-400">{stats.activeCompanies}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Inactive Companies:</span>
                  <span className="font-bold text-red-400">{stats.inactiveCompanies}</span>
                </div>
                
                <div className="border-t border-slate-700 my-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Percentage:</span>
                    <span className={`font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.totalCompanies > 0 
                        ? `${Math.round((stats.activeCompanies / stats.totalCompanies) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                {isProfitable
                  ? 'Your business is performing well with more active companies than inactive ones.'
                  : 'Consider focusing on activating more companies to improve performance.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 