import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import "./Experience.css";

const ExperienceLetter = () => {
  // Mobile warning logic
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
  const letterRef = useRef(null); // Used for PDF and scrollable preview
  const autocompleteRef = useRef(null);
  
  // Additional states for PDF and email functionality
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
    achievements: '',
    signatoryName: '',
    signatoryTitle: ''
  });

  // Add date formatting function
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
        console.log("Fetching subadmin data...");
        
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem("user")) || {};
        // Use the logged-in user's email or fallback to hardcoded one
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        console.log("Fetching subadmin data for email:", email);
        const response = await axios.get(`https://api.managifyhr.com/api/subadmin/subadmin-by-email/${email}`);
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
      const response = await axios.get(`https://api.managifyhr.com/api/employee/${subadminId}/employee/all`);
      console.log("Employees API Response:", response.data);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setLoading(false);
    }
  };

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
      startDate: emp.joiningDate,
      // Don't set end date if employee is active
      endDate: emp.status === 'Active' || emp.status === 'active' ? '' : new Date().toISOString().split('T')[0],
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

  const handleDownloadPDF = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }

    try {
      setPdfGenerating(true);
      const element = letterRef.current;
      if (!element) {
        throw new Error("Letter content not found");
      }

      const fileName = `${formData.employeeName}_Experience_Letter.pdf`;
      toast.info('Preparing PDF download...');
      
      const options = { scale: 2, useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0 };
      const canvas = await html2canvas(element, options);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(fileName);
      
      toast.success("PDF successfully downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF: " + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadPDFWithImages = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }

    letterContainer.style.fontSize = '10pt';
    letterContainer.style.lineHeight = '1.3';
    
    // Reduce margins and padding for paragraphs
    const paragraphs = letterContainer.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.marginBottom = '0.6em';
      p.style.marginTop = '0.6em';
    });
    try {
      // First check and fix any image with missing dimensions
      const images = letterRef.current.querySelectorAll('img');
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log(`Image loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          
          img.onerror = (err) => {
            console.error(`Error loading image: ${img.src}`, err);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `https://api.managifyhr.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log('All images loaded successfully');
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set proper constraints on images to prevent them from being too large in PDF
      letterRef.current.querySelectorAll('img').forEach(img => {
        // Preserve original image classes but ensure max dimensions are set
        if (img.classList.contains('h-20')) {
          // Company logo shouldn't be more than 80px high in the PDF
          img.style.maxHeight = '80px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '200px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
          // Signature shouldn't be more than 60px high
          img.style.maxHeight = '60px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.src.includes('stampImg')) {
          // Stamp shouldn't be more than 100px in any dimension
          img.style.maxHeight = '100px';
          img.style.maxWidth = '100px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate the PDF with html2canvas using exact sizing
      const options = {
        scale: 1.5, // Lower scale for better text/image ratio
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
          // Process all images in the cloned document to ensure proper sizing
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            
            // Make sure the cloned document has the same image size constraints
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '200px';
            } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
              img.style.maxHeight = '60px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.src.includes('stampImg')) {
              img.style.maxHeight = '100px';
              img.style.maxWidth = '100px';
              img.style.height = 'auto';
              img.style.width = 'auto';
            }
            
            // Ensure any remaining images with no dimensions get defaults
            if (!img.style.width && !img.hasAttribute('width') && img.naturalWidth) {
              const maxWidth = Math.min(img.naturalWidth, 200);
              img.style.width = `${maxWidth}px`;
            }
            if (!img.style.height && !img.hasAttribute('height') && img.naturalHeight) {
              const maxHeight = Math.min(img.naturalHeight, 100);
              img.style.height = `${maxHeight}px`;
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              img.src = `https://api.managifyhr.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterRef.current, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Create PDF with precise A4 sizing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 16 // Higher precision for better quality
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert the canvas to an image with high quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality
      
      // Calculate dimensions to maintain aspect ratio but fit on A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        // Content fits on one page - add with centering
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      } else {
        // Content needs multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            imgData,
            'JPEG',
            0,
            position,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      // Restore original styles
      letterContainer.style.cssText = originalStyle;
      
      // Save the PDF with safe filename (handles case when employee data is not defined)
      const fileName = selectedEmployee 
        ? `Experience_Letter_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`
        : `Experience_Letter_${formData.employeeName.replace(/\s+/g, '_') || 'Employee'}.pdf`;
      
      pdf.save(fileName);
      toast.success("PDF successfully downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF: " + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }
    
    if (!subadmin) {
      toast.error("Company information not loaded");
      return;
    }
    
    setSendingEmail(true);
    try {
      // Store original styles to restore later
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust the container to optimize for PDF generation - CRITICAL FOR EMAIL
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '9pt'; // Slightly smaller font for email to ensure fit on one page
      letterContainer.style.lineHeight = '1.2'; // Tighter line height for email
      
      // Optimize spacing for paragraphs to fit on one page
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.5em';
        p.style.marginTop = '0.5em';
      });
      
      // Adjust the spacing of elements to ensure everything fits on one page
      const contentDivs = letterContainer.querySelectorAll('div');
      contentDivs.forEach(div => {
        if (div.classList.contains('mt-16') || div.classList.contains('mt-12') || div.classList.contains('mt-10')) {
          div.style.marginTop = '1rem';
        }
        if (div.classList.contains('mt-8')) {
          div.style.marginTop = '0.75rem';
        }
      });
      
      // First check and fix any image with missing dimensions
      const images = letterRef.current.querySelectorAll('img');
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log(`Image loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          
          img.onerror = (err) => {
            console.error(`Error loading image: ${img.src}`, err);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `https://api.managifyhr.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log('All images loaded successfully for email');
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Adjust stamp position to ensure it's on the first page
      const stampElement = letterRef.current.querySelector('.absolute.bottom-24.right-8');
      if (stampElement) {
        stampElement.style.bottom = 'auto';
        stampElement.style.top = '75%'; // Position from top instead of bottom
        stampElement.style.right = '2rem';
      }
      
      // Set proper constraints on images to prevent them from being too large in PDF
      letterRef.current.querySelectorAll('img').forEach(img => {
        // Preserve original image classes but ensure max dimensions are set
        if (img.classList.contains('h-20')) {
          // Company logo shouldn't be more than 70px high in the PDF for email
          img.style.maxHeight = '70px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
          // Signature shouldn't be more than 50px high for email
          img.style.maxHeight = '50px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '150px';
          img.style.objectFit = 'contain';
        } else if (img.src.includes('stampImg')) {
          // Stamp shouldn't be more than 90px in any dimension for email
          img.style.maxHeight = '90px';
          img.style.maxWidth = '90px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate PDF with enhanced options optimized for email
      const options = {
        scale: 1.3, // Lower scale for better text/image ratio and to fit on one page
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
          // Process all images in the cloned document to ensure proper sizing
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            
            // Make sure the cloned document has the same image size constraints
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '70px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-16') || img.classList.contains('h-12')) {
              img.style.maxHeight = '50px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '150px';
            } else if (img.src.includes('stampImg')) {
              img.style.maxHeight = '90px';
              img.style.maxWidth = '90px';
              img.style.height = 'auto';
              img.style.width = 'auto';
            }
            
            // Ensure any remaining images with no dimensions get defaults
            if (!img.style.width && !img.hasAttribute('width') && img.naturalWidth) {
              const maxWidth = Math.min(img.naturalWidth, 200);
              img.style.width = `${maxWidth}px`;
            }
            if (!img.style.height && !img.hasAttribute('height') && img.naturalHeight) {
              const maxHeight = Math.min(img.naturalHeight, 100);
              img.style.height = `${maxHeight}px`;
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              img.src = `https://api.managifyhr.com${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterRef.current, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Convert the canvas to a high quality JPEG image
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Create PDF with precise A4 sizing
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to maintain aspect ratio but fit on A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        // Content fits on one page - add with centering
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      } else {
        // Content needs multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            imgData,
            'JPEG',
            0,
            position,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', pdfBlob, `ExperienceLetter_${selectedEmployee.firstName}.pdf`);
      
      // Send to API
      const response = await axios.post(
        `https://api.managifyhr.com/api/certificate/send/${subadmin.id}/${selectedEmployee.empId}/experience`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Email API Response:', response.data);
      toast.success(`Experience letter sent to ${selectedEmployee.email} successfully!`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
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
      transition={{ duration: 0.5 }}
      className={`p-4 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back to Certificates
          </button>
          
          <div className="flex space-x-3">
            {/* <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition duration-300 flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button> */}
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 flex items-center"
              disabled={pdfGenerating}
            >
              <FaDownload className="mr-2" /> {pdfGenerating ? 'Generating...' : 'Download'}
            </button>
            <button 
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 flex items-center"
              disabled={sendingEmail || !selectedEmployee}
            >
              <FaEnvelope className="mr-2" /> {sendingEmail ? 'Sending...' : 'Email'}
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded">
            <p>Failed to connect to the API. Some features might be limited.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <h2 className="text-xl font-bold mb-4 text-center">Experience Letter Details</h2>
              
              {subadmin && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Company Information</h3>
                  <div className="p-3 rounded border bg-opacity-50 bg-blue-50 border-blue-200">
                    <p className="font-semibold">{subadmin.registercompanyname}</p>
                    <p className="text-sm">{subadmin.address}</p>
                    <p className="text-sm">GST: {subadmin.gstno}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-4 relative" ref={autocompleteRef}>
                <label className="block text-sm font-medium mb-1">Search Employee</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full p-2 pr-10 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Search by name, email or job role"
                  />
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                
                {showDropdown && filteredEmployees.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    {filteredEmployees.map(emp => (
                      <div 
                        key={emp.empId} 
                        className={`p-2 cursor-pointer hover:bg-blue-100 hover:text-blue-800 ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-blue-50'}`}
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs flex justify-between">
                          <span>{emp.jobRole}</span>
                          <span className={`px-2 rounded-full text-xs ${emp.status === 'Active' || emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showDropdown && searchTerm && filteredEmployees.length === 0 && (
                  <div className={`absolute z-10 w-full mt-1 p-2 rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    No employees found
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Employee Name</label>
                <input 
                  type="text" 
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Full name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input 
                  type="text" 
                  name="employeeJobTitle"
                  value={formData.employeeJobTitle}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Position/Title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Main Responsibilities</label>
                <textarea 
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Briefly describe employee's main responsibilities and tasks"
                  rows="4"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notable Achievements</label>
                <textarea 
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Notable achievements or accomplishments (optional)"
                  rows="4"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Name</label>
                  <input 
                    type="text" 
                    name="signatoryName"
                    value={formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : '')}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Title</label>
                  <input 
                    type="text" 
                    name="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Your Title"
                  />
                </div>
              </div>
            </div>
          </div>

          {isMobile && (
            <div className="mobile-warning-blink overflow-x-auto pb-4 mb-6">
              To View Certificate In Full Size Please Open It In Desktop Site Mode.
            </div>
          )}
          {/* Letter Preview Section - Enhanced with beautiful design */}
          <div className="lg:col-span-2 overflow-x-auto">
            <div ref={letterRef} className="bg-white text-black p-8 rounded-lg shadow-xl min-h-[29.7cm] w-[21cm] mx-auto relative border border-gray-200">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-blue-600 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-blue-600 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-blue-600 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-blue-600 rounded-br-lg"></div>
              
              {/* Subtle watermark */}
              {subadmin && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <h1 className="text-9xl font-bold text-center transform rotate-12 text-gray-500">{subadmin.registercompanyname}</h1>
                </div>
              )}
              
              {/* Company Letterhead - Updated with elegant design */}
              <div className="mb-10">
                <div className="flex justify-between items-start mb-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0 mr-4">
                    {subadmin && subadmin.companylogo ? (
                      <img 
                        src={`https://api.managifyhr.com/images/profile/${subadmin.companylogo}`} 
                        alt="Company Logo" 
                        className="h-20 object-contain" 
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                        }}
                      />
                    ) : null}
                  </div>
                  
                  {/* Company Details aligned to the right */}
                  <div className="flex flex-col items-end text-right">
                    <h2 className="font-bold text-xl text-blue-800">{subadmin?.registercompanyname || "Your Company Name"}</h2>
                    <p className="text-sm text-gray-600">{subadmin?.address || "Company Address"}</p>
                    <p className="text-sm text-gray-600">GST: {subadmin?.gstno || "GSTIN"}</p>
                  </div>
                </div>
                
                <hr className="border-t-2 border-blue-600 my-3" />
              </div>

              {/* Date with elegant styling */}
              <div className="mb-10">
                <p className="text-gray-700 font-semibold">{formatDate(new Date().toISOString())}</p>
              </div>

              {/* Subject Line with enhanced design */}
              <div className="mb-10 text-center">
                <h1 className="text-2xl font-bold text-blue-800 mb-2">EXPERIENCE LETTER</h1>
                <div className="border-b-2 border-yellow-500 w-1/3 mx-auto"></div>
              </div>

              {/* Salutation with refined spacing */}
              <div className="mb-6">
                <p className="text-gray-800 font-semibold">To Whom It May Concern,</p>
              </div>

              {/* Content with elegant typography and spacing */}
              <div className="space-y-5 mb-10 leading-relaxed text-gray-800">
                <p className="text-justify">
                  I hereby certify that <span className="font-semibold text-blue-800">{formData.employeeName || "[Employee's Full Name]"}</span>, 
                  {formData.employeeJobTitle ? ` ${formData.employeeJobTitle}, ` : " [Employee's Job Title], "}was employed 
                  with <span className="font-semibold text-blue-800">{subadmin?.registercompanyname || "[Your Company Name]"}</span> from 
                  {formData.startDate ? ` ${formatDate(formData.startDate)}` : " [Start Date]"} to 
                  {formData.endDate ? ` ${formatDate(formData.endDate)}` : " [End Date]"}.
                </p>

                <p className="text-justify">
                  During this period, <span className="font-semibold text-blue-800">{formData.employeeName || "[Employee's Full Name]"}</span> was responsible for {formData.responsibilities || "[Briefly describe employee's main responsibilities and tasks]"}. 
                  They consistently met and exceeded performance standards and demonstrated exceptional professionalism in all assigned tasks.
                </p>

                {formData.achievements && (
                  <p className="text-justify">
                    <span className="font-semibold text-blue-800">{formData.employeeName || "[Employee's Full Name]"}</span> also {formData.achievements}.
                  </p>
                )}

                <p className="text-justify">
                  I can confidently attest to <span className="font-semibold text-blue-800">{formData.employeeName || "[Employee's Full Name]"}</span>'s professionalism, dedication, and 
                  contribution to our organization. They were a valuable asset to our team and 
                  consistently upheld our company's values.
                </p>

                <p className="text-justify">
                  We wish <span className="font-semibold text-blue-800">{formData.employeeName || "[Employee's Full Name]"}</span> continued success in their future endeavors.
                </p>
              </div>

              {/* Signature section with refined styling */}
              <div className="mt-40">
                <p className="font-semibold text-gray-800">Sincerely,</p>
                <div className="mt-8 flex justify-between items-start">
                  <div>
                    {subadmin && subadmin.signature ? (
                      <div className="border-b border-gray-300 pb-1 w-48">
                        <img 
                          src={`https://api.managifyhr.com/images/profile/${subadmin.signature}`} 
                          alt="Signature" 
                          className="h-16 mb-2 object-contain" 
                          onError={(e) => {
                            console.error('Error loading signature:', e);
                            e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center mb-1">
                        <span className="text-gray-500">Signature</span>
                      </div>
                    )}
                    <p className="font-bold text-blue-800 mt-2">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "[Your Name]")}</p>
                    <p className="text-gray-700">{formData.signatoryTitle || "[Your Title]"}</p>
                    <p className="text-gray-700">{subadmin?.registercompanyname || "[Company Name]"}</p>
                  </div>

                  {/* Stamp if available - with text label above it */}
                  {subadmin && subadmin.stampImg && (
                    <div className="flex flex-col items-center">
                      {/* Text label above stamp */}
                      <div className="text-center mb-1">
                        {/* <p className="font-bold text-blue-600 text-sm">{subadmin.registercompanyname}</p> */}
                      </div>
                      
                      <img 
                        src={`https://api.managifyhr.com/images/profile/${subadmin.stampImg}`} 
                        alt="Company Stamp" 
                        className="h-28 w-auto object-cover transform scale-100 shadow-sm" 
                        style={{
                          imageRendering: 'crisp-edges',
                          opacity: 0.9
                        }}
                        onError={(e) => {
                          console.error('Error loading stamp:', e);
                          // Instead of hiding, show a text-based stamp as fallback
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div class="border-2 border-red-500 rounded-full p-4 flex items-center justify-center h-28 w-28">
                              <div class="text-center">
                                <p class="font-bold text-red-600">COMPANY</p>
                                <p class="font-bold text-red-600">STAMP</p>
                              </div>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  )}

                  {/* Text-based stamp alternative - Show this if you prefer text over image */}
                  {subadmin && !subadmin.stampImg && (
                    <div className="flex flex-col items-center">
                      <div className="text-center mb-1 mt-16">
                        <p className="font-bold text-blue-600 text-lg">{subadmin.registercompanyname}</p>
                      </div>
                      <div className="border-2 border-red-500 rounded-full p-4 flex items-center justify-center h-28 w-28 rotate-12">
                        <div className="text-center">
                          <p className="font-bold text-red-600 text-lg">{subadmin.registercompanyname}</p>
                          <p className="font-bold text-red-600">VERIFIED</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceLetter;