import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AppointmentLetter = () => {
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
    startDate: '',
    salary: '',
    department: '',
    reportingTo: '',
    workingHours: '',
    probationPeriod: '',
    signatoryName: '',
    signatoryTitle: ''
  });

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        const response = await axios.get(`http://localhost:8282/api/subadmin/subadmin-by-email/${email}`);
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
      const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

  useEffect(() => {
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
    
    setFormData({
      ...formData,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeJobTitle: emp.jobRole,
      startDate: emp.joiningDate,
      department: emp.department || '',
      salary: emp.salary || '',
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
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #letter-content, #letter-content * {
          visibility: visible !important;
          display: block !important;
        }
        #letter-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
          margin: 0;
          padding: 20mm;
          box-sizing: border-box;
        }
        #letter-content p, #letter-content span, #letter-content div {
          color: black !important;
          font-size: 12pt !important;
          line-height: 1.5 !important;
        }
        #letter-content img {
          visibility: visible !important;
          display: inline-block !important;
          max-width: 100% !important;
          height: auto !important;
        }
        .no-print {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 0;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;
    
    setPdfGenerating(true);
    toast.info('Preparing PDF download...');
    
    try {
      // Store original styles
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust styles for PDF generation
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '10pt';
      letterContainer.style.lineHeight = '1.3';
      letterContainer.style.padding = '20px';
      
      // Reduce margins and padding for mobile optimization
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.6em';
        p.style.marginTop = '0.6em';
      });

      // Handle images
      const images = letterContainer.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve();
          img.onerror = () => {
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            resolve();
          };
          
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
          }
        });
      });
      
      await Promise.all(imagePromises);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF with html2canvas
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('letter-content');
          if (clonedElement) {
            clonedElement.style.width = '210mm';
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
          }
        }
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      
      // Restore original styles
      letterContainer.style.cssText = originalStyle;
      
      // Save PDF with appropriate filename
      const fileName = selectedEmployee 
        ? `Appointment_Letter_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`
        : `Appointment_Letter_${formData.employeeName.replace(/\s+/g, '_') || 'Employee'}.pdf`;
      
      pdf.save(fileName);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!letterRef.current) return;
    
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }
    
    if (!subadmin) {
      toast.error('Company information not loaded');
      return;
    }
    
    setSendingEmail(true);
    toast.info(`Preparing to send email to ${selectedEmployee.email}...`);
    
    try {
      // Store original styles
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust styles for PDF generation
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '9pt';
      letterContainer.style.lineHeight = '1.2';
      
      // Optimize spacing for mobile
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.5em';
        p.style.marginTop = '0.5em';
      });

      // Handle images
      const images = letterContainer.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve();
          img.onerror = () => {
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            resolve();
          };
          
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
          }
        });
      });
      
      await Promise.all(imagePromises);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF with html2canvas
      const canvas = await html2canvas(letterRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      
      // Convert PDF to blob for upload
      const pdfBlob = pdf.output('blob');
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', pdfBlob, 'appointment_letter.pdf');
      
      const apiUrl = `http://localhost:8282/api/certificate/send/${subadmin.id}/${selectedEmployee.empId}/appointment`;
      
      await axios.post(apiUrl, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Restore original styles
      letterContainer.style.cssText = originalStyle;
      
      toast.success(`Appointment letter sent to ${selectedEmployee.email} successfully!`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send appointment letter.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
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
      transition={{ duration: 0.5 }}
      className={`p-4 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      <div className="container mx-auto">
        {/* Responsive header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300 text-sm sm:text-base"
          >
            <FaArrowLeft className="mr-2" /> Back to Certificates
          </button>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-end">
         
            <button 
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 flex items-center text-xs sm:text-sm"
            >
              <FaDownload className="mr-1 sm:mr-2" /> {pdfGenerating ? 'Generating...' : 'Download'}
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={sendingEmail || !selectedEmployee}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 flex items-center text-xs sm:text-sm"
            >
              <FaEnvelope className="mr-1 sm:mr-2" /> {sendingEmail ? 'Sending...' : 'Email'}
            </button>
          </div>
        </div>

        {apiError && (
          <div className={`p-3 rounded mb-4 sm:mb-6 ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}`}>
            <p>Failed to connect to the API. Some features might be limited.</p>
          </div>
        )}

        {/* Main content with responsive layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Form section - full width on mobile, 1/3 on desktop */}
          <div className="w-full lg:w-1/3">
            <div className={`p-4 sm:p-6 rounded-lg shadow ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">Appointment Details</h2>
              
              {subadmin && (
                <div className="mb-4">
                  <h3 className={`text-sm sm:text-base font-medium mb-2 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2H5v-2h10zM5 8h10v2H5V8z" clipRule="evenodd" />
                    </svg>
                    Company Information
                  </h3>
                  <div className={`p-3 rounded border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-blue-50/50 border-blue-200'}`}>
                    <p className="font-semibold text-sm sm:text-base">{subadmin.registercompanyname}</p>
                    <p className="text-xs sm:text-sm mt-1">{subadmin.address}</p>
                    <p className="text-xs sm:text-sm mt-1">GST: {subadmin.gstno}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-4 relative" ref={autocompleteRef}>
                <label className={`block text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Search Employee
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full p-2 pl-8 text-xs sm:text-sm border rounded focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                    }`}
                    placeholder="Name, email or role"
                  />
                  <FaSearch className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
                
                {showDropdown && filteredEmployees.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    {filteredEmployees.map(emp => (
                      <div 
                        key={emp.empId} 
                        className={`p-2 cursor-pointer border-b last:border-b-0 ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-blue-50'} transition-colors duration-200`}
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div className="font-medium text-xs sm:text-sm">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs flex justify-between mt-1">
                          <span>{emp.jobRole}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xxs sm:text-xs ${emp.status === 'Active' || emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                {Object.entries({
                  employeeName: 'Employee Name',
                  employeeJobTitle: 'Job Title',
                  startDate: 'Start Date',
                  salary: 'Salary',
                  department: 'Department',
                  reportingTo: 'Reporting To',
                  workingHours: 'Working Hours',
                  probationPeriod: 'Probation Period',
                  signatoryName: 'Signatory Name',
                  signatoryTitle: 'Signatory Title'
                }).map(([field, label]) => (
                  <div key={field}>
                    <label className={`block text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
                    {field === 'startDate' ? (
                      <input
                        type="date"
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                        className={`w-full p-2 text-xs sm:text-sm border rounded focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                        className={`w-full p-2 text-xs sm:text-sm border rounded focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                        }`}
                        placeholder={
                          field === 'workingHours' ? "e.g., 9:00 AM - 6:00 PM" : 
                          field === 'probationPeriod' ? "e.g., 3 months" : 
                          field === 'salary' ? "e.g., ₹50,000 per month" : ""
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Letter preview section - full width on mobile, 2/3 on desktop */}
          <div className="w-full lg:w-2/3">
            <div className="overflow-x-auto pb-4">
              {isMobile && (
                <div className="mobile-warning-blink">
                  To View Certificate In Full Size Please Open It In Desktop Site Mode.
                </div>
              )}
              <div 
                ref={letterRef} 
                id="letter-content"
                className={`bg-white text-black p-4 sm:p-6 md:p-8 rounded-lg shadow-xl min-h-[29.7cm] w-full max-w-[21cm] mx-auto relative border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-gray-300 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-gray-300 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-gray-300 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-gray-300 rounded-br-lg"></div>
                
                {/* Company Letterhead */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {subadmin && subadmin.companylogo ? (
                        <img 
                          src={`http://localhost:8282/images/profile/${subadmin.companylogo}`} 
                          alt="Company Logo" 
                          className="h-12 sm:h-16 md:h-20 object-contain" 
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                          }}
                        />
                      ) : (
                        <div className="h-12 sm:h-16 md:h-20 flex items-center">
                          <p className="text-gray-500 border border-gray-200 rounded px-2 py-1 text-xs sm:text-sm">[Company Logo]</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Company Details */}
                    <div className="flex flex-col items-end text-right">
                      <h2 className="font-bold text-lg sm:text-xl md:text-2xl text-blue-800">
                        {subadmin?.registercompanyname || "Company Name"}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {subadmin?.address || "Company Address"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        GST: {subadmin?.gstno || "GST Number"}
                      </p>
                    </div>
                  </div>
                  
                  <hr className="border-t-2 border-gray-300 my-3 sm:my-4" />
                </div>

                {/* Date */}
                <div className="mb-6 sm:mb-8">
                  <p className="text-gray-700 font-semibold text-sm sm:text-base">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Subject Line */}
                <div className="mb-6 sm:mb-8 text-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 mb-2">
                    APPOINTMENT LETTER
                  </h1>
                  <div className="border-b-2 border-yellow-500 w-1/3 mx-auto"></div>
                </div>

                {/* Letter Content */}
                <div className="mb-4 sm:mb-6">
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                    Dear <span className="font-semibold">{formData.employeeName || "[Employee Name]"}</span>,
                  </p>
                  
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                    We are pleased to offer you the position of <span className="font-semibold">{formData.employeeJobTitle || "[Job Title]"}</span> at <span className="font-semibold">{subadmin?.registercompanyname || "[Company Name]"}</span>. This letter confirms your appointment and outlines the terms and conditions of your employment.
                  </p>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm sm:text-base">
                    <p><strong>Position:</strong> {formData.employeeJobTitle || "[Job Title]"}</p>
                    <p><strong>Department:</strong> {formData.department || "[Department]"}</p>
                    <p><strong>Start Date:</strong> {formatDate(formData.startDate) || "[Start Date]"}</p>
                    <p><strong>Reporting To:</strong> {formData.reportingTo || "[Manager Name]"}</p>
                    <p><strong>Working Hours:</strong> {formData.workingHours || "[Working Hours]"}</p>
                    <p><strong>Salary:</strong> {formData.salary || "[Salary]"}</p>
                    <p><strong>Probation Period:</strong> {formData.probationPeriod || "[Probation Period]"}</p>
                  </div>

                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                    Your employment with us will be governed by our company policies, procedures, and regulations, which may be amended from time to time. Please note that this offer is contingent upon the successful completion of your probation period.
                  </p>

                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                    We look forward to welcoming you to our team and wish you a successful career with us.
                  </p>

                  <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                    Sincerely,
                  </p>

                  {/* Signature Section */}
                  <div className="mt-8 sm:mt-48">
                    {subadmin && subadmin.signature ? (
                      <div className="border-b border-gray-300 pb-1 w-32 sm:w-40">
                        <img 
                          src={`http://localhost:8282/images/profile/${subadmin.signature}`} 
                          alt="Signature" 
                          className="h-12 sm:h-16 object-contain" 
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-b border-gray-300 pb-1 w-32 sm:w-40 h-12 sm:h-16"></div>
                    )}
                    <p className="font-bold text-blue-800 mt-1 text-sm sm:text-base">
                      {formData.signatoryName || (subadmin ? `${subadmin.name || ''} ${subadmin.lastname || ''}` : "[Signatory Name]")}
                    </p>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      {formData.signatoryTitle || (subadmin?.designation || "[Signatory Title]")}
                    </p>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      {subadmin?.registercompanyname || "[Company Name]"}
                    </p>
                  </div>
                </div>

                {/* Stamp Section */}
                {subadmin && subadmin.stampImg && (
                  <div className="absolute bottom-8 sm:bottom-28 right-4 sm:right-8">
                    <img 
                      src={`http://localhost:8282/images/profile/${subadmin.stampImg}`} 
                      alt="Company Stamp" 
                      className="h-16 sm:h-20 w-auto object-contain" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                          <div class="border-2 border-red-500 rounded-full p-2 flex items-center justify-center h-16 sm:h-20 w-16 sm:w-20">
                            <div class="text-center">
                              <p class="font-bold text-red-600 text-xs sm:text-sm">COMPANY</p>
                              <p class="font-bold text-red-600 text-xs sm:text-sm">STAMP</p>
                            </div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                )}

                {/* Fallback stamp if no image */}
                {subadmin && !subadmin.stampImg && (
                  <div className="absolute bottom-8 sm:bottom-12 right-4 sm:right-8">
                    <div className="border-2 border-red-500 rounded-full p-2 flex items-center justify-center h-16 sm:h-20 w-16 sm:w-20">
                      <div className="text-center">
                        <p className="font-bold text-red-600 text-xs sm:text-sm">COMPANY</p>
                        <p className="font-bold text-red-600 text-xs sm:text-sm">STAMP</p>
                      </div>
                    </div>
                  </div>
                )}
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
    color: #fff;
    background: #e3342f;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 16px;
    text-align: center;
    font-weight: bold;
    font-size: 1rem;
    animation: blink-red 1s linear infinite;
    box-shadow: 0 2px 8px rgba(227,52,47,0.12);
    z-index: 20;
  }
  @keyframes blink-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
`;
if (typeof window !== 'undefined' && !document.getElementById('mobile-warning-blink-style')) {
  style.id = 'mobile-warning-blink-style';
  document.head.appendChild(style);
}

export default AppointmentLetter;