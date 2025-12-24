import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RelievingLetter = () => {
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
  
  // Form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeJobTitle: '',
    employeeDepartment: '',
    lastWorkingDate: new Date().toISOString().split('T')[0],
    joinDate: '',
    accomplishments: '',
    responsibilities: '',
    companyProperty: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    signatoryName: '',
    signatoryTitle: ''
  });

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
        const response = await axios.get(`http://localhost:8081/api/subadmin/subadmin-by-email/${email}`);
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
      const response = await axios.get(`http://localhost:8081/api/employee/${subadminId}/employee/all`);
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

  // ...rest of logic

  // --- RENDER STARTS HERE ---
  // (Find the section between form and letter preview, and add the warning)

  const MobileWarning = () => (
  isMobile && (
    <div className="mobile-warning-blink overflow-x-auto pb-4 mb-6">
      To View Certificate In Full Size Please Open It In Desktop Site Mode.
    </div>
  )
);

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
      joinDate: emp.joiningDate || new Date().toISOString().split('T')[0],
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
      console.log(`Found ${images.length} images in the letter`);
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            console.log(`Image already loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
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
            const newSrc = `http://localhost:8081${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            console.log(`Reloading image: ${currentSrc}`);
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log("All images loaded for PDF generation");
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if signatory name is visible
      const signatoryName = letterRef.current.querySelector('#signatory-name');
      if (signatoryName) {
        console.log("Signatory name exists:", signatoryName.textContent);
        // Ensure the name is visible by setting a more prominent style
        signatoryName.style.fontWeight = "700";
        signatoryName.style.color = "#000000";
        signatoryName.style.fontSize = "14px";
        signatoryName.style.fontFamily = "Arial, sans-serif";
      } else {
        console.warn("Signatory name element not found");
      }
      
      // Remove any additional padding or margin that might add whitespace
      const originalStyles = {};
      const letterElement = letterRef.current;
      
      // Store original styles
      originalStyles.padding = letterElement.style.padding;
      originalStyles.margin = letterElement.style.margin;
      originalStyles.height = letterElement.style.height;
      
      // Apply tight fitting styles to remove extra whitespace
      letterElement.style.padding = '8px';
      letterElement.style.margin = '0';
      letterElement.style.height = 'auto';
      
      // Set proper constraints on images
      letterRef.current.querySelectorAll('img').forEach(img => {
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
      });
      
      // Generate PDF with html2canvas using high quality settings
      const canvas = await html2canvas(letterRef.current, {
        scale: 3, // Higher scale for better image quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        windowWidth: letterRef.current.scrollWidth,
        windowHeight: letterRef.current.scrollHeight,
        x: 0,
        y: 0,
        width: letterRef.current.offsetWidth,
        height: letterRef.current.offsetHeight,
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        imageRendering: 'high-quality',
        foreignObjectRendering: false, // This can be problematic with some text
        onclone: (clonedDoc) => {
          // Get the cloned letter element
          const clonedLetter = clonedDoc.querySelector('#signatory-name');
          if (clonedLetter) {
            clonedLetter.style.fontWeight = "700";
            clonedLetter.style.color = "#000000";
            clonedLetter.style.fontSize = "14px";
            clonedLetter.style.fontFamily = "Arial, sans-serif";
            console.log("Styled signatory name in cloned document:", clonedLetter.textContent);
          }
          
          // Process all text elements to ensure visibility
          const textElements = clonedDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
          textElements.forEach(el => {
            // Ensure text is visible
            el.style.color = el.style.color || "#000000";
            el.style.fontFamily = el.style.fontFamily || "Arial, sans-serif";
          });
          
          const clonedImages = clonedDoc.querySelectorAll('img');
          console.log(`Processing ${clonedImages.length} images in cloned document`);
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            // Apply same styling constraints as above
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.maxWidth = '200px';
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
              img.style.maxHeight = '100px';
              img.style.maxWidth = '100px';
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              const originalSrc = img.src;
              img.src = `http://localhost:8081${img.src.startsWith('/') ? '' : '/'}${img.src}`;
              console.log(`Fixed image URL: ${originalSrc} -> ${img.src}`);
            }
          });
        }
      });
      
      // Restore original styles after capturing
      letterElement.style.padding = originalStyles.padding;
      letterElement.style.margin = originalStyles.margin;
      letterElement.style.height = originalStyles.height;
      
      console.log(`Canvas generated: ${canvas.width}x${canvas.height}`);
      
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
      
      // Convert the canvas to an image with maximum quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate dimensions to maintain aspect ratio but fit on A4
      const imgWidth = pdfWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If content is too tall, scale it down to fit on one page
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight * 0.95; // 95% of page height to leave small margins
      }
      
      // Add image to PDF (single page only)
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
      
      // Restore original styles
      letterContainer.style.cssText = originalStyle;
      
      // Save the PDF with safe filename (handles case when employee data is not defined)
      const fileName = selectedEmployee 
        ? `Relieving_Letter_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`
        : `Relieving_Letter_${formData.employeeName.replace(/\s+/g, '_') || 'Employee'}.pdf`;
      
      pdf.save(fileName);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to download PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!letterRef.current) return;
    
    // Check if we have a valid employee selected
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }
    
    if (!subadmin) {
      toast.error('Company information not loaded');
      return;
    }
    
    setSendingEmail(true);
    try {
      console.log("Preparing relieving letter for:", selectedEmployee.email);
      
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
        if (div.classList.contains('mt-16') || div.classList.contains('mt-12') || div.classList.contains('mt-10') || div.classList.contains('mt-6')) {
          div.style.marginTop = '0.75rem';
        }
        if (div.classList.contains('mt-8')) {
          div.style.marginTop = '0.5rem';
        }
        // Reduce height of spacer divs
        if (div.classList.contains('h-28')) {
          div.style.height = '1rem';
        }
      });
      
      // Adjust stamp position to ensure it's on the first page
      const stampElement = letterRef.current.querySelector('.absolute.bottom-32.right-8');
      if (stampElement) {
        stampElement.style.bottom = 'auto';
        stampElement.style.top = '75%'; // Position from top instead of bottom
        stampElement.style.right = '2rem';
      }
      
      // Check for images with missing dimensions first
      const images = letterRef.current.querySelectorAll('img');
      console.log(`Found ${images.length} images in the letter for email`);
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            console.log(`Image already loaded: ${img.src}`);
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log("Image loaded successfully:", img.src);
            resolve();
          };
          img.onerror = () => {
            console.error("Failed to load image:", img.src);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `http://localhost:8081${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log("Converting image URL:", img.src, "to", newSrc);
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
      console.log("All images loaded for email PDF generation");
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if signatory name is visible
      const signatoryName = letterRef.current.querySelector('#signatory-name');
      if (signatoryName) {
        console.log("Signatory name exists for email:", signatoryName.textContent);
        // Ensure the name is visible by setting a more prominent style
        signatoryName.style.fontWeight = "700";
        signatoryName.style.color = "#000000";
        signatoryName.style.fontSize = "14px";
        signatoryName.style.fontFamily = "Arial, sans-serif";
      } else {
        console.warn("Signatory name element not found for email generation");
      }
      
      // Set proper constraints on images - optimized for email to fit on one page
      letterRef.current.querySelectorAll('img').forEach(img => {
        if (img.classList.contains('h-20')) {
          img.style.maxHeight = '70px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '180px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-16')) {
          img.style.maxHeight = '50px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '150px';
          img.style.objectFit = 'contain';
        } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
          img.style.maxHeight = '90px';
          img.style.maxWidth = '90px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate PDF with html2canvas - optimized settings for email to fit on one page
      const canvas = await html2canvas(letterRef.current, {
        scale: 1.3, // Lower scale for better text/image ratio and to fit on one page
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        letterRendering: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          // Get the cloned letter element
          const clonedLetter = clonedDoc.querySelector('#signatory-name');
          if (clonedLetter) {
            clonedLetter.style.fontWeight = "700";
            clonedLetter.style.color = "#000000";
            clonedLetter.style.fontSize = "14px";
            clonedLetter.style.fontFamily = "Arial, sans-serif";
            console.log("Styled signatory name in cloned document for email:", clonedLetter.textContent);
          }
          
          // Process all text elements to ensure visibility
          const textElements = clonedDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
          textElements.forEach(el => {
            // Ensure text is visible
            el.style.color = el.style.color || "#000000";
            el.style.fontFamily = el.style.fontFamily || "Arial, sans-serif";
          });
          
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            // Apply same styling constraints as above
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.maxWidth = '200px';
            } else if (img.classList.contains('h-16')) {
              img.style.maxHeight = '60px';
              img.style.maxWidth = '180px';
            } else if (img.classList.contains('h-32') || img.src.includes('stampImg')) {
              img.style.maxHeight = '100px';
              img.style.maxWidth = '100px';
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              img.src = `http://localhost:8081${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      });
      
      // Create PDF with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to maintain aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
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
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
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
        `${selectedEmployee.firstName}_${selectedEmployee.lastName}_Relieving_Letter.pdf`, 
        { type: 'application/pdf' }
      );
      
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      // Send the document using the backend API
      const response = await axios.post(
        `http://localhost:8081/api/certificate/send/${subadmin.id}/${selectedEmployee.empId}/relieving`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.emailSent) {
        toast.success(`Relieving letter sent to ${selectedEmployee.email} successfully!`);
      } else if (response.data.filePath) {
        toast.success('Relieving letter saved successfully, but email could not be sent.');
      } else {
        toast.error('Failed to process the relieving letter.');
      }
    } catch (error) {
      console.error("Error sending relieving letter:", error);
      toast.error("Failed to send relieving letter: " + (error.response?.data?.error || error.message));
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
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border ${isDarkMode ? 'border-slate-600' : 'border-blue-100'}`}>
              <h2 className="text-xl font-bold mb-6 text-center relative pb-3">
                <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Relieving Letter Details</span>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></span>
              </h2>
              
              {subadmin && (
                <div className="mb-6">
                  <h3 className={`text-md font-medium mb-2 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2H5v-2h10zM5 8h10v2H5V8z" clipRule="evenodd" />
                    </svg>
                    Company Information
                  </h3>
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-blue-50/50 border-blue-200'} shadow-sm`}>
                    <p className="font-semibold">{subadmin.registercompanyname}</p>
                    <p className="text-sm mt-1">{subadmin.address}</p>
                    <p className="text-sm mt-1 font-medium">GST: {subadmin.gstno}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-6 relative" ref={autocompleteRef}>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Search Employee
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                    } transition-all duration-200`}
                    placeholder="Search by name, email or job role"
                  />
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                </div>
                
                {showDropdown && filteredEmployees.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    {filteredEmployees.map(emp => (
                      <div 
                        key={emp.empId} 
                        className={`p-3 cursor-pointer border-b last:border-b-0 ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-blue-50'} transition-colors duration-200`}
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs flex justify-between mt-1">
                          <span>{emp.jobRole}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${emp.status === 'Active' || emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showDropdown && searchTerm && filteredEmployees.length === 0 && (
                  <div className={`absolute z-10 w-full mt-1 p-3 rounded-md shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'} border`}>
                    No employees found
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-0.5 rounded-lg shadow-sm mb-6">
                  <div className={`rounded-md p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Employee Information
                    </h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Employee Name</label>
                      <input 
                        type="text" 
                        name="employeeName"
                        value={formData.employeeName}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-purple-500 focus:ring-purple-500/30' 
                            : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/30'
                        } transition-all duration-200`}
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
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-purple-500 focus:ring-purple-500/30' 
                              : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/30'
                          } transition-all duration-200`}
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
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-purple-500 focus:ring-purple-500/30' 
                              : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/30'
                          } transition-all duration-200`}
                          placeholder="Department"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Join Date</label>
                        <input 
                          type="date" 
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-purple-500 focus:ring-purple-500/30' 
                              : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/30'
                          } transition-all duration-200`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Last Working Date</label>
                        <input 
                          type="date" 
                          name="lastWorkingDate"
                          value={formData.lastWorkingDate}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-purple-500 focus:ring-purple-500/30' 
                              : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/30'
                          } transition-all duration-200`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-0.5 rounded-lg shadow-sm mb-6">
                  <div className={`rounded-md p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                      Professional Details
                    </h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Accomplishments</label>
                      <textarea 
                        name="accomplishments"
                        value={formData.accomplishments}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-green-500 focus:ring-green-500/30' 
                            : 'bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/30'
                        } transition-all duration-200`}
                        placeholder="Notable achievements during tenure"
                        rows="3"
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Roles & Responsibilities</label>
                      <textarea 
                        name="responsibilities"
                        value={formData.responsibilities}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-green-500 focus:ring-green-500/30' 
                            : 'bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/30'
                        } transition-all duration-200`}
                        placeholder="Key roles and responsibilities"
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Company Property to Return</label>
                      <textarea 
                        name="companyProperty"
                        value={formData.companyProperty}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-slate-600 border-slate-500 focus:border-green-500 focus:ring-green-500/30' 
                            : 'bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/30'
                        } transition-all duration-200`}
                        placeholder="e.g., laptop, access card, company phone"
                        rows="2"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-0.5 rounded-lg shadow-sm mb-6">
                  <div className={`rounded-md p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                        <input 
                          type="text" 
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-amber-500 focus:ring-amber-500/30' 
                              : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/30'
                          } transition-all duration-200`}
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
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-amber-500 focus:ring-amber-500/30' 
                              : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/30'
                          } transition-all duration-200`}
                          placeholder="Email or phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-lg shadow-sm">
                  <div className={`rounded-md p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      Signatory Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Signatory Name</label>
                        <input 
                          type="text" 
                          name="signatoryName"
                          value={formData.signatoryName || (subadmin ? `${subadmin.name || ''} ${subadmin.lastname || ''}` : "")}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                              : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                          } transition-all duration-200`}
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Signatory Title</label>
                        <input 
                          type="text" 
                          name="signatoryTitle"
                          value={formData.signatoryTitle || (subadmin?.designation || "HR Director")}
                          onChange={handleInputChange}
                          className={`w-full p-2.5 border rounded-md focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-600 border-slate-500 focus:border-blue-500 focus:ring-blue-500/30' 
                              : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
                          } transition-all duration-200`}
                          placeholder="Your Title"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Letter Preview Section */}
          <div className="lg:col-span-2">
            {/* Place MobileWarning above the letter preview */}
            <MobileWarning />
            <div ref={letterRef} className="bg-white text-black p-8 rounded-lg shadow-xl min-h-[29.7cm] w-[21cm] mx-auto relative border border-gray-200" style={{overflow: 'hidden'}}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50 -z-1"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50 rounded-tr-full opacity-50 -z-1"></div>
              
              {/* Letter header with green accent */}
              <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 mb-6 rounded-md border-l-4 border-l-green-600 shadow-sm">
                <h1 className="text-2xl font-bold text-green-700 ml-2">Relieving Letter</h1>
              </div>
              
              {/* Company Letterhead */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0 mr-4">
                    {subadmin && subadmin.companylogo ? (
                      <img 
                        src={`http://localhost:8081/images/profile/${subadmin.companylogo}`} 
                        alt="Company Logo" 
                        className="h-20 object-contain" 
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.target.src = 'https://via.placeholder.com/150x50?text=Company+Logo';
                        }}
                      />
                    ) : (
                      <div className="h-16 flex items-center">
                        <p className="text-gray-500 border border-gray-200 rounded px-3 py-2">[Company Letterhead]</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Employee and Company Information */}
              <div className="flex justify-between mb-8">
                <div className="w-1/2 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className="mb-1 font-medium">{formData.employeeName || "[Employee Name]"}</p>
                  <p className="mb-1 text-sm text-gray-600">{formData.employeeJobTitle || "[Employee Job Title]"}</p>
                  <p className="mb-1 text-sm text-gray-600">{formData.employeeDepartment || "[Employee Department]"}</p>
                </div>
                <div className="w-1/2 text-right bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className="mb-1 font-medium">{subadmin?.registercompanyname || "[Company Name]"}</p>
                  <p className="mb-1 text-sm text-gray-600">{subadmin?.address || "[Company Address]"}</p>
                  <p className="mb-1 text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Subject Line */}
              <div className="mb-4 border-b pb-2 border-gray-200">
                <p className="font-bold text-green-700">Subject: Relieving Letter</p>
              </div>
              
              {/* Main Content */}
              <div className="space-y-4 mb-6 text-gray-800">
                <p className="leading-relaxed">
                  This letter serves as confirmation that you have been relieved from your duties at {subadmin?.registercompanyname || "[Company Name]"} as of {formData.lastWorkingDate ? new Date(formData.lastWorkingDate).toLocaleDateString() : "[Last Working Date]"}. We would like to take this opportunity to thank you for your valuable contributions and efforts during your tenure with us as a {formData.employeeJobTitle || "[Job Title]"}.
                </p>
                
                <p className="leading-relaxed">
                  We understand that you have resigned from your position to pursue other opportunities, and we wish you the very best in all your future endeavors. Your performance, commitment, and positive attitude have made a significant impact on the organization, and we hope that you carry forward the same spirit in your new role.
                </p>
                
                {formData.accomplishments && (
                  <p className="leading-relaxed bg-green-50/50 p-3 rounded-md border-l-2 border-green-300">
                    During your time with us, you have made notable contributions including: {formData.accomplishments}
                  </p>
                )}
                
                <p className="leading-relaxed">
                  For the time you were employed with us, we will provide a summary of your roles and responsibilities, along with your performance record, upon request. This information can be useful for your future employer as a reference.
                </p>
                
                <p className="leading-relaxed">
                  Please ensure that you have completed all the necessary formalities related to the exit process, including the return of company property such as {formData.companyProperty || "ID cards, laptops, mobile phones, and any other items that were issued to you during your employment"}.
                </p>
                
                <p className="leading-relaxed">
                  In case you require any assistance or have any queries regarding your relieving process, please feel free to reach out to the HR department at {formData.contactEmail || formData.contactPerson ? `${formData.contactPerson || "HR Department"} (${formData.contactEmail || "contact information"})` : "[HR Department's Contact Information]"}.
                </p>
                
                <p className="leading-relaxed mr-28">
                  Once again, we appreciate your contributions to {subadmin?.registercompanyname || "[Company Name]"} and wish you the very best in your future endeavors. You will always be a valued member of our alumni network, and we hope to stay connected in the future.
                </p>

                {/* Add extra space to prevent overlap with stamp */}
                <div className="h-28"></div>
              </div>
              
              {/* Closing and Signature Section */}
              <div className="mt-8">
                <p className="mb-0">Best regards,</p>
                <div className="mt-8 flex justify-between items-start">
                  <div>
                    {subadmin && subadmin.signature ? (
                      <div className="border-b border-gray-300 pb-0 w-48">
                        <img 
                          src={`http://localhost:8081/images/profile/${subadmin.signature}`} 
                          alt="Signature" 
                          className="h-16 mb-0 object-contain" 
                          onError={(e) => {
                            console.error('Error loading signature:', e);
                            e.target.src = 'https://via.placeholder.com/150x50?text=Signature';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-b border-gray-300 w-48 h-12"></div>
                    )}
                    <p className="font-bold mt-1 text-black" id="signatory-name">{formData.signatoryName || (subadmin ? `${subadmin.name || ''} ${subadmin.lastname || ''}` : "HR Manager")}</p>
                    <p className="text-gray-600">{formData.signatoryTitle || (subadmin?.designation || "HR Director")}</p>
                  </div>

                  {/* Stamp if available */}
                  {subadmin && subadmin.stampImg && (
  <div className="flex flex-col items-center">
    <img 
      src={`http://localhost:8081/images/profile/${subadmin.stampImg}`} 
      alt="Company Stamp" 
      className="h-28 w-28 object-contain transform scale-100 shadow-md bg-white p-1" 
      style={{ 
        imageRendering: 'high-quality',
        opacity: 0.9
      }}
      onError={(e) => {
        console.error('Error loading stamp:', e);
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = `
          <div class=\"p-4 flex items-center justify-center h-28 w-28 shadow-md bg-white/90\">
            <div class=\"text-center\">
              <p class=\"font-bold text-black\">${subadmin.registercompanyname || "COMPANY"}</p>
              <p class=\"font-bold text-black\">OFFICIAL</p>
            </div>
          </div>
        `;
      }}
    />
    <div className="text-center mt-2">
      <p className="font-bold text-black text-base" style={{letterSpacing: '0.5px'}}>{subadmin.registercompanyname}</p>
    </div>
  </div>
)}

                  {/* Text-based stamp alternative */}
                  {subadmin && !subadmin.stampImg && (
  <div className="flex flex-col items-center">
    <div className="p-4 flex items-center justify-center h-28 w-28 shadow-lg bg-white/90">
      <div className="text-center">
        <p className="font-bold text-blue-600 text-lg">{subadmin.registercompanyname}</p>
        <p className="font-bold text-blue-600">OFFICIAL</p>
      </div>
    </div>
    <div className="text-center mt-2">
      <p className="font-bold text-black text-base" style={{letterSpacing: '0.5px'}}>{subadmin.registercompanyname}</p>
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

export default RelievingLetter;
