import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { toast } from "react-toastify";
import { FaCalculator, FaSave, FaPercent, FaRupeeSign } from "react-icons/fa";
import { MdSettings } from "react-icons/md";

const API_URL = "https://api.managifyhr.com/api";

const SetSalary = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState({
    basicPercentage: 50.0,
    hraPercentage: 10.0,
    daPercentage: 53.0,
    specialAllowancePercentage: 37.0,
    professionalTax: 0.0,
    tdsPercentage: 0.0,
    transportAllowance: 0.0,
    medicalAllowance: 0.0,
    foodAllowance: 0.0,
    pfPercentage: 0.0,
    esiPercentage: 0.0
  });

  const getSubadminId = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user?.id;
    }
    return null;
  };

  useEffect(() => {
    fetchSalaryConfiguration();
  }, []);

  const fetchSalaryConfiguration = async () => {
    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error("Unable to identify user. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/salary-config/${subadminId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        console.log("Using default configuration");
      }
    } catch (error) {
      console.error('Error fetching salary configuration:', error);
      toast.error("Failed to load salary configuration");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleInputChange = (field, value) => {
    let numValue = parseFloat(value) || 0;

    // Validate individual percentage fields to not exceed 100%
    const percentageFields = ['basicPercentage', 'hraPercentage', 'daPercentage', 'specialAllowancePercentage', 'tdsPercentage', 'pfPercentage', 'esiPercentage'];
    if (percentageFields.includes(field) && numValue > 100) {
      numValue = 100;
      toast.error(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} cannot exceed 100%`);
    }

    // Create temporary config to check total allowances
    const tempConfig = { ...config, [field]: numValue };

    // Check if total allowances exceed 100%
    const allowanceFields = ['hraPercentage', 'daPercentage', 'specialAllowancePercentage'];
    if (allowanceFields.includes(field)) {
      const totalAllowances = tempConfig.hraPercentage + tempConfig.daPercentage + tempConfig.specialAllowancePercentage;
      if (totalAllowances > 100) {
        toast.error('Total allowances cannot exceed 100% of Basic Salary! Please adjust other allowances first.');
        return; // Don't update the state if total exceeds 100%
      }
    }

    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error("Unable to identify user. Please log in again.");
      return;
    }

    // Validate percentages
    if (config.basicPercentage < 0 || config.basicPercentage > 100) {
      toast.error("Basic percentage must be between 0 and 100");
      return;
    }

    // Check if total allowances exceed 100%
    const totalAllowances = config.hraPercentage + config.daPercentage + config.specialAllowancePercentage;
    if (totalAllowances > 100) {
      toast.error('Cannot save configuration! Total allowances exceed 100%. Please adjust the values.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/salary-config/${subadminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        const successMessage = result.message || "Configuration saved successfully!";

        toast.success(successMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

      } else {
        const errorText = await response.text();
        toast.error(`Failed to save configuration: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving salary configuration:', error);
      toast.error("Failed to save salary configuration. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading salary configuration...</span>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-3 rounded-md shadow-md mt-4 ${
      isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <MdSettings className="text-lg text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Set Salary Configuration
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure salary calculations for all employees
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Basic Salary Configuration */}
        <div className={`p-3 rounded-md border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
            <FaCalculator className="text-green-500 text-sm" />
            Basic Salary Structure (% of CTC)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Basic Salary (% of CTC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.basicPercentage}
                  onChange={(e) => handleInputChange('basicPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-1.5 pr-6 text-sm rounded-md border focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Allowances Configuration */}
        <div className={`p-3 rounded-md border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
            <FaRupeeSign className="text-green-500 text-sm" />
            Allowances (% of Basic Salary)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                HRA (% of Basic) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.hraPercentage}
                  onChange={(e) => handleInputChange('hraPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-1.5 pr-6 text-sm rounded-md border focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                DA (% of Basic)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.daPercentage}
                  onChange={(e) => handleInputChange('daPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-2 pr-8 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Special Allowance (% of Basic)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.specialAllowancePercentage}
                  onChange={(e) => handleInputChange('specialAllowancePercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-2 pr-8 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          <div className={`mt-3 p-2 rounded-md ${
            (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 100
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 90
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <p className={`text-sm ${
              (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 100
                ? 'text-red-700 dark:text-red-300'
                : (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 90
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-blue-700 dark:text-blue-300'
            }`}>
              <strong>Total Allowances:</strong> {(config.hraPercentage + config.daPercentage + config.specialAllowancePercentage).toFixed(1)}% of Basic Salary
              {(config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 100 && (
                <span className="text-red-600 ml-2 font-semibold">🚫 Exceeds 100%! Please reduce allowances.</span>
              )}
              {(config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 90 &&
               (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) <= 100 && (
                <span className="text-yellow-600 ml-2">⚠️ Close to limit!</span>
              )}
            </p>
          </div>
        </div>

        {/* Fixed Allowances */}
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaRupeeSign className="text-blue-500" />
            Fixed Allowances (Monthly Amount)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Transport Allowance (₹)
              </label>
              <input
                type="number"
                value={config.transportAllowance}
                onChange={(e) => handleInputChange('transportAllowance', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Medical Allowance (₹)
              </label>
              <input
                type="number"
                value={config.medicalAllowance}
                onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Food Allowance (₹)
              </label>
              <input
                type="number"
                value={config.foodAllowance}
                onChange={(e) => handleInputChange('foodAllowance', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className={`p-6 rounded-lg border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaPercent className="text-red-500" />
            Deductions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Professional Tax (₹)
              </label>
              <input
                type="number"
                value={config.professionalTax}
                onChange={(e) => handleInputChange('professionalTax', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                TDS (% of Gross)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.tdsPercentage}
                  onChange={(e) => handleInputChange('tdsPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                PF (% of Basic)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.pfPercentage}
                  onChange={(e) => handleInputChange('pfPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ESI (% of Gross)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.esiPercentage}
                  onChange={(e) => handleInputChange('esiPercentage', e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={loading || (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 100}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-semibold text-white transition-all duration-200 ${
              loading || (config.hraPercentage + config.daPercentage + config.specialAllowancePercentage) > 100
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetSalary;
