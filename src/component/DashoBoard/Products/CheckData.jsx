import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, FileText, DollarSign, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useApp } from "../../../context/AppContext";

const CheckData = () => {
  const { isDarkMode } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get subadminId from user object in localStorage
  const getSubadminId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      return user.id || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const subadminId = getSubadminId();
  const API_URL = 'http://localhost:8081/api/invoices';

  // If no subadminId, show error message
  if (!subadminId) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-gradient-to-br from-indigo-50 to-purple-100 text-gray-800"} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center`}>
            <h1 className="text-2xl font-bold text-red-800 mb-4">Access Error</h1>
            <p className="text-red-600 mb-4">
              Unable to access Analytics Dashboard. Please log in again or contact your administrator.
            </p>
            <p className="text-sm text-gray-600">
              Required: Subadmin ID not found in user session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${subadminId}/summary`);
      if (response.data.success) {
        setSummary(response.data.summary);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary(null);
      if (error.code !== 'ERR_NETWORK') {
        alert('Failed to fetch analytics data: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const prepareSalesPerEmployeeData = () => {
    if (!summary?.salesPerEmployee) return [];
    return summary.salesPerEmployee.map(emp => ({
      name: emp.employeeName,
      sales: emp.totalSales,
      invoices: emp.invoiceCount
    }));
  };

  const preparePieChartData = () => {
    if (!summary?.salesPerEmployee) return [];
    return summary.salesPerEmployee.map(emp => ({
      name: emp.employeeName,
      value: emp.totalSales
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-gradient-to-br from-indigo-50 to-purple-100 text-gray-800"} p-6`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-4xl font-bold mb-8 ${isDarkMode ? "text-blue-400" : "text-gray-800"}`}>Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products Card */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gradient-to-br from-blue-500 to-blue-600"} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Products</p>
                <h3 className="text-4xl font-bold mt-2">{summary.totalProducts || 0}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Package size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-blue-100 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>Products in catalog</span>
            </div>
          </div>

          {/* Total Invoices Card */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gradient-to-br from-green-500 to-green-600"} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Invoices</p>
                <h3 className="text-4xl font-bold mt-2">{summary.totalInvoices || 0}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FileText size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-green-100 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>Invoices generated</span>
            </div>
          </div>

          {/* Total Sales Card */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gradient-to-br from-purple-500 to-purple-600"} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Sales</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(summary.totalSales || 0)}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <DollarSign size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-purple-100 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>Revenue generated</span>
            </div>
          </div>

          {/* Active Employees Card */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gradient-to-br from-orange-500 to-orange-600"} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Sales Team</p>
                <h3 className="text-4xl font-bold mt-2">{summary.salesPerEmployee?.length || 0}</h3>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Users size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-orange-100 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>Active sales employees</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart - Sales per Employee */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? "text-blue-400" : "text-gray-800"}`}>Sales Performance by Employee</h2>
            {summary.salesPerEmployee && summary.salesPerEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={prepareSalesPerEmployeeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'sales') return [formatCurrency(value), 'Total Sales'];
                      return [value, 'Invoices'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Total Sales (₹)" />
                  <Bar dataKey="invoices" fill="#82ca9d" name="Invoice Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-350 flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </div>

          {/* Pie Chart - Sales Distribution */}
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? "text-blue-400" : "text-gray-800"}`}>Sales Distribution by Employee</h2>
            {summary.salesPerEmployee && summary.salesPerEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={preparePieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {preparePieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-350 flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Employee Performance Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h2 className="text-2xl font-semibold text-white">Employee Performance Details</h2>
          </div>

          {summary.salesPerEmployee && summary.salesPerEmployee.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invoices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Sale Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.salesPerEmployee.map((employee, index) => {
                    const avgSale = employee.invoiceCount > 0 ? employee.totalSales / employee.invoiceCount : 0;
                    const performancePercent = summary.totalSales > 0 ? (employee.totalSales / summary.totalSales) * 100 : 0;
                    
                    return (
                      <tr key={employee.employeeId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                            <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.employeeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                            {employee.invoiceCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(employee.totalSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(avgSale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                style={{ width: `${Math.min(performancePercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{performancePercent.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No employee performance data available
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Average Invoice Value</h3>
            <p className="text-3xl font-bold text-blue-600">
              {summary.totalInvoices > 0 ? formatCurrency(summary.totalSales / summary.totalInvoices) : formatCurrency(0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Per invoice average</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Performer</h3>
            <p className="text-2xl font-bold text-green-600">
              {summary.salesPerEmployee && summary.salesPerEmployee.length > 0 
                ? summary.salesPerEmployee[0].employeeName 
                : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {summary.salesPerEmployee && summary.salesPerEmployee.length > 0 
                ? formatCurrency(summary.salesPerEmployee[0].totalSales)
                : 'No sales yet'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Products per Invoice</h3>
            <p className="text-3xl font-bold text-purple-600">
              {summary.totalInvoices > 0 && summary.totalProducts > 0 
                ? (summary.totalProducts / summary.totalInvoices).toFixed(2)
                : '0.00'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Average ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckData;
