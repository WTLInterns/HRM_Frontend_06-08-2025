import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TerminationLetter = () => {
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
  const letterRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Additional states for PDF and email functionality
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    terminationDate: new Date().toISOString().split('T')[0],
    terminationReason: '',
    specificViolations: '',
    warningDates: '',
    finalPayDate: '',
    companyProperty: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
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
    // Add print-specific styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Hide everything except the letter content */
        body * {
          visibility: hidden;
        }
        
        /* Show the letter content and all its children */
        #letter-content, #letter-content * {
          visibility: visible !important;
        }
        
        /* Position the letter content */
        #letter-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        
        /* Hide elements that shouldn't print */
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Print the document
    window.print();

    // Remove the print styles after printing
    document.head.removeChild(style);
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;
    
    setPdfGenerating(true);
    
    // Store original styles to restore later
    const letterContainer = letterRef.current;
    const originalStyle = letterContainer.style.cssText;
    
    // Temporarily adjust the container to optimize for PDF generation
    letterContainer.style.width = '210mm';
    letterContainer.style.height = 'auto';
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
            const newSrc = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
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
        } else if (img.classList.contains('h-16')) {
          // Signature shouldn't be more than 60px high
          img.style.maxHeight = '60px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
          // Stamp shouldn't be more than 100px in any dimension
          img.style.maxHeight = '100px';
          img.style.maxWidth = '100px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Apply scaling to letter container to ensure it fits on one page
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust the container to optimize for PDF generation
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '10pt';
      letterContainer.style.lineHeight = '1.3';
      
      // Reduce margins and padding
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.6em';
        p.style.marginTop = '0.6em';
      });
      
      // Generate the PDF with html2canvas using high quality settings
      const options = {
        scale: 2, // Balanced scale for better text/image ratio
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        imageRendering: 'high-quality',
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
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
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
              img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterRef.current, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Create PDF with precise A4 sizing and high quality settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 16 // Higher precision for better quality
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert the canvas to an image with maximum quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
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
        ? `Termination_Letter_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`
        : `Termination_Letter_${formData.employeeName.replace(/\s+/g, '_') || 'Employee'}.pdf`;
      
      pdf.save(fileName);
      toast.success('PDF downloaded successfully!');
      setPdfGenerating(false);
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
            const newSrc = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
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
        } else if (img.classList.contains('h-16')) {
          // Signature shouldn't be more than 60px high
          img.style.maxHeight = '60px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
          // Stamp shouldn't be more than 100px in any dimension
          img.style.maxHeight = '100px';
          img.style.maxWidth = '100px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Apply scaling to letter container to ensure it fits on one page
      const letterContainer = letterRef.current;
      const originalStyle = letterContainer.style.cssText;
      
      // Temporarily adjust the container to optimize for PDF generation
      letterContainer.style.width = '210mm';
      letterContainer.style.height = 'auto';
      letterContainer.style.fontSize = '10pt';
      letterContainer.style.lineHeight = '1.3';
      
      // Reduce margins and padding for paragraphs
      const paragraphs = letterContainer.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.6em';
        p.style.marginTop = '0.6em';
      });
      
      // Generate PDF with enhanced options
      const options = {
        scale: 2, // Balanced scale for better text/image ratio
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        imageRendering: 'high-quality',
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
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
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
              img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterRef.current, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Convert the canvas to a maximum quality JPEG image
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      // Create PDF with precise A4 sizing and high quality settings
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        precision: 16 // Higher precision for better quality
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
      
      // Get the PDF as blob
      const pdfBlob = pdf.output('blob');
      
      // Create File object from blob
      const pdfFile = new File(
        [pdfBlob], 
        `${selectedEmployee.firstName}_${selectedEmployee.lastName}_Termination_Letter.pdf`, 
        { type: 'application/pdf' }
      );
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      // Get employee full name
      const employeeFullName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;
      
      // Send the document using the backend API
      const response = await axios.post(
        `http://localhost:8282/api/certificate/send/${subadmin.id}/${selectedEmployee.empId}/termination`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.emailSent) {
        toast.success(`Termination letter sent to ${selectedEmployee.email} successfully!`);
      } else if (response.data.filePath) {
        toast.success('Termination letter saved successfully, but email could not be sent.');
      } else {
        toast.error('Failed to process the termination letter.');
      }
    } catch (error) {
      console.error("Error sending termination letter:", error);
      toast.error("Failed to send termination letter: " + (error.response?.data?.error || error.message));
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
              <h2 className="text-xl font-bold mb-4 text-center">Termination Letter Details</h2>
              
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input 
                    type="text" 
                    name="employeeDepartment"
                    value={formData.employeeDepartment}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Department"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Termination Date</label>
                <input 
                  type="date" 
                  name="terminationDate"
                  value={formData.terminationDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Termination Reason</label>
                <textarea 
                  name="terminationReason"
                  value={formData.terminationReason}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., performance issues, policy violations"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Specific Violations/Issues</label>
                <textarea 
                  name="specificViolations"
                  value={formData.specificViolations}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="Details of specific issues or violations"
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Prior Warnings (Dates)</label>
                <input 
                  type="text" 
                  name="warningDates"
                  value={formData.warningDates}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., March 15, 2025; April 2, 2025"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Final Pay Date</label>
                <input 
                  type="date" 
                  name="finalPayDate"
                  value={formData.finalPayDate}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Company Property to Return</label>
                <textarea 
                  name="companyProperty"
                  value={formData.companyProperty}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., laptop, access card, company phone"
                  rows="2"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input 
                    type="text" 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Contact person for questions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email/Phone</label>
                  <input 
                    type="text" 
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-300'}`}
                    placeholder="Email or phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Signatory Name</label>
                  <input 
                    type="text" 
                    name="signatoryName"
                    value={formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "")}
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

          {/* Letter Preview Section */}
          <div className="lg:col-span-2 order-2 lg:order-none w-full">
            {isMobile && (
              <div className="mobile-warning-blink overflow-x-auto pb-4 mb-6">
                To View Certificate In Full Size Please Open It In Desktop Site Mode.
              </div>
            )}
            <div ref={letterRef} className="bg-white text-black p-8 rounded-lg shadow-xl min-h-[29.7cm] w-[21cm] mx-auto relative border border-gray-200" style={{overflow: 'hidden'}}>
              
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
                        src={`http://localhost:8282/images/profile/${subadmin.companylogo}`} 
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
                    <h2 className="font-bold text-xl text-purple-800">{subadmin?.registercompanyname || "Your Company Name"}</h2>
                    <p className="text-sm text-gray-600">{subadmin?.address || "Company Address"}</p>
                    <p className="text-sm text-gray-600">GST: {subadmin?.gstno || "GSTIN"}</p>
                  </div>
                </div>
                
                <hr className="border-t-2 border-purple-600 my-3" />
              </div>
              
              {/* Date with elegant styling */}
              <div className="mb-6 text-right">
                <p className="text-gray-700 font-semibold">{formatDate(new Date().toISOString())}</p>
              </div>
              
              {/* Employee and Company Information */}
              <div className="flex justify-between mb-8">
                <div className="w-1/2">
                  <p className="mb-1 font-medium">{formData.employeeName || "[Employee Name]"}</p>
                  <p className="mb-1 text-gray-600">{formData.employeeJobTitle || "[Employee Job Title]"}</p>
                  <p className="mb-1 text-gray-600">{formData.employeeDepartment || "[Employee Department]"}</p>
                </div>
              </div>
              
              {/* Subject Line with enhanced design */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-purple-800 mb-2">NOTICE OF TERMINATION OF EMPLOYMENT</h1>
                <div className="border-b-2 border-purple-500 w-1/3 mb-4"></div>
                <p className="font-semibold text-gray-700">Subject: Termination of Employment (with cause)</p>
              </div>
              
              {/* Salutation */}
              <div className="mb-5">
                <p className="text-gray-800">Dear <span className="font-semibold">{formData.employeeName || "[Employee Name]"}</span>,</p>
              </div>
              
              {/* Main Content with improved typography */}
              <div className="space-y-4 mb-6 text-gray-800 leading-relaxed">
                <p className="text-justify">
                  We regret to inform you that your employment with <span className="font-semibold text-purple-800">{subadmin?.registercompanyname || "[Company Name]"}</span> is terminated, effective 
                  immediately, due to <span className="font-semibold">{formData.terminationReason || "[specific reason, e.g., repeated policy violations or performance issues]"}</span>.
                </p>
                
                <p className="text-justify">
                  This decision is based on a thorough assessment of your {formData.specificViolations ? formData.specificViolations.split(',')[0] : "[conduct/behavior/performance]"} and made only 
                  after careful consideration, for the following reasons:
                </p>
                
                <ul className="list-disc pl-8 space-y-2">
                  <li>
                    {formData.specificViolations || "Detailed example of the issue, e.g., consistent failure to meet performance targets despite feedback and support provided on [specific dates]"}
                  </li>
                  <li>
                    {formData.warningDates ? `Ignoring prior warnings or disciplinary actions, e.g., written warning issued on ${formData.warningDates}` : "Ignoring prior warnings or disciplinary actions, e.g., written warning issued on [specific dates]"}
                  </li>
                </ul>
                
                <p className="text-justify">
                  Your final paycheck, including compensation for {formData.finalPayDate ? `any accrued benefits, if applicable, will be provided on ${formatDate(formData.finalPayDate)}` : "any accrued benefits, if applicable, will be provided on [date]"}. Please note that this decision is final and non-negotiable, legal action may be taken if necessary.
                </p>
                
                <p className="text-justify">
                  Please return all company property, including {formData.companyProperty || "[list items], by [deadline]"}. If you have questions, please 
                  contact <span className="font-semibold">{formData.contactPerson || "[Contact Name]"}</span> at <span className="text-blue-600">{formData.contactEmail || "email address/phone number"}</span>.
                </p>
              </div>
              
              {/* Closing with refined styling */}
              <div className="mt-12">
                <p className="font-semibold text-gray-800">Best regards,</p>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    {subadmin && subadmin.signature ? (
                      <div>
                        <img 
                          src={`http://localhost:8282/images/profile/${subadmin.signature}`} 
                          alt="Signature" 
                          className="h-16 object-contain mb-2" 
                          onError={(e) => {
                            console.error('Error loading signature:', e);
                            e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                          }}
                        />
                        <div className="border-b border-gray-300 w-48 mb-2"></div>
                        <p className="text-gray-700 mt-1 font-semibold">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "")}</p>
                        {formData.signatoryTitle && <p className="text-gray-600 text-sm">{formData.signatoryTitle}</p>}
                      </div>
                    ) : (
                      <div>
                        <div className="h-16 mb-2"></div>
                        <div className="border-b border-gray-300 w-48 mb-2"></div>
                        <p className="text-gray-700 mt-1 font-semibold">{formData.signatoryName || (subadmin ? `${subadmin.name} ${subadmin.lastname}` : "")}</p>
                        {formData.signatoryTitle && <p className="text-gray-600 text-sm">{formData.signatoryTitle}</p>}
                      </div>
                    )}
                  </div>

                  {/* Stamp if available - with improved styling */}
                  {subadmin && subadmin.stampImg && (
                    <div className="flex flex-col items-center">
                      <img 
                        src={`http://localhost:8282/images/profile/${subadmin.stampImg}`} 
                        alt="Company Stamp" 
                        className="h-32 w-32 object-contain transform scale-100 shadow-sm" 
                        style={{ 
                          imageRendering: 'high-quality',
                          opacity: 0.9
                        }}
                        onError={(e) => {
                          console.error('Error loading stamp:', e);
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div class="border-2 border-purple-500 rounded-full p-4 flex items-center justify-center h-32 w-32 rotate-6">
                              <div class="text-center">
                                <p class="font-bold text-purple-800">${subadmin.registercompanyname || "COMPANY"}</p>
                                <p class="font-bold text-purple-800">OFFICIAL</p>
                              </div>
                            </div>
                          `;
                        }}
                      />
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

export default TerminationLetter; 