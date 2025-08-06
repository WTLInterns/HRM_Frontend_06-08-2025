import React, { useEffect, useState } from 'react';
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { toast } from "react-toastify";
import { FaCalculator, FaSave, FaPercent, FaRupeeSign, FaEye } from "react-icons/fa";
import { MdSettings } from "react-icons/md";
import axios from 'axios';

const API_URL = "https://api.managifyhr.com/api";

// CSS to hide number input spinners
const hideSpinnerStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = hideSpinnerStyle;
  document.head.appendChild(style);
}

const SetSalary = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState({
    basicPercentage: '',
    hraPercentage: '',
    daPercentage: '',
    specialAllowancePercentage: '',
    professionalTax: '',
    tdsPercentage: '',
    transportAllowance: '',
    medicalAllowance: '',
    foodAllowance: '',
    pfPercentage: '',
    esiPercentage: ''
  });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [editEmpConfig, setEditEmpConfig] = useState(null);
  const [loadingEmpConfig, setLoadingEmpConfig] = useState(false);
  const [savingEmpConfig, setSavingEmpConfig] = useState(false);
  const [employeeSalaryStatus, setEmployeeSalaryStatus] = useState({});

  const getSubadminId = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user?.id;
    }
    return null;
  };

  useEffect(() => {
    setLoading(true);
    const subadminId = getSubadminId();
    if (!subadminId) {
      setLoading(false);
      setLoadingConfig(false);
      return;
    }

    // Fetch employees and their salary status
    const fetchEmployeesAndSalaryStatus = async () => {
      try {
        const employeesResponse = await axios.get(`${API_URL}/employee/${subadminId}/employee/all`);
        const employeesData = employeesResponse.data;
        setEmployees(employeesData);

        // Check salary status for each employee
        const salaryStatusPromises = employeesData.map(async (emp) => {
          try {
            const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${emp.empId}`);
            return {
              empId: emp.empId,
              hasSalary: response.ok,
              salaryData: response.ok ? await response.json() : null
            };
          } catch (error) {
            return {
              empId: emp.empId,
              hasSalary: false,
              salaryData: null
            };
          }
        });

        const salaryStatuses = await Promise.all(salaryStatusPromises);
        const statusMap = {};
        salaryStatuses.forEach(status => {
          statusMap[status.empId] = status;
        });
        console.log('Employee salary status map:', statusMap);
        setEmployeeSalaryStatus(statusMap);

      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesAndSalaryStatus();
    // Fetch salary config on mount
    fetchSalaryConfiguration();
  }, []);

  const fetchSalaryConfiguration = async () => {
    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error(t('setSalary.errors.userNotFound'));
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
      toast.error(t('setSalary.errors.loadFailed'));
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch individual employee salary configuration
  const fetchEmployeeSalaryConfig = async (empId) => {
    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error('User not found');
      return null;
    }

    setLoadingEmpConfig(true);
    try {
      const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${empId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        toast.error('Failed to fetch employee salary configuration');
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee salary configuration:', error);
      toast.error('Error loading employee salary data');
      return null;
    } finally {
      setLoadingEmpConfig(false);
    }
  };

  // Allow backspace to clear number fields, including '0'
  const handleInputChange = (field, value) => {
    if (value === '' || value === null) {
      setConfig(prev => ({ ...prev, [field]: '' }));
      return;
    }
    if (!isNaN(value)) {
      setConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error(t('setSalary.errors.userNotFound'));
      return;
    }

    // Validate percentages
    if (config.basicPercentage < 0 || config.basicPercentage > 100) {
      toast.error(t('setSalary.errors.basicPercentageRange'));
      return;
    }

    // Check if total allowances exceed 100%
    const totalAllowances = config.hraPercentage + config.daPercentage + config.specialAllowancePercentage;
    if (totalAllowances > 100) {
      toast.error(t('setSalary.errors.allowancesExceed'));
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
        const successMessage = result.message || '🎉 Default salary configuration saved successfully!';

        toast.success(successMessage, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

      } else {
        const errorText = await response.text();
        toast.error(`${t('setSalary.errors.saveFailedWithMessage')} ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving salary configuration:', error);
      toast.error(t('setSalary.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection (checkbox)
  const handleEmployeeSelect = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Save salary for selected employees (batch update)
  const handleSaveForSelected = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee to configure salary', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const subadminId = getSubadminId();
    const payload = {
      employeeIds: selectedEmployees,
      configData: config
    };

    try {
      await axios.put(`${API_URL}/salary-config/${subadminId}/employees`, payload);

      // Show success toast message
      toast.success(`🎉 Salary configuration saved successfully for ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}!`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear selected employees
      setSelectedEmployees([]);

      // Refresh salary status for updated employees
      const statusPromises = selectedEmployees.map(async (empId) => {
        try {
          const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${empId}`);
          return {
            empId: empId,
            hasSalary: response.ok,
            salaryData: response.ok ? await response.json() : null
          };
        } catch (error) {
          return {
            empId: empId,
            hasSalary: false,
            salaryData: null
          };
        }
      });

      const updatedStatuses = await Promise.all(statusPromises);
      setEmployeeSalaryStatus(prev => {
        const newStatus = { ...prev };
        updatedStatuses.forEach(status => {
          newStatus[status.empId] = status;
        });
        return newStatus;
      });

    } catch (error) {
      console.error('Error saving salary configuration:', error);
      toast.error('Failed to save salary configuration. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Save or update salary for single employee
  const handleSaveOrUpdateForSingle = async (empId, hasConfig) => {
    const subadminId = getSubadminId();

    try {
      if (hasConfig) {
        await axios.put(`${API_URL}/salary-config/${subadminId}/employee/${empId}`, config);
        toast.success('✅ Salary configuration updated successfully for employee!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        await axios.post(`${API_URL}/salary-config/${subadminId}/employee/${empId}`, config);
        toast.success('🎉 Salary configuration saved successfully for employee!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Refresh salary status for this employee
      try {
        const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${empId}`);
        const updatedStatus = {
          empId: empId,
          hasSalary: response.ok,
          salaryData: response.ok ? await response.json() : null
        };
        setEmployeeSalaryStatus(prev => ({
          ...prev,
          [empId]: updatedStatus
        }));
      } catch (error) {
        console.error('Error refreshing salary status:', error);
      }

    } catch (error) {
      console.error('Error saving/updating salary configuration:', error);
      toast.error('Failed to save salary configuration. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Handle eye button click to view/edit employee salary
  const handleViewEmployeeSalary = async (empId, employeeName) => {
    console.log('Eye button clicked for employee:', empId, employeeName);
    const salaryData = await fetchEmployeeSalaryConfig(empId);
    console.log('Fetched salary data:', salaryData);
    if (salaryData) {
      setEditEmpConfig({
        ...salaryData,
        employeeName: employeeName,
        empId: empId
      });
    } else {
      console.error('No salary data found for employee:', empId);
    }
  };

  // Update employee salary configuration
  const updateEmployeeSalaryConfig = async () => {
    if (!editEmpConfig) return;

    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error('User not found');
      return;
    }

    setSavingEmpConfig(true);
    try {
      const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${editEmpConfig.empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basicPercentage: editEmpConfig.basicPercentage,
          hraPercentage: editEmpConfig.hraPercentage,
          daPercentage: editEmpConfig.daPercentage,
          specialAllowancePercentage: editEmpConfig.specialAllowancePercentage,
          professionalTax: editEmpConfig.professionalTax,
          tdsPercentage: editEmpConfig.tdsPercentage,
          transportAllowance: editEmpConfig.transportAllowance,
          medicalAllowance: editEmpConfig.medicalAllowance,
          foodAllowance: editEmpConfig.foodAllowance,
          pfPercentage: editEmpConfig.pfPercentage,
          esiPercentage: editEmpConfig.esiPercentage
        })
      });

      if (response.ok) {
        toast.success(`Salary configuration updated successfully for ${editEmpConfig.employeeName}!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setEditEmpConfig(null);
        // Refresh salary status for the updated employee
        const subadminId = getSubadminId();
        if (subadminId) {
          try {
            const response = await fetch(`${API_URL}/salary-config/${subadminId}/employee/${editEmpConfig.empId}`);
            const updatedStatus = {
              empId: editEmpConfig.empId,
              hasSalary: response.ok,
              salaryData: response.ok ? await response.json() : null
            };
            setEmployeeSalaryStatus(prev => ({
              ...prev,
              [editEmpConfig.empId]: updatedStatus
            }));
          } catch (error) {
            console.error('Error refreshing salary status:', error);
          }
        }
      } else {
        const errorText = await response.text();
        toast.error(`Failed to update salary configuration: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating employee salary configuration:', error);
      toast.error('Error updating salary configuration');
    } finally {
      setSavingEmpConfig(false);
    }
  };

  // Handle input change for employee config modal
  const handleEmpConfigChange = (field, value) => {
    if (value === '' || value === null) {
      setEditEmpConfig(prev => ({ ...prev, [field]: '' }));
      return;
    }
    if (!isNaN(value)) {
      setEditEmpConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  // Calculate total allowances
  const totalAllowances = Number(config.hraPercentage || 0) + Number(config.daPercentage || 0) + Number(config.specialAllowancePercentage || 0);
  const showWarning = totalAllowances > 100;

  if (loadingConfig) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">{t('setSalary.loading')}</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#181f2a', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
      <h2 style={{ color: '#2563eb', marginBottom: 8, textAlign: 'left', fontWeight: 700, fontSize: 22 }}>
        <span style={{ marginRight: 8 }}><MdSettings /></span> Set Salary Configuration
      </h2>
      <div style={{ color: '#94a3b8', marginBottom: 24, fontSize: 15 }}>Configure salary calculations for all employees</div>
      {/* Basic Salary Structure */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: '#22c55e', fontSize: 20, marginRight: 8 }}>▦</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>Basic Salary Structure (% of CTC)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Basic Salary (% of CTC)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.basicPercentage}
              onChange={e => handleInputChange('basicPercentage', e.target.value)}
              style={inputStyle}
              placeholder="Basic %"
            />
          </div>
        </div>
      </div>
      {/* Allowances */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: '#38bdf8', fontSize: 20, marginRight: 8 }}>▦</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>Allowances (% of Basic Salary)</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>HRA (% of Basic)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.hraPercentage}
              onChange={e => handleInputChange('hraPercentage', e.target.value)}
              style={inputStyle}
              placeholder="HRA %"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>DA (% of Basic)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.daPercentage}
              onChange={e => handleInputChange('daPercentage', e.target.value)}
              style={inputStyle}
              placeholder="DA %"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Special Allowance (% of Basic)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.specialAllowancePercentage}
              onChange={e => handleInputChange('specialAllowancePercentage', e.target.value)}
              style={inputStyle}
              placeholder="Special Allowance %"
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{
            background: totalAllowances >= 100 ? '#fbbf24' : '#f3f4f6',
            color: totalAllowances >= 100 ? '#b45309' : '#334155',
            borderRadius: 6,
            padding: '8px 12px',
            fontWeight: 600,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: 8 }}>Total Allowances: {totalAllowances.toFixed(1)}% of Basic Salary</span>
            {totalAllowances >= 100 && <span>⚠️ Close to limit!</span>}
          </div>
        </div>
      </div>
      {/* Fixed Allowances */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: '#2563eb', fontSize: 20, marginRight: 8 }}>₹</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>Fixed Allowances (Monthly Amount)</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Transport Allowance (₹)</label>
            <input
              type="number"
              min="0"
              value={config.transportAllowance}
              onChange={e => handleInputChange('transportAllowance', e.target.value)}
              style={inputStyle}
              placeholder="Transport Allowance"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Medical Allowance (₹)</label>
            <input
              type="number"
              min="0"
              value={config.medicalAllowance}
              onChange={e => handleInputChange('medicalAllowance', e.target.value)}
              style={inputStyle}
              placeholder="Medical Allowance"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Food Allowance (₹)</label>
            <input
              type="number"
              min="0"
              value={config.foodAllowance}
              onChange={e => handleInputChange('foodAllowance', e.target.value)}
              style={inputStyle}
              placeholder="Food Allowance"
            />
          </div>
        </div>
      </div>
      {/* Deductions */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: '#dc2626', fontSize: 20, marginRight: 8 }}>%</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>% Deductions</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>Professional Tax (₹)</label>
            <input
              type="number"
              min="0"
              value={config.professionalTax}
              onChange={e => handleInputChange('professionalTax', e.target.value)}
              style={inputStyle}
              placeholder="Professional Tax"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>TDS (% of Gross)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.tdsPercentage}
              onChange={e => handleInputChange('tdsPercentage', e.target.value)}
              style={inputStyle}
              placeholder="TDS %"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>PF (% of Basic)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.pfPercentage}
              onChange={e => handleInputChange('pfPercentage', e.target.value)}
              style={inputStyle}
              placeholder="PF %"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>ESI (% of Gross)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.esiPercentage}
              onChange={e => handleInputChange('esiPercentage', e.target.value)}
              style={inputStyle}
              placeholder="ESI %"
            />
          </div>
        </div>
      </div>
      {/* Employee selection for batch salary config */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ color: '#22d3ee', fontWeight: 600, fontSize: 17, marginBottom: 10 }}>Select Employees for Salary Configuration</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: '#232b3a', borderRadius: 8, padding: 12 }}>
          {employees.length === 0 ? <div style={{ color: '#fff' }}>No employees found.</div> : employees.map(emp => (
            <div key={emp.empId} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.empId)}
                onChange={() => handleEmployeeSelect(emp.empId)}
                style={{ marginRight: 8 }}
              />
              <span style={{ color: '#fff', fontWeight: 500 }}>{emp.firstName} {emp.lastName} ({emp.empId})</span>
            </div>
          ))}
        </div>
      </div>
      {/* Employee Salary Status Table */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ color: '#22d3ee', fontWeight: 600, fontSize: 17, marginBottom: 10 }}>Employee Salary Status</div>
        <div style={{ maxHeight: 220, overflowY: 'auto', background: '#232b3a', borderRadius: 8, padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15 }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Employee</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Salary Set?</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Total Salary (₹)</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ color: '#fff', padding: '12px 0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    Loading employees and salary status...
                  </div>
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={4} style={{ color: '#fff', padding: '12px 0' }}>No employees found.</td></tr>
              ) : (
                employees.map(emp => {
                  const empSalaryStatus = employeeSalaryStatus[emp.empId];
                  const salarySet = empSalaryStatus?.hasSalary || false;
                  const salaryData = empSalaryStatus?.salaryData;

                  // Calculate total salary if salary data exists
                  let totalSalary = 'No salary set';
                  if (salarySet && salaryData && salaryData.employee) {
                    const basicSalary = (salaryData.employee.salary * salaryData.basicPercentage) / 100;
                    const hra = (basicSalary * salaryData.hraPercentage) / 100;
                    const da = (basicSalary * salaryData.daPercentage) / 100;
                    const specialAllowance = (basicSalary * salaryData.specialAllowancePercentage) / 100;
                    const grossSalary = basicSalary + hra + da + specialAllowance +
                                      salaryData.transportAllowance + salaryData.medicalAllowance + salaryData.foodAllowance;
                    const deductions = salaryData.professionalTax +
                                     (grossSalary * salaryData.tdsPercentage) / 100 +
                                     (basicSalary * salaryData.pfPercentage) / 100 +
                                     (grossSalary * salaryData.esiPercentage) / 100;
                    totalSalary = `₹${Math.round(grossSalary - deductions).toLocaleString()}`;
                  }

                  return (
                    <tr key={emp.empId} style={{ color: '#fff', fontWeight: 500, borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px' }}>{emp.firstName} {emp.lastName} ({emp.empId})</td>
                      <td style={{ padding: '8px' }}>{salarySet ? <span style={{ color: '#22c55e', fontSize: 22 }}>✓</span> : <span style={{ color: '#ef4444', fontSize: 22 }}>✗</span>}</td>
                      <td style={{ padding: '8px' }}>{totalSalary}</td>
                      <td style={{ padding: '8px' }}>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: salarySet ? 'pointer' : 'not-allowed',
                            color: salarySet ? '#38bdf8' : '#64748b',
                            fontSize: 20
                          }}
                          onClick={() => salarySet && handleViewEmployeeSalary(emp.empId, emp.firstName + ' ' + emp.lastName)}
                          disabled={!salarySet}
                          title={salarySet ? 'View & Edit Salary Details' : 'No Salary Set'}
                        >
                          <FaEye />
                        </button>
                        {/* Save/Edit button for single employee */}
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: 20, marginLeft: 8 }}
                          onClick={() => handleSaveOrUpdateForSingle(emp.empId, salarySet)}
                          title={salarySet ? 'Edit Salary Configuration' : 'Set Salary Configuration'}
                        >
                          <FaSave />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button
        onClick={handleSaveForSelected}
        style={{
          background: '#2563eb',
          color: '#fff',
          fontWeight: 600,
          border: 'none',
          borderRadius: 6,
          padding: '12px 32px',
          fontSize: 16,
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <span style={{ marginRight: 8 }}>💾</span> Save Configuration
      </button>
      {/* Employee Salary Configuration Modal */}
      {editEmpConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#181f2a',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: 32,
            minWidth: 600,
            maxWidth: 800,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: '#38bdf8', fontWeight: 700, fontSize: 22, margin: 0 }}>
                Edit Salary Configuration - {editEmpConfig.employeeName} (ID: {editEmpConfig.empId})
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: '4px'
                }}
                onClick={() => setEditEmpConfig(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {loadingEmpConfig ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span style={{ color: '#fff', marginLeft: 12 }}>Loading...</span>
              </div>
            ) : (
              <div>
                {/* Basic Salary */}
                <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                  <h4 style={{ color: '#22c55e', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Basic Salary Structure</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Basic Salary (% of CTC)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.basicPercentage || ''}
                        onChange={e => handleEmpConfigChange('basicPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="Basic %"
                      />
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                  <h4 style={{ color: '#38bdf8', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Allowances (% of Basic Salary)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>HRA (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.hraPercentage || ''}
                        onChange={e => handleEmpConfigChange('hraPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="HRA %"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>DA (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.daPercentage || ''}
                        onChange={e => handleEmpConfigChange('daPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="DA %"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Special Allowance (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.specialAllowancePercentage || ''}
                        onChange={e => handleEmpConfigChange('specialAllowancePercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="Special %"
                      />
                    </div>
                  </div>
                </div>

                {/* Fixed Allowances */}
                <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                  <h4 style={{ color: '#2563eb', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Fixed Allowances (Monthly Amount)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Transport (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editEmpConfig.transportAllowance || ''}
                        onChange={e => handleEmpConfigChange('transportAllowance', e.target.value)}
                        style={inputStyle}
                        placeholder="Transport"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Medical (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editEmpConfig.medicalAllowance || ''}
                        onChange={e => handleEmpConfigChange('medicalAllowance', e.target.value)}
                        style={inputStyle}
                        placeholder="Medical"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Food (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editEmpConfig.foodAllowance || ''}
                        onChange={e => handleEmpConfigChange('foodAllowance', e.target.value)}
                        style={inputStyle}
                        placeholder="Food"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div style={{ background: '#1e293b', borderRadius: 10, padding: 18, marginBottom: 24 }}>
                  <h4 style={{ color: '#dc2626', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Deductions</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>Professional Tax (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editEmpConfig.professionalTax || ''}
                        onChange={e => handleEmpConfigChange('professionalTax', e.target.value)}
                        style={inputStyle}
                        placeholder="Prof. Tax"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>TDS (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.tdsPercentage || ''}
                        onChange={e => handleEmpConfigChange('tdsPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="TDS %"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>PF (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.pfPercentage || ''}
                        onChange={e => handleEmpConfigChange('pfPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="PF %"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 6 }}>ESI (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editEmpConfig.esiPercentage || ''}
                        onChange={e => handleEmpConfigChange('esiPercentage', e.target.value)}
                        style={inputStyle}
                        placeholder="ESI %"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      background: '#64748b',
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontSize: 15,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => setEditEmpConfig(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      background: savingEmpConfig ? '#94a3b8' : '#22c55e',
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 24px',
                      fontSize: 15,
                      cursor: savingEmpConfig ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onClick={updateEmployeeSalaryConfig}
                    disabled={savingEmpConfig}
                  >
                    {savingEmpConfig ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Update Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#232b3a',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

export default SetSalary;
