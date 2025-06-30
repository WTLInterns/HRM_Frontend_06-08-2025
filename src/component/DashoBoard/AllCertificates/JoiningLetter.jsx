import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import html2pdf from "html2pdf.js";
import jsPDF from 'jspdf';
import './JoiningLetterPdf.css';

const JoiningLetter = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [subadmin, setSubadmin] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const letterRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    workHours: '',
    benefits: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    signatoryName: '',
    signatoryTitle: '',
    employeeEmail: ''
  });

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Add state to store subadmin profile data (with phone)
  const [profileData, setProfileData] = useState({});

  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        console.log("Fetching subadmin data...");
        
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem("user")) || {};
        // Use the logged-in user's email or fallback to hardcoded one
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        console.log("Fetching subadmin data for email:", email);
        const response = await axios.get(`http://localhost:8282/api/subadmin/subadmin-by-email/${email}`);
        console.log("Subadmin API Response:", response.data);
        setSubadmin(response.data);
        fetchEmployees(response.data.id);
      } catch (error) {
        console.error('Error fetching subadmin:', error);
        setApiError(true);
        toast.error('Failed to fetch company details. Please check API connection.');
        setLoading(false);
      }
    };

    fetchSubadminByEmail();
  }, []);

  // Fetch employees for this subadmin
  const fetchEmployees = async (subadminId) => {
    try {
      console.log(`Fetching employees for subadmin ID: ${subadminId}`);
      const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      console.log("Employees API Response:", response.data);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  // Fetch profile data (subadmin) on mount
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    if (userFromStorage) {
      setProfileData(userFromStorage);
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    if (value.length > 0) {
      const filtered = employees.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(value.toLowerCase()) ||
        emp.email.toLowerCase().includes(value.toLowerCase()) ||
        emp.jobRole.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSearchTerm(`${emp.firstName} ${emp.lastName}`);
    setShowDropdown(false);
    
    // Prefill form with employee data
    setFormData({
      ...formData,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeJobTitle: emp.jobRole,
      employeeDepartment: emp.department || 'N/A',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      // Other fields remain as entered by the user
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!letterRef.current) return;
    setPdfGenerating(true);

    const opt = {
      margin:       0,
      filename:     `${formData.employeeName || 'Employee'}_Joining_Letter.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: "#fff" },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(letterRef.current).save()
      .then(() => {
        setPdfGenerating(false);
        toast.success("PDF successfully downloaded!");
      })
      .catch((err) => {
        setPdfGenerating(false);
        toast.error("Error generating PDF");
        console.error(err);
      });
  };

  const handleSendEmail = async () => {
    if (!subadmin || !formData.employeeName) {
      toast.error('Missing subadmin or employee name');
      return;
    }
    setEmailSending(true);
    try {
      // 1. Generate PDF as Blob using html2pdf.js
      const opt = {
        margin: 0,
        filename: `${formData.employeeName || 'Employee'}_Joining_Letter.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      // html2pdf().outputPdf('blob') returns a Promise<Blob>
      const pdfBlob = await html2pdf().set(opt).from(letterRef.current).outputPdf('blob');

      // 2. Prepare FormData
      const file = new File([pdfBlob], `${formData.employeeName}_Joining_Letter.pdf`, { type: 'application/pdf' });
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      // 3. Send to backend as multipart/form-data
      const documentType = 'joining';
      const apiUrl = `http://localhost:8282/api/certificate/send/${subadmin.id}/${encodeURIComponent(formData.employeeName)}/${documentType}`;
      const response = await axios.post(apiUrl, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        toast.success('Joining Letter sent successfully by email!');
      } else {
        toast.error('Failed to send Joining Letter email.');
      }
    } catch (error) {
      toast.error('Error sending Joining Letter email.');
      console.error(error);
    }
    setEmailSending(false);
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
    console.log("Navigating back to certificates page");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      {/* Back button */}
      <div className="sticky top-0 z-10 p-4 flex justify-between items-center bg-blue-600 text-white shadow-md">
        <button 
          onClick={handleBackClick}
          className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded-md transition duration-300"
        >
          <FaArrowLeft />
          <span>Back to Certificates</span>
        </button>
        <div className="text-lg font-semibold">Joining Letter </div>
        <div className="w-24"></div> {/* Empty div for flex spacing */}
      </div>

      <div className="container mx-auto p-4 max-w-6xl">
        {/* Search for employee */}
        <div className="mb-6 relative" ref={autocompleteRef}>
          <label className={`block mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Search for Employee
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className={`block w-full pl-10 pr-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Search by name, email or job role"
            />
          </div>
          
          {/* Employee search results dropdown */}
          {showDropdown && filteredEmployees.length > 0 && (
            <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto`}>
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`cursor-pointer p-3 hover:bg-blue-100 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 border-b border-gray-700' 
                      : 'hover:bg-gray-100 border-b border-gray-200'
                  }`}
                >
                  <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                  <div className="text-sm text-gray-500">{emp.email}</div>
                  <div className="text-sm">{emp.jobRole}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Form fields */}
          <div className="md:col-span-1">
            <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Letter Details
              </h2>
              
              <div className="space-y-4">
                {/* Employee Basic Details */}
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="employeeJobTitle"
                    value={formData.employeeJobTitle}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="employeeDepartment"
                    value={formData.employeeDepartment}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                {/* Joining Letter Specific Fields */}
                {/* <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salary/Compensation
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., ₹50,000 per month"
                  />
                </div> */}
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Work Hours
                  </label>
                  <input
                    type="text"
                    name="workHours"
                    value={formData.workHours}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., 9:00 AM to 6:00 PM, Monday to Friday"
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Salary/Compensation/Benefits
                  </label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleInputChange}
                    rows="3"
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Health insurance, PF, Annual leave, etc."
                  />
                </div>
                
                {/* Contact and Signatory Details */}
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    name="signatoryName"
                    value={formData.signatoryName}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Signatory Title
                  </label>
                  <input
                    type="text"
                    name="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={handleInputChange}
                    className={`block w-full p-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Letter Preview */}
          <div className="md:col-span-2">
            <div className={`p-6 rounded-lg shadow-md mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
  style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
  <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Letter Preview
                </h2>
                <div className="flex space-x-2">
                  {/* <button
                    onClick={handlePrint}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    <FaPrint />
                    <span>Print</span>
                  </button> */}
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
                    disabled={pdfGenerating}
                  >
                    <FaDownload />
                    <span>{pdfGenerating ? 'Generating...' : 'Download'}</span>
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-300"
                    disabled={emailSending || !subadmin || !formData.employeeName}
                  >
                    <FaEnvelope />
                    <span>{emailSending ? 'Sending...' : 'Email'}</span>
                  </button>
                </div>
              </div>
              
              {/* Letter Content Preview */}
              {isMobile && (
                <div className="mobile-warning-blink overflow-x-auto pb-4">
                  To View Certificate In Full Size Please Open It In Desktop Site Mode.
                </div>
              )}
              <div 
                ref={letterRef}
                className="bg-white text-black p-8 rounded-md shadow joining-letter-certificate"
                style={{ minHeight: '297mm', width: '800px', maxWidth: '100%', margin: '0 auto' }}
              >
                {/* Company Header */}
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <div>
                    {subadmin && subadmin.companylogo ? (
                      <img
                        src={`http://localhost:8282/images/profile/${subadmin.companylogo}`}
                        alt="Company Logo"
                        className="h-16 object-contain"
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                        }}
                      />
                    ) : (
                      <div className="h-16 w-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Company Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">{subadmin?.registercompanyname || 'Company Name'}</h2>
                    <p>{subadmin?.address || 'Company Address'}</p>
                    <p>{subadmin?.email || 'company@example.com'}</p>
                    <p>{profileData.phoneno ? `+91 ${profileData.phoneno}` : ''}</p>
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-right mb-6">
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
                
                {/* Subject Line */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold underline text-center">JOINING LETTER</h3>
                </div>
                
                {/* Salutation */}
                <div className="mb-4">
                  <p>Dear {formData.employeeName || '[Employee Name]'},</p>
                </div>
                
                {/* Body Content */}
                <div className="space-y-4 mb-6">
                  <p>
                    We are pleased to confirm your appointment as <strong>{formData.employeeJobTitle || '[Job Position]'}</strong> in 
                    the <strong>{formData.employeeDepartment || '[Department]'}</strong> department at <strong>{subadmin?.registercompanyname || 'our organization'}</strong>.
                  </p>
                  
                  {/* Inserted Offer & Policy Content Start */}
                  <div className="no-break">
                    <p>We are pleased to formally offer you the position of <strong>{formData.employeeJobTitle || '[Job Title]'}</strong> with <strong>{subadmin?.registercompanyname || '[Company Name]'}</strong>, effective from <strong>{formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB') : '[Joining Date]'}</strong>. We were impressed with your background, skills, and attitude, and we believe you will be a valuable asset to our growing team.</p>
                    <p>This letter outlines the terms and conditions of your employment with us.</p>
                    <div style={{ marginBottom: '1.5rem' }}>
  <strong>Position and Reporting</strong><br />
  You will be designated as <strong>{formData.employeeJobTitle || '[Job Title]'}</strong> <br />
  Your employment will commence on <strong>{new Date(formData.joiningDate).toLocaleDateString('en-GB') || '[Joining Date]'}</strong>.<br />
  Please report to <strong>{formData.contactPerson || 'HR Department'}</strong> at 9:00 AM on your joining date.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Place of Posting</strong><br />
  Your primary location of work will be <strong>{subadmin?.address || '[City, Office Address]'}</strong>. However, the company may require you to work at any of its current or future branches, client sites, or locations, as per operational requirements.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Working Hours</strong><br />
  Your regular working hours will be {formData.workHours ? <strong>{formData.workHours}</strong> : '[Working Hours]'} per week. You may be required to work outside these hours depending on the business needs.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Compensation and Benefits</strong><br />
  <span>
    {formData.benefits && formData.benefits.trim() !== ''
      ? formData.benefits
      : '[Benefits details will appear here based on form input]'}
  </span>
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Probation Period</strong><br />
  You will be on probation for a period of [3 months or as applicable] from your joining date. Your performance and conduct will be reviewed periodically. Upon successful completion, your employment may be confirmed in writing.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Confidentiality and Non-Disclosure</strong><br />
  You are expected to maintain the confidentiality of company data, projects, client information, and all proprietary materials. You will be required to sign a Non-Disclosure Agreement (NDA) and comply with our IT and Security Policy.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Termination Clause</strong><br />
  Either party may terminate this employment by providing [30 days / 1 month] written notice or salary in lieu thereof.<br />The company reserves the right to terminate employment without notice in case of misconduct, breach of policy, or under disciplinary action.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Code of Conduct</strong><br />
  All employees must adhere to the company’s code of conduct and maintain the highest standards of professionalism, ethics, and integrity in their work.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Acceptance of Offer</strong><br />
  We request you to sign and return a copy of this letter to indicate your acceptance. A detailed onboarding schedule and documentation checklist will be shared shortly after your confirmation.
</div>
<div style={{ marginBottom: '1.5rem' }}>
  <strong>Welcome Aboard</strong><br />
  We look forward to having you on our team and are confident that you will play a key role in our ongoing success. Your experience and enthusiasm will be instrumental in driving our mission forward.<br />Should you have any queries or require any clarification, please feel free to contact our HR team <br />Once again, congratulations and welcome to <strong>{subadmin?.registercompanyname || '[Company Name]'}</strong>!
</div>
                    <hr style={{ margin: '16px 0' }} />
                    <h4 className="font-bold">Privacy & Confidentiality Policy</h4>
                    <p>This Privacy & Confidentiality Policy outlines the standards and expectations of <strong>{subadmin?.registercompanyname || '[Company Name]'}</strong> regarding the protection of sensitive company and customer data. All employees must follow these policies to safeguard business integrity, data privacy, and intellectual property.</p>
                                        <ul>
                      <li><strong>Confidentiality of Company Information</strong>: Employees must not share internal documents, reports, customer data, pricing, or financial details with unauthorized individuals inside or outside the company. Information received during employment must be treated as strictly confidential, even after the employment ends. Any discussions related to company matters must happen only on authorized communication channels (e.g., company email, Slack, Teams).</li>
                      <li><strong>Use of Company Devices and Accounts</strong>: Company laptops, desktops, mobile devices, and email accounts must be used strictly for official purposes. Employees are prohibited from saving or transferring confidential data to personal devices, USB drives, or personal cloud storage. Passwords and credentials must be kept private and should not be shared, written down, or reused on personal platforms.</li>
                      <li><strong>Data Access and Storage</strong>: Only employees with official, role-based access are allowed to view, edit, or store sensitive information. All data should be stored only in secure, company-approved platforms such as internal servers, encrypted cloud services, or databases. Physical files with confidential information must be locked and access-controlled.</li>
                      <li><strong>Client & Customer Data Protection</strong>: All personal and financial details of customers or vendors must be handled with utmost sensitivity. Employees must not use customer contact details for personal communication or for marketing outside the approved processes. No employee may share client data with third parties unless officially authorized and in compliance with NDAs.</li>
                      <li><strong>Prohibition on Unauthorized Sharing</strong>: Employees must not disclose any project details, source code, algorithms, designs, strategies, or intellectual property to anyone outside the organization. Public discussions on platforms like LinkedIn, Twitter, WhatsApp, Telegram, or any media about internal tools or processes are strictly prohibited unless permitted by HR or Marketing.</li>
                    </ul>
                    <strong>Breach of Policy and Disciplinary Actions</strong>
                    <p>Violation of this policy may result in:</p>
                    <ul><li>Written warnings</li><li>Suspension</li><li>Termination of employment</li><li>Legal action including claims for damages or prosecution under applicable data protection laws (e.g., IT Act, GDPR, etc.)</li></ul>
                    <p>All breaches must be reported immediately to [Designated Privacy Officer or HR Manager].</p>
                    <strong>Exceptions</strong>
                    <p>Any exceptions to this policy must be approved in writing by senior management or the data protection officer. No verbal approvals shall be considered valid.</p>
                    <hr style={{ margin: '16px 0' }} />
                    <h4 className="font-semibold">Salary Structure</h4>
                    <table className="w-full text-sm mb-2 border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-2 py-1">Component</th>
                          <th className="border border-gray-400 px-2 py-1">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                       
                        <tr>
                          <td className="border border-gray-400 px-2 py-1">House Rent Allowance (HRA)</td>
                          <td className="border border-gray-400 px-2 py-1">10%</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 px-2 py-1">Dearness Allowance (DA)</td>
                          <td className="border border-gray-400 px-2 py-1">53%</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 px-2 py-1">Special Allowance</td>
                          <td className="border border-gray-400 px-2 py-1">37%</td>
                        </tr>
                        
                      </tbody>
                    </table> <br /><br />
                    {/* Acceptance Letter and Checklist Section */}
                    <div>
                      <h4 className="font-bold text-lg mb-2">📄 Acceptance Letter</h4>
                      <p>To,<br />The HR Department<br /><strong>{subadmin?.registercompanyname || '[Company Name]'}</strong><br /><strong>{subadmin?.address || '[Company Address]'}</strong></p>
                      <p>Subject: Acceptance of Employment Offer</p>
                      <p>Dear Sir/Madam,</p>
                      <p>I am pleased to accept the offer of employment for the position of <strong>{formData.employeeJobTitle || '[Job Title]'}</strong> at <strong>{subadmin?.registercompanyname || '[Company Name]'}</strong>, as mentioned in the appointment letter dated <strong>{formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB') : '[Offer Date]'}</strong>.</p>
                      <p>I have carefully read and understood all the terms and conditions, including the company’s policies, CTC structure, code of conduct, and confidentiality clauses. I confirm that I will adhere to these terms throughout my tenure.</p>
                      <p>I understand that my employment is subject to the company’s policies and procedures, and I agree to comply with all rules and expectations set forth.</p>
                      <p>I appreciate the opportunity to work with <strong>{subadmin?.registercompanyname || '[Company Name]'}</strong>, and I look forward to contributing to the success of the organization.</p>

                      <h4 className="font-semibold mt-6 mb-2">Acceptance Checklist</h4>
                      <ul className="list-disc pl-6 mb-4">
                        <li>☐ I have read and understood the terms and conditions mentioned in the appointment letter.</li>
                        <li>☐ I agree to maintain the confidentiality of company information during and after my employment.</li>
                        <li>☐ I have reviewed and accepted the detailed CTC breakdown and salary structure.</li>
                        <li>☐ I acknowledge that I have received and read the company's privacy policy.</li>
                        <li>☐ I hereby accept this employment offer and agree to abide by all the rules and policies of the company.</li>
                      </ul>
                      <p>Thank you for your trust and consideration.</p>
                      <p>Sincerely,<br /><strong>{formData.employeeName || '[Employee Full Name]'}</strong><br />Signature: ____________________<br />Date: ________________________<br />Place: _______________________</p>
                    </div>
                    
                  </div>
<div className="page-break"></div>

                  
                  

                  <p className="font-bold">
                    On your joining day, please bring the following documents:
                  </p>
                  <ul className="list-disc pl-5">
                    <li>Educational certificates (originals and photocopies)</li>
                    <li>Experience and relieving letters from previous employers</li>
                    <li>Identity proof (Aadhar/PAN/Passport)</li>
                    <li>Address proof</li>
                    <li>Passport size photographs (4 copies)</li>
                    <li>Bank account details for salary transfer</li>
                  </ul>
                  
                  <p>
                    We look forward to a mutually beneficial and fruitful association with you. If you have any questions or require further clarification, 
                    please feel free to contact our HR department. <br /> 
                    Contact Person: <strong>{formData.contactPerson || '[Contact Person]'}</strong> <br />
                    Contact Email: <strong>{formData.contactEmail || '[Contact Email]'}</strong> <br />
                    Contact Phone: <strong>{formData.contactPhone || '[Contact Phone]'}</strong> <br />
                  </p>
                  
                  <p>
                    Please sign and return the duplicate copy of this letter as a token of your acceptance of the above terms and conditions.
                  </p>
                </div>
                
                {/* Signature Section */}
                <div className="mt-12 flex justify-between">
                  <div>
                    <p className="font-semibold mb-1">Accepted by:</p>
                    <p className="mb-10">_________________________</p>
                    <p>{formData.employeeName || '[Employee Name]'}</p>
                    <p>Date: _________________________</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold mb-1">For <strong>{subadmin?.registercompanyname || 'Company Name'}</strong></p>
                    {subadmin && subadmin.signature ? (
                      <img
                        src={`http://localhost:8282/images/profile/${subadmin.signature}`}
                        alt="Authorized Signature"
                        className="h-16 object-contain ml-auto mb-2"
                        onError={(e) => {
                          console.error('Error loading signature:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1 ml-auto">
                        <span className="text-gray-500">Signature</span>
                      </div>
                    )}
                    <p className="font-semibold">{formData.signatoryName || '[Signatory Name]'}</p>
                    <p>{formData.signatoryTitle || '[Signatory Title]'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Blinking warning style for mobile
const style = document.createElement('style');
style.innerHTML = `
  .mobile-warning-blink {
    color: #dc2626;
    background: #fff0f0;
    border: 1.5px solid #dc2626;
    border-radius: 6px;
    padding: 10px 0;
    font-size: 1rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 16px;
    animation: blink-red 1s linear infinite;
    letter-spacing: 0.5px;
    z-index: 5;
  }
  @keyframes blink-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;
if (!document.head.querySelector('style[data-mobile-warning]')) {
  style.setAttribute('data-mobile-warning', 'true');
  document.head.appendChild(style);
}

export default JoiningLetter; 