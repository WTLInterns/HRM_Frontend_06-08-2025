import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, X, Plus, Search, Eye, Download } from 'lucide-react';
import axios from 'axios';
import { useApp } from "../../../context/AppContext";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import jsQR from 'jsqr';

const CheckInvoice = () => {
  const { isDarkMode } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfInvoice, setSelectedPdfInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPdfInvoiceModal, setShowPdfInvoiceModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pdfInvoiceData, setPdfInvoiceData] = useState({
    customerName: '',
    customerMobile: '',
    employeeId: '',
    totalAmount: '',
    invoicePdf: null,
    uid: '',
    items: [],
    // Company Details
    companyName: '',
    companyMobile: '',
    companyAddress: '',
    companyEmail: '',
    companyGST: '',
    companyLogo: null,
    companyLogoPreview: '',
    companyStamp: null,
    companyStampPreview: '',
    // Employee Details
    employeeName: '',
    employeePhone: '',
    employeeEmail: '',
    employeeDepartment: '',
    // Personal Details
    panCard: '',
    aadharCard: '',
    dateOfBirth: '',
    // Bank Details
    bankName: '',
    bankAccountNumber: '',
    bankHolderName: '',
    ifscCode: '',
    bankBranch: '',
    // Additional Details
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '',
    notes: '',
    // Product/Service Details
    productDescription: '',
    productId: '',
    quantity: '',
    unitPrice: '',
    discount: '',
    taxPercentage: '',
    shippingCharges: '',
    // Terms and Conditions
    termsAndConditions: ''
  });
  const [calculationBreakdown, setCalculationBreakdown] = useState({
    subtotal: '0.00',
    discountAmount: '0.00',
    taxableAmount: '0.00',
    taxAmount: '0.00',
    shippingCharges: '0.00',
    finalTotal: '0.00'
  });

  const [qrStatus, setQrStatus] = useState({ type: '', text: '' });

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    employeeId: '',
    totalAmount: '',
    invoiceDate: new Date().toISOString().split('T')[0]
  });

  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerMobile: '',
    employeeId: '',
    totalAmount: ''
  });

  // Get subadminId and employeeId from user object in localStorage
  const getSubadminId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      console.log('🔐 User data from storage:', user);
      const id = user.id || null;
      console.log('🔑 Extracted subadminId:', id);
      return id;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  };

  // Get employeeId from user object - for employee-specific invoice filtering
  const getEmployeeId = () => {
    try {
      const userFromLocal = localStorage.getItem('user');
      const userFromSession = sessionStorage.getItem('user');
      const userString = userFromLocal || userFromSession || '{}';

      console.log('🔍 Checking storage for employee ID:');
      console.log('  - localStorage user:', userFromLocal);
      console.log('  - sessionStorage user:', userFromSession);

      const user = JSON.parse(userString);
      console.log('👤 Parsed user data:', user);

      // First try to get employee ID directly
      let employeeId = user.empId || user.employeeId || null;
      console.log('🆔 Direct employeeId:', employeeId);

      // If no direct employee ID found, check if user is SUB_ADMIN
      if (!employeeId && user.roll === 'SUB_ADMIN') {
        console.log('🔄 User is SUB_ADMIN, using subadmin ID as employee ID');
        employeeId = user.id; // Use subadmin ID as employee ID
        console.log('🆔 Using subadmin ID as employeeId:', employeeId);
      }

      console.log('🔍 Available keys in user object:', Object.keys(user));
      console.log('🆔 Final extracted employeeId:', employeeId);

      return employeeId;
    } catch (error) {
      console.error('❌ Error parsing employee ID:', error);
      console.error('❌ Error details:', error.message);
      return null;
    }
  };

  const subadminId = getSubadminId();
  const INVOICE_API_URL = 'http://localhost:8081/api/invoices';
  const EMPLOYEE_API_URL = 'http://localhost:8081/api/employee';
  const PRODUCT_API_URL = 'http://localhost:8081/api/products';

  // If no subadminId, show error message
  if (!subadminId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Access Error</h1>
            <p className="text-red-600 mb-4">
              Unable to access Invoice Management. Please log in again or contact your administrator.
            </p>
            <p className="text-sm text-gray-600">
              Required: Subadmin ID not found in user session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Test API connectivity and debug
  useEffect(() => {
    if (subadminId) {
      const employeeId = getEmployeeId();
      console.log('🚀 Component mounted, testing API connectivity...');

      // Test if we can reach the backend
      axios.get('http://localhost:8081/api/invoices/1')
        .then(response => {
          console.log('✅ Backend is accessible');
        })
        .catch(error => {
          console.error('❌ Backend not accessible:', error.message);
          if (error.code === 'ERR_NETWORK') {
            console.error('💡 Make sure the backend server is running on port 8081');
          }
        });

      // Test with the current subadminId and employeeId
      if (employeeId) {
        axios.get(`${INVOICE_API_URL}/${subadminId}/employee/${employeeId}`)
          .then(response => {
            console.log('✅ API endpoint accessible for subadminId:', subadminId, 'employeeId:', employeeId);
          })
          .catch(error => {
            console.error('❌ API endpoint not accessible for subadminId:', subadminId, 'employeeId:', employeeId, error.message);
          });
      } else {
        console.warn('⚠️ No employeeId found for API testing');
      }
    }
  }, [subadminId]);

  // Cleanup QR scanner when modal closes
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        // Clean up any existing scanner instances
        const scannerElement = document.getElementById('qr-reader');
        if (scannerElement && scannerElement.innerHTML) {
          scannerElement.innerHTML = '';
        }
        scannerRef.current = null;
      }
    };
  }, []);

  // Initialize QR scanner when modal opens
  useEffect(() => {
    if (showQRScanner && !isScanning) {
      startCamera();
    }
    return () => {
      if (isScanning) {
        stopCamera();
      }
    };
  }, [showQRScanner]);

  // Load invoices when component mounts or when IDs change
  useEffect(() => {
    if (subadminId) {
      const employeeId = getEmployeeId();
      console.log('🔄 useEffect triggered - subadminId:', subadminId, 'employeeId:', employeeId);

      if (employeeId) {
        console.log('✅ Employee ID found, loading data...');
        fetchInvoices();
        fetchEmployees();
        fetchProducts();
      } else {
        console.warn('⚠️ No employee ID found, cannot load invoices');
        console.warn('💡 This might be because the user is a SUB_ADMIN without an empId field');
      }
    }
  }, [subadminId]);

  // No need to refresh invoice list when employee selection changes
  // since we now show ALL invoices for the subadmin
  // useEffect(() => {
  //   if (subadminId && pdfInvoiceData.employeeId) {
  //     console.log('🔄 Employee selection changed in PDF form, refreshing invoice list...');
  //     fetchInvoices();
  //   }
  // }, [pdfInvoiceData.employeeId]);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning for QR codes
        scanForQRCode();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found. Please check your camera connection.');
      } else {
        toast.error('Camera access failed. You can manually enter the UID instead.');
      }
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const scanInterval = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for QR code detection (simplified approach)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrData = detectQRCode(imageData);

        if (qrData) {
          console.log('✅ QR Code detected:', qrData);
          handleQRScan(qrData);
          clearInterval(scanInterval);
          stopCamera();
          setShowQRScanner(false);
        }
      }
    }, 100);

    // Stop scanning after 30 seconds
    setTimeout(() => {
      clearInterval(scanInterval);
      if (isScanning) {
        toast.info('QR scan timeout. Please try again or enter UID manually.');
        stopCamera();
      }
    }, 30000);
  };

  const detectQRCode = (imageData) => {
    try {
      // Use jsQR to decode the QR code from image data
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode) {
        console.log('✅ QR Code detected with jsQR:', qrCode.data);
        return qrCode.data;
      }

      return null;
    } catch (error) {
      console.error('Error in QR detection with jsQR:', error);
      return null;
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    const employeeId = getEmployeeId();
    console.log('🔍 Fetching invoices for subadminId:', subadminId, 'employeeId:', employeeId);
    console.log('📋 Current PDF form employeeId:', pdfInvoiceData.employeeId);

    try {
      // Use the correct endpoint that returns ALL invoices for the subadmin
      const response = await axios.get(`${INVOICE_API_URL}/${subadminId}`);
      console.log('📡 API Response:', response.data);

      if (response.data.success) {
        const invoices = response.data.invoices || [];
        console.log('✅ Invoices fetched successfully:', invoices.length, 'invoices');
        console.log('📋 Invoice IDs:', invoices.map(inv => ({ id: inv.id, invoiceNumber: inv.invoiceNumber, employeeId: inv.employee?.empId })));
        setInvoices(invoices);
      } else {
        console.warn('⚠️ API returned success=false:', response.data);
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        endpoint: `${INVOICE_API_URL}/${subadminId}`
      });
      setInvoices([]);
      if (error.code !== 'ERR_NETWORK') {
        alert('Failed to fetch invoices: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${EMPLOYEE_API_URL}/${subadminId}/employee/all`);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${PRODUCT_API_URL}/${subadminId}`);
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleRegularEmployeeSelect = async (employeeId) => {
    if (!employeeId) {
      setFormData(prev => ({
        ...prev,
        employeeId: '',
        employeeName: '',
        employeePhone: '',
        employeeEmail: '',
        employeeDepartment: ''
      }));
      return;
    }

    try {
      const response = await axios.get(`${EMPLOYEE_API_URL}/${subadminId}/employee/by-id/${employeeId}`);
      if (response.data) {
        const employee = response.data;
        setFormData(prev => ({
          ...prev,
          employeeId: employee.empId.toString(),
          employeeName: employee.firstName + ' ' + employee.lastName,
          employeePhone: employee.phone?.toString() || '',
          employeeEmail: employee.email || '',
          employeeDepartment: employee.department || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await axios.post(`${INVOICE_API_URL}/${subadminId}/add`, {
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        employeeId: parseInt(formData.employeeId),
        totalAmount: parseFloat(formData.totalAmount),
        invoiceDate: formData.invoiceDate
      });

      if (response.data.success) {
        toast.success('Invoice created successfully!');
        setFormData({
          customerName: '',
          customerMobile: '',
          employeeId: '',
          totalAmount: '',
          invoiceDate: new Date().toISOString().split('T')[0]
        });
        setShowAddModal(false);
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error: Please check if the backend server is running on port 8081');
      } else {
        toast.error('Failed to create invoice: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // PDF Invoice Form Handlers
  const handlePdfInvoiceInputChange = (e) => {
    const { name, value } = e.target;

    // For calculation fields, let the specific handlers manage them
    if (['quantity', 'unitPrice', 'discount', 'taxPercentage', 'shippingCharges'].includes(name)) {
      return; // These are handled by specific onChange handlers above
    }

    setPdfInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  // Enhanced calculation function for real-time updates
  const calculateTotalAmount = (data) => {
    const quantity = parseFloat(data.quantity) || 1;
    const unitPrice = parseFloat(data.unitPrice) || 0;
    const discountPercentage = parseFloat(data.discount) || 0;
    const taxPercentage = parseFloat(data.taxPercentage) || 0;
    const shippingCharges = parseFloat(data.shippingCharges) || 0;

    // Calculate subtotal (quantity * unit price)
    const subtotal = quantity * unitPrice;

    // Calculate discount amount (percentage of subtotal)
    const discountAmount = (subtotal * discountPercentage) / 100;

    // Calculate taxable amount (subtotal - discount)
    const taxableAmount = subtotal - discountAmount;

    // Calculate tax amount (percentage of taxable amount)
    const taxAmount = (taxableAmount * taxPercentage) / 100;

    // Calculate final total (taxable amount + tax + shipping)
    const finalTotal = taxableAmount + taxAmount + shippingCharges;

    // Update the total amount field
    setPdfInvoiceData(prev => ({
      ...prev,
      totalAmount: finalTotal.toFixed(2)
    }));

    // Also update the calculation breakdown for display
    setCalculationBreakdown({
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      shippingCharges: shippingCharges.toFixed(2),
      finalTotal: finalTotal.toFixed(2)
    });
  };

  // Add a product line from current form fields into items table
  const handleAddProductLine = () => {
    const qty = parseFloat(pdfInvoiceData.quantity) || 0;
    const rate = parseFloat(pdfInvoiceData.unitPrice) || 0;
    const disc = parseFloat(pdfInvoiceData.discount) || 0; // %
    const taxPct = parseFloat(pdfInvoiceData.taxPercentage) || 0; // %
    const ship = parseFloat(pdfInvoiceData.shippingCharges) || 0;

    if (!pdfInvoiceData.productDescription || qty <= 0 || rate <= 0) {
      toast.error('Please fill Product Description, Quantity (>0) and Unit Price (>0)');
      return;
    }

    const amount = qty * rate; // before discount
    const discountAmt = (amount * disc) / 100;
    const taxable = amount - discountAmt;
    const taxAmt = (taxable * taxPct) / 100;
    const lineTotal = taxable + taxAmt + ship;

    const newItem = {
      name: pdfInvoiceData.productDescription,
      quantity: qty,
      unitPrice: rate,
      shipping: ship,
      discountPct: disc,
      taxPct: taxPct,
      amount: parseFloat(taxable.toFixed(2)),
      cgst: parseFloat((taxAmt / 2).toFixed(2)),
      sgst: parseFloat((taxAmt / 2).toFixed(2)),
      total: parseFloat(lineTotal.toFixed(2))
    };

    setPdfInvoiceData(prev => {
      const items = [...(prev.items || []), newItem];
      const grand = items.reduce((sum, it) => sum + (it.total || 0), 0);
      return {
        ...prev,
        items,
        totalAmount: grand.toFixed(2), // sync QR amount
        // clear product entry fields for next add
        productId: '',
        productDescription: '',
        quantity: '',
        unitPrice: '',
        discount: '',
        taxPercentage: '',
        shippingCharges: ''
      };
    });

    setCalculationBreakdown(prev => ({ ...prev, finalTotal: '0.00' }));
  };

  const detectBankFromUPI = (upi) => {
    if (!upi || !upi.includes('@')) return { bank: '', suffix: '', valid: false };
    const suffix = upi.split('@')[1].toLowerCase();
    const map = {
      oksbi: 'State Bank of India', sbi: 'State Bank of India',
      okhdfc: 'HDFC Bank', hdfc: 'HDFC Bank',
      okicici: 'ICICI Bank', icici: 'ICICI Bank',
      okaxis: 'Axis Bank', axis: 'Axis Bank',
      okpnb: 'Punjab National Bank', pnb: 'Punjab National Bank',
      okkotak: 'Kotak Mahindra Bank', kotak: 'Kotak Mahindra Bank',
      okboi: 'Bank of India', boi: 'Bank of India',
      okcbi: 'Central Bank of India', cbi: 'Central Bank of India',
      okubi: 'Union Bank of India', ubi: 'Union Bank of India',
      okidfcb: 'IDFC First Bank', idfc: 'IDFC First Bank',
      okfederal: 'Federal Bank', federal: 'Federal Bank',
      oksbm: 'State Bank of Mysore', sbm: 'State Bank of Mysore',
      paytm: 'Paytm Payments Bank', airtel: 'Airtel Payments Bank', jio: 'Jio Payments Bank',
      ybl: 'Yes Bank'
    };
    const bank = map[suffix] || '';
    return { bank, suffix, valid: !!bank };
  };

  // Simple client-side VPA format check
  const isValidVPA = (vpa) => {
    if (!vpa) return false;
    const re = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z][a-zA-Z0-9._-]{1,}$/;
    return re.test(vpa.trim());
  };

  // Verify UPI handle on-demand when user enters VPA manually
  const handleVerifyUPI = async (vpa) => {
    const upi = (vpa || '').trim();
    if (!upi) {
      setQrStatus({ type: 'warn', text: '⚠️ Enter a UPI ID to verify, e.g., name@oksbi' });
      return;
    }

    if (!isValidVPA(upi)) {
      setQrStatus({ type: 'warn', text: '⚠️ UPI format looks invalid. Example: username@oksbi' });
      return;
    }

    const info = detectBankFromUPI(upi);
    if (info.valid) {
      setPdfInvoiceData(prev => ({ ...prev, bankName: prev.bankName || info.bank }));
      setQrStatus({ type: 'success', text: `✅ UPI verified (format): ${info.bank} (${info.suffix})` });
    } else {
      setQrStatus({ type: 'warn', text: '⚠️ UPI suffix not recognized. You can still proceed if it is correct.' });
    }

    // Optional server-side verification (if backend or proxy is available)
    try {
      const verifyUrl = import.meta?.env?.VITE_VPA_VERIFY_URL;
      if (verifyUrl) {
        const res = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vpa: upi })
        });
        if (res.ok) {
          const data = await res.json();
          // Expecting shape: { valid: boolean, bank?: string, name?: string, message?: string }
          if (data.valid) {
            if (data.bank) setPdfInvoiceData(prev => ({ ...prev, bankName: data.bank }));
            setQrStatus({ type: 'success', text: `✅ UPI verified${data.bank ? `: ${data.bank}` : ''}${data.name ? ` • ${data.name}` : ''}` });
          } else {
            setQrStatus({ type: 'warn', text: data.message || '⚠️ Could not verify this UPI. Ensure it accepts payments.' });
          }
        }
      }
    } catch (e) {
      // Do not block UX on verification errors
      console.warn('VPA verification request failed:', e.message);
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfInvoiceData(prev => ({ ...prev, invoicePdf: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      setPdfInvoiceData(prev => ({ ...prev, companyLogo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfInvoiceData(prev => ({ ...prev, companyLogoPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPG, PNG)');
    }
  };

  const handleCompanyStampChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      setPdfInvoiceData(prev => ({ ...prev, companyStamp: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfInvoiceData(prev => ({ ...prev, companyStampPreview: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPG, PNG)');
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setPdfInvoiceData(prev => ({ ...prev, productId }));

    if (productId) {
      const selectedProduct = products.find(product => product.id.toString() === productId);
      if (selectedProduct) {
        const newData = {
          ...pdfInvoiceData,
          productId: productId,
          productDescription: selectedProduct.description || '',
          unitPrice: selectedProduct.price.toString(),
          quantity: '1', // Default quantity
          taxPercentage: pdfInvoiceData.taxPercentage || '18',
        };

        setPdfInvoiceData(newData);
        // Trigger calculation with new data
        calculateTotalAmount(newData);
      }
    } else {
      // Clear product details when no product is selected
      const clearedData = {
        ...pdfInvoiceData,
        productId: '',
        productDescription: '',
        unitPrice: '',
        quantity: '',
        totalAmount: ''
      };
      setPdfInvoiceData(clearedData);
      setCalculationBreakdown({
        subtotal: '0.00',
        discountAmount: '0.00',
        taxableAmount: '0.00',
        taxAmount: '0.00',
        shippingCharges: '0.00',
        finalTotal: '0.00'
      });
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convert a number into words (Indian numbering system)
  const numberToWordsIndian = (value) => {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    if (isNaN(num)) return '';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const twoDigits = (n) => {
      if (n < 20) return ones[n];
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o ? ' ' + ones[o] : '');
    };

    const threeDigits = (n) => {
      const h = Math.floor(n / 100);
      const r = n % 100;
      let str = '';
      if (h) str += ones[h] + ' Hundred';
      if (r) str += (str ? ' ' : '') + twoDigits(r);
      return str || 'Zero';
    };

    const integer = Math.floor(num);
    const crore = Math.floor(integer / 10000000);
    const lakh = Math.floor((integer % 10000000) / 100000);
    const thousand = Math.floor((integer % 100000) / 1000);
    const hundred = integer % 1000;

    let words = '';
    if (crore) words += threeDigits(crore) + ' Crore ';
    if (lakh) words += threeDigits(lakh) + ' Lakh ';
    if (thousand) words += threeDigits(thousand) + ' Thousand ';
    if (hundred) words += threeDigits(hundred);
    words = words.trim();
    if (!words) words = 'Zero';

    // Handle paise if needed
    const paise = Math.round((num - integer) * 100);
    if (paise) {
      const pWords = twoDigits(paise);
      return `${words} Rupees and ${pWords} Paise`;
    }
    return `${words} Rupees`;
  };

  // Generate PDF from form data using jsPDF
  const generatePDFFromForm = async () => {
    const {
      customerName, customerMobile, employeeId, totalAmount, companyName, companyMobile,
      companyAddress, companyEmail, companyGST, employeeName, employeePhone, employeeEmail,
      employeeDepartment, panCard, aadharCard, dateOfBirth, bankName, bankAccountNumber,
      bankHolderName, ifscCode, bankBranch, uid, invoiceDate, dueDate, paymentTerms, notes,
      productDescription, quantity, unitPrice, discount, taxPercentage, shippingCharges,
      termsAndConditions, companyLogo, companyStamp, companyLogoPreview, companyStampPreview
    , items
    } = pdfInvoiceData;

    // Enhanced validation - ensure either items array has products OR single product fields are filled
    const hasItems = items && items.length > 0;
    const hasSingleProduct = productDescription && quantity && unitPrice && parseFloat(quantity) > 0 && parseFloat(unitPrice) > 0;

    if (!hasItems && !hasSingleProduct) {
      alert('Please add products using the "Add Product" button OR fill in Product Description, Quantity (>0), and Unit Price (>0) in the form below.');
      return null;
    }

    let pdfBlob = null;

    try {
      // Create A4 size PDF (210mm x 297mm) with UTF-8 support
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Add metadata for proper character encoding
      const safeEmployeeId = employeeId || 'EMP';
      const invoiceNumber = `INV-${safeEmployeeId}-${Date.now().toString().slice(-4)}`;

      doc.setProperties({
        title: `Invoice ${invoiceNumber}`,
        subject: 'Invoice Document',
        creator: 'HRM System',
        keywords: 'invoice, bill, payment'
      });

      // Page dimensions for A4
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      const purple = [107, 70, 193]; // #6B46C1
      const lightGray = [248, 248, 248];
      const darkGray = [100, 100, 100];

      // Set default font with proper encoding for special characters
      doc.setFont('helvetica');
      doc.setTextColor(0, 0, 0);

      // Enhanced font setup for better Unicode support including rupee symbol
      try {
        // Set font with explicit UTF-8 encoding for special characters
        doc.setFont('helvetica');
        // Force UTF-8 encoding for proper Unicode character rendering
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        // Ensure proper text color and encoding
        doc.setTextColor(0, 0, 0);
      } catch (fontError) {
        console.warn('Font setting warning:', fontError.message);
      }

      let yPosition = margin;
      let grand = 0; // Initialize grand variable for totals calculation

      // Company Logo - Top-right
      if (companyLogoPreview || companyLogo) {
        try {
          const logoSrc = companyLogoPreview || companyLogo;
          // Determine image type from data URL if available
          let imgType = 'PNG';
          if (typeof logoSrc === 'string') {
            if (logoSrc.startsWith('data:image/jpeg') || logoSrc.startsWith('data:image/jpg')) imgType = 'JPEG';
            if (logoSrc.startsWith('data:image/png')) imgType = 'PNG';
          }
          // Place logo at top-right within margins
          const logoW = 30; // mm (wider logo)
          const logoH = 16; // mm (flatter height)
          const logoX = pageWidth - margin - logoW;
          const logoY = 12; // sits above divider and aligned with title area
          doc.addImage(logoSrc, imgType, logoX, logoY, logoW, logoH);
        } catch (err) {
          console.warn('Logo rendering skipped:', err.message);
        }
      }

      // Header: INVOICE title with purple color
      yPosition = 20;
      doc.setTextColor(...purple);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      // Add spacing below title to avoid overlap with meta
      yPosition += 8;

      // Invoice meta: left-aligned stack
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice No #', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceNumber, margin + 25, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Date', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString(), margin + 25, yPosition);
      yPosition += 5;
      if (dueDate) {
        doc.setFont('helvetica', 'bold');
        doc.text('Due Date', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(dueDate, margin + 25, yPosition);
        yPosition += 5;
      }
      // Purple divider moved below meta
      yPosition += 5;
      doc.setDrawColor(...purple);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Billed By / Billed To Section (two equal columns)
      const billedStartY = yPosition;
      const leftColX = margin;
      const rightColX = margin + contentWidth / 2 + 5;
      let leftY = billedStartY;
      let rightY = billedStartY;

      // Left: Billed By
      doc.setTextColor(...purple);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Billed By', leftColX, leftY);
      leftY += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(companyName || 'Company Name', leftColX, leftY);
      leftY += 4;
      if (companyGST) {
        doc.setFont('helvetica', 'bold');
        doc.text('GSTIN', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(companyGST, leftColX + 15, leftY);
        leftY += 4;
      }
      if (companyEmail) {
        doc.setFont('helvetica', 'bold');
        doc.text('Email', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(companyEmail, leftColX + 15, leftY);
        leftY += 4;
      }

      // Right: Billed To
      doc.setTextColor(...purple);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Billed To', rightColX, rightY);
      rightY += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(customerName, rightColX, rightY);
      rightY += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Mobile', rightColX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(customerMobile, rightColX + 15, rightY);
      rightY += 4;
      if (panCard) {
        doc.setFont('helvetica', 'bold');
        doc.text('PAN', rightColX, rightY);
        doc.setFont('helvetica', 'normal');
        doc.text(panCard, rightColX + 15, rightY);
        rightY += 4;
      }

      yPosition = Math.max(leftY, rightY) + 2;
      // Thin divider below Billed section
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 2;

      // Product/Service Details Table
      yPosition += 8;
      doc.setTextColor(...purple);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Product/Service Details & Calculations', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      // If multiple items exist, render professional table; else fallback to single row
      if (items && items.length > 0) {
        // Perfect table configuration - all columns aligned
        const colW = [12, 38, 16, 26, 26, 20, 18, 24]; // Total = 180mm
        const rowH = 10; // Increased row height for better spacing
        const headerH = 10;
        const tableY = yPosition;
        const tableHeight = headerH + (items.length * rowH); // Calculate total table height

        // Draw all vertical lines for all columns with enhanced styling
        doc.setDrawColor(180, 180, 180); // Darker gray for better visibility
        doc.setLineWidth(0.5);
        let verticalX = margin;
        for (let i = 0; i < colW.length; i++) {
          doc.line(verticalX, tableY, verticalX, tableY + headerH + (items.length * rowH));
          verticalX += colW[i];
        }
        doc.line(verticalX, tableY, verticalX, tableY + headerH + (items.length * rowH)); // Right border

        // Draw outer table border with enhanced styling
        doc.setDrawColor(120, 120, 120); // Darker border for outer frame
        doc.setLineWidth(0.8);
        doc.rect(margin, tableY, contentWidth, headerH + (items.length * rowH));

        // Header background
        doc.setFillColor(...purple);
        doc.rect(margin, tableY, contentWidth, headerH, 'F');


        // Header text - perfectly centered with rupee symbols in price columns
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const currencySymbol = 'Rs.'; // Use "Rs." text for headers
        const headers = ['Sr.', 'Product Name', 'Qty', `${currencySymbol} Unit Price`, `${currencySymbol} Shipping`, 'Disc%', 'Tax%', `${currencySymbol} Total`];
        let headerX = margin;
        headers.forEach((h, i) => {
          const centerX = headerX + (colW[i] / 2);
          doc.text(h, centerX, tableY + (headerH / 2) + 2, { align: 'center' });
          headerX += colW[i];
        });

        // Data rows
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        let rowY = tableY + headerH;

        items.forEach((it, idx) => {
          const total = typeof it.total === 'number'
            ? it.total
            : ((it.quantity || 0) * (it.unitPrice || 0)
              - (((it.quantity || 0) * (it.unitPrice || 0)) * (it.discountPct || 0) / 100))
              * (1 + (it.taxPct || 0) / 100)
              + Math.max(0, it.shipping || 0);
          grand += total;

          // Alternating background - Apply to all rows with alternating colors
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250); // Very light gray for even rows
            doc.rect(margin, rowY, contentWidth, rowH, 'F');
          } else {
            doc.setFillColor(...lightGray); // Standard light gray for odd rows
            doc.rect(margin, rowY, contentWidth, rowH, 'F');
          }

          // Row data values (no 'Rs.' prefix in cells)
          const rowData = [
            String(idx + 1),
            it.name || '',
            String(it.quantity || 0),
            Number(it.unitPrice || 0).toFixed(2),
            Math.max(0, Number(it.shipping || 0)).toFixed(2),
            Number(it.discountPct || 0).toFixed(2),
            Number(it.taxPct || 0).toFixed(2),
            Number(total).toFixed(2)
          ];

          // Draw text in each cell - perfectly aligned
          let cellX = margin;
          const textY = rowY + (rowH / 2) + 2;
          rowData.forEach((val, i) => {
            const centerX = cellX + (colW[i] / 2);
            if (i === 0) {
              // Sr. - center
              doc.text(String(val), centerX, textY, { align: 'center' });
            } else if (i === 1) {
              // Product name - center aligned for perfect alignment
              const maxW = colW[i] - 4;
              const lines = doc.splitTextToSize(String(val), maxW);
              const startY = textY - ((lines.length - 1) * 1.75);
              lines.forEach((line, li) => {
                doc.text(line, centerX, startY + (li * 3.5), { align: 'center' });
              });
            } else if (i === 2) {
              // Qty - center
              doc.text(String(val), centerX, textY, { align: 'center' });
            } else {
              // All numbers - center aligned
              doc.text(String(val), centerX, textY, { align: 'center' });
            }
            cellX += colW[i];
          });

          // Row bottom border - draw for all rows including the last one with enhanced styling
          rowY += rowH;
          doc.setDrawColor(180, 180, 180); // Darker gray for better visibility
          doc.setLineWidth(0.4);
          doc.line(margin, rowY, margin + contentWidth, rowY);
        });

        // Draw final bottom border for the table with enhanced styling
        doc.setDrawColor(120, 120, 120); // Darker border for outer frame
        doc.setLineWidth(0.8);
        doc.line(margin, tableY + tableHeight, margin + contentWidth, tableY + tableHeight);

        yPosition = tableY + tableHeight;
        yPosition += 6;

        // Total (in words)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const words = numberToWordsIndian(parseFloat(totalAmount || grand));
        doc.text(`Total (in words): ${words.toUpperCase()}`, margin, yPosition);
        yPosition += 6;

        // Top border above total with enhanced styling
        doc.setDrawColor(120, 120, 120); // Darker border for consistency
        doc.setLineWidth(0.6);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;

        // Totals row with "Rs." text for compatibility
        const totalLabel = 'Total (INR)';
        const totalCurrencySymbol = 'Rs.'; // Use "Rs." text for totals
        const gVal = `${totalCurrencySymbol}${parseFloat(totalAmount || grand).toFixed(2)}`;
        doc.text(totalLabel, margin, yPosition);
        doc.text(gVal, margin + contentWidth, yPosition, { align: 'right' });
        yPosition += 8;

      } else {
        // Fallback table with proper columns like main table
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition - 2, contentWidth, 6, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        // Use same column structure as main table
        const colW = [12, 38, 16, 26, 26, 20, 18, 24]; // Same as main table
        const rowH = 10;
        const headerH = 10;
        const tableY = yPosition;
        const tableHeight = headerH + rowH;

        // Draw all vertical lines for all columns (same as main table) with enhanced styling
        doc.setDrawColor(180, 180, 180); // Darker gray for better visibility
        doc.setLineWidth(0.5);
        let verticalX = margin;
        for (let i = 0; i < colW.length; i++) {
          doc.line(verticalX, tableY, verticalX, tableY + tableHeight);
          verticalX += colW[i];
        }
        doc.line(verticalX, tableY, verticalX, tableY + tableHeight); // Right border

        // Draw outer table border with enhanced styling
        doc.setDrawColor(120, 120, 120); // Darker border for outer frame
        doc.setLineWidth(0.8);
        doc.rect(margin, tableY, contentWidth, tableHeight);

        // Header background
        doc.setFillColor(...purple);
        doc.rect(margin, tableY, contentWidth, headerH, 'F');

        // Header text - same as main table with rupee symbols
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const headerCurrencySymbol = 'Rs.'; // Use "Rs." text for headers
        const headers = ['Sr.', 'Product Name', 'Qty', `${headerCurrencySymbol} Unit Price`, `${headerCurrencySymbol} Shipping`, 'Disc%', 'Tax%', `${headerCurrencySymbol} Total`];
        let headerX = margin;
        headers.forEach((h, i) => {
          const centerX = headerX + (colW[i] / 2);
          doc.text(h, centerX, tableY + (headerH / 2) + 2, { align: 'center' });
          headerX += colW[i];
        });

        // Data row
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const rowY = tableY + headerH;

        // Alternating background - Apply consistent background for single row
        doc.setFillColor(250, 250, 250); // Very light gray background
        doc.rect(margin, rowY, contentWidth, rowH, 'F');

        // Row data - same format as main table with "Rs." text for compatibility
        const dataCurrencySymbol = 'Rs.'; // Use "Rs." text for data
        const rowData = [
          '1',
          productDescription || 'Product/Service',
          String(quantity || 1),
          `${dataCurrencySymbol}${parseFloat(unitPrice || 0).toFixed(2)}`,
          `${dataCurrencySymbol}${Math.max(0, parseFloat(shippingCharges || 0)).toFixed(2)}`,
          String(discount || 0),
          String(taxPercentage || 0),
          `${dataCurrencySymbol}${parseFloat(totalAmount || 0).toFixed(2)}`
        ];

        // Draw text in each cell - same alignment as main table
        let cellX = margin;
        const textY = rowY + (rowH / 2) + 2;

        rowData.forEach((val, i) => {
          const centerX = cellX + (colW[i] / 2);

          if (i === 0) {
            // Sr. - center
            doc.text(String(val), centerX, textY, { align: 'center' });
          } else if (i === 1) {
            // Product name - center aligned
            const maxW = colW[i] - 4;
            const lines = doc.splitTextToSize(String(val), maxW);
            const startY = textY - ((lines.length - 1) * 1.75);
            lines.forEach((line, li) => {
              doc.text(line, centerX, startY + (li * 3.5), { align: 'center' });
            });
          } else if (i === 2) {
            // Qty - center
            doc.text(String(val), centerX, textY, { align: 'center' });
          } else {
            // All numbers - center aligned
            doc.text(String(val), centerX, textY, { align: 'center' });
          }
          cellX += colW[i];
        });

        // Row bottom border with enhanced styling
        doc.setDrawColor(180, 180, 180); // Darker gray for better visibility
        doc.setLineWidth(0.4);
        doc.line(margin, rowY + rowH, margin + contentWidth, rowY + rowH);

        // Final bottom border with enhanced styling
        doc.setDrawColor(120, 120, 120); // Darker border for outer frame
        doc.setLineWidth(0.8);
        doc.line(margin, tableY + tableHeight, margin + contentWidth, tableY + tableHeight);

        yPosition = tableY + tableHeight + 6;

      } // End of else block for single item table

      // Bank Details & UPI Section (two equal columns)
      const bankStartY = yPosition;
      leftY = bankStartY;
      rightY = bankStartY;

      // Left: Bank Details
      doc.setTextColor(...purple);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details', leftColX, leftY);
      leftY += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (bankName) {
        doc.setFont('helvetica', 'bold');
        doc.text('Account Name:', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(bankName, leftColX + 30, leftY);
        leftY += 4;
      }
      if (bankAccountNumber) {
        doc.setFont('helvetica', 'bold');
        doc.text('Account Number:', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(bankAccountNumber, leftColX + 30, leftY);
        leftY += 4;
      }
      if (ifscCode) {
        doc.setFont('helvetica', 'bold');
        doc.text('IFSC:', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(ifscCode, leftColX + 30, leftY);
        leftY += 4;
      }
      if (bankHolderName) {
        doc.setFont('helvetica', 'bold');
        doc.text('Account Holder:', leftColX, leftY);
        doc.setFont('helvetica', 'normal');
        doc.text(bankHolderName, leftColX + 30, leftY);
        leftY += 4;
      }

      // Right: UPI - Scan to Pay
      doc.setTextColor(...purple);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('UPI - Scan to Pay', rightColX, rightY);
      rightY += 6;
      doc.setTextColor(0, 0, 0);

      // Generate QR Code
      const qrData = `upi://pay?pa=${uid || 'merchant@upi'}&pn=${encodeURIComponent(companyName)}&am=${parseFloat(totalAmount || grand || 0).toFixed(2)}&cu=INR&tn=Invoice ${invoiceNumber}`;
      try {
        const QRCode = (await import('qrcode')).default;
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        const qrSize = 40;
        const qrX = rightColX + (contentWidth / 2 - 5 - qrSize) / 2;
        doc.addImage(qrCodeDataURL, 'PNG', qrX, rightY, qrSize, qrSize);
        rightY += qrSize + 3;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        if (uid) {
          doc.text(`UPI ID: ${uid}`, rightColX, rightY, { align: 'left' });
          rightY += 3;
        }
        doc.setFontSize(6);
        doc.setTextColor(...darkGray);
        doc.text('(Maximum of 1 Lakh can be transferred via UPI)', rightColX, rightY);
        doc.setTextColor(0, 0, 0);
        rightY += 4;
      } catch (error) {
        console.error('QR generation error:', error);
        doc.setFontSize(7);
        doc.text('QR Code unavailable', rightColX, rightY);
        rightY += 4;
      }

      yPosition = Math.max(leftY, rightY) + 4;

      // Terms and Conditions (left-aligned)
      if (termsAndConditions && yPosition < 250) {
        yPosition += 6;
        doc.setTextColor(...purple);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms and Conditions', margin, yPosition);
        yPosition += 5;
        doc.setTextColor(...darkGray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const splitTerms = doc.splitTextToSize(termsAndConditions, contentWidth - 10);
        doc.text(splitTerms, margin, yPosition);
        doc.setTextColor(0, 0, 0);
      } else if (yPosition < 250) {
        yPosition += 6;
        doc.setTextColor(...purple);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms and Conditions', margin, yPosition);
        yPosition += 5;
        doc.setTextColor(...darkGray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('*Goods once sold will not be returned.', margin, yPosition);
        yPosition += 3;
        doc.text('*This is a computer-generated invoice.', margin, yPosition);
        doc.setTextColor(0, 0, 0);
      }

      // Company Stamp (if provided) - Bottom right
      if (companyStamp && companyStampPreview && yPosition < 280) {
        try {
          doc.addImage(companyStampPreview, 'JPEG', pageWidth - 50 - margin, pageHeight - 40, 40, 25);
        } catch (error) {
          console.error('Error adding company stamp:', error);
        }
      }

      // Footer
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Generated by HRM System', pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Generate PDF as blob and store it
      pdfBlob = doc.output('blob');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
      return null;
    }

    // Return the generated PDF blob or null if there was an error
    return pdfBlob;
  };

  // Fetch employee details when employee is selected
  const handleEmployeeSelect = async (employeeId) => {
    console.log('👨‍💼 Employee selection started for ID:', employeeId);

    if (!employeeId) {
      // Clear employee details if no employee selected
      setPdfInvoiceData(prev => ({
        ...prev,
        employeeId: '',
        employeeName: '',
        employeePhone: '',
        employeeEmail: '',
        employeeDepartment: ''
      }));
      return;
    }

    try {
      console.log('🔍 Fetching employee details from backend...');
      const response = await axios.get(`${EMPLOYEE_API_URL}/${subadminId}/employee/by-id/${employeeId}`);

      if (response.data) {
        const employee = response.data;
        console.log('✅ Employee details received:', {
          empId: employee.empId,
          fullName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
          phone: employee.phone,
          email: employee.email,
          department: employee.department
        });

        setPdfInvoiceData(prev => ({
          ...prev,
          employeeId: employee.empId.toString(),
          employeeName: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
          employeePhone: employee.phone?.toString() || '',
          employeeEmail: employee.email || '',
          employeeDepartment: employee.department || ''
        }));

        console.log('✅ Employee details set in form successfully');
      } else {
        console.warn('⚠️ No employee data received from backend');
      }
    } catch (error) {
      console.error('❌ Error fetching employee details:', error);
      console.error('❌ This may cause employee ID to not update correctly');

      // Still try to set the basic employee ID even if API fails
      setPdfInvoiceData(prev => ({
        ...prev,
        employeeId: employeeId.toString(),
        employeeName: 'Employee not found',
        employeePhone: '',
        employeeEmail: '',
        employeeDepartment: ''
      }));
    }
  };

  // Submit PDF Invoice to API
  const handlePdfInvoiceSubmit = async (e) => {
    e.preventDefault();

    //   alert('Customer mobile number must be 10 digits');
    //   return;
    // }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('customerName', pdfInvoiceData.customerName);
      formDataToSend.append('customerMobile', pdfInvoiceData.customerMobile);
      formDataToSend.append('totalAmount', parseFloat(pdfInvoiceData.totalAmount) || 0);

      // Add calculation fields that backend expects
      if (pdfInvoiceData.productDescription) formDataToSend.append('productDescription', pdfInvoiceData.productDescription);
      if (pdfInvoiceData.productId) formDataToSend.append('productId', pdfInvoiceData.productId);
      if (pdfInvoiceData.quantity) formDataToSend.append('quantity', parseInt(pdfInvoiceData.quantity) || 1);
      if (pdfInvoiceData.unitPrice) formDataToSend.append('unitPrice', parseFloat(pdfInvoiceData.unitPrice) || 0);
      if (pdfInvoiceData.discount) formDataToSend.append('discount', parseFloat(pdfInvoiceData.discount) || 0);
      if (pdfInvoiceData.taxPercentage) formDataToSend.append('taxPercentage', parseFloat(pdfInvoiceData.taxPercentage) || 0);
      if (pdfInvoiceData.shippingCharges) formDataToSend.append('shippingCharges', parseFloat(pdfInvoiceData.shippingCharges) || 0);

      // Add file fields that backend expects
      if (pdfInvoiceData.companyLogo) formDataToSend.append('companyLogo', pdfInvoiceData.companyLogo);
      if (pdfInvoiceData.companyStamp) formDataToSend.append('companyStamp', pdfInvoiceData.companyStamp);

      // Generate PDF and add to form data
      const pdfBlob = await generatePDFFromForm();
      if (pdfBlob) {
        formDataToSend.append('invoicePdf', pdfBlob, 'invoice.pdf');
      }

      console.log('Form data being sent:', {
        customerName: pdfInvoiceData.customerName,
        customerMobile: pdfInvoiceData.customerMobile,
        employeeId: parseInt(pdfInvoiceData.employeeId),
        totalAmount: parseFloat(pdfInvoiceData.totalAmount) || 0,
        productDescription: pdfInvoiceData.productDescription,
        quantity: parseInt(pdfInvoiceData.quantity) || 1,
        unitPrice: parseFloat(pdfInvoiceData.unitPrice) || 0,
        discount: parseFloat(pdfInvoiceData.discount) || 0,
        taxPercentage: parseFloat(pdfInvoiceData.taxPercentage) || 0,
        shippingCharges: parseFloat(pdfInvoiceData.shippingCharges) || 0
      });

      console.log('📡 Sending PDF creation request to backend...');
      const response = await axios.post(
        `${INVOICE_API_URL}/${parseInt(pdfInvoiceData.employeeId)}/${subadminId}/invoice`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('📡 Backend response received:', response.data);

      if (response.data.success) {
        console.log('✅ PDF invoice created successfully in backend');
        toast.success('Invoice created successfully!');

        // Only clear customer information, keep other data
        setPdfInvoiceData(prev => ({
          ...prev,
          customerName: '',
          customerMobile: '',
          totalAmount: '',
          employeeId: ''
        }));
        setPdfPreview(null);

        // Close the creation modal
        setShowPdfInvoiceModal(false);

        // Refresh invoice list and show PDF preview
        setTimeout(async () => {
          console.log('🔄 Refreshing invoice list after PDF creation...');
          await fetchInvoices();

          // Find the newly created invoice and show its PDF
          setTimeout(() => {
            const newInvoice = response.data.invoice || response.data;
            console.log('🔍 Looking for newly created invoice:', newInvoice);

            if (newInvoice && newInvoice.id) {
              console.log('📄 Opening PDF preview for new invoice:', newInvoice.invoiceNumber);
              setSelectedPdfInvoice(newInvoice);
              setShowPdfModal(true);
            } else {
              // If no invoice data in response, try to find the latest invoice
              if (invoices.length > 0) {
                const latestInvoice = invoices[invoices.length - 1];
                console.log('📄 Opening PDF preview for latest invoice:', latestInvoice.invoiceNumber);
                setSelectedPdfInvoice(latestInvoice);
                setShowPdfModal(true);
              } else {
                console.warn('⚠️ No invoice found to show PDF preview');
                toast.info('Invoice created! Click on PDF icon in invoice list to view.');
              }
            }
          }, 200);
        }, 300);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error: Please check if the backend server is running on port 8081');
      } else {
        toast.error('Failed to create invoice: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (invoice) => {
    console.log('Edit invoice:', invoice);
    console.log('Employee object:', invoice.employee);
    console.log('Employee ID options:', invoice.employee?.empId, invoice.employee?.id);

    setSelectedInvoice(invoice);
    setEditFormData({
      customerName: invoice.customerName,
      customerMobile: invoice.customerMobile,
      employeeId: invoice.employee?.empId || invoice.employee?.id || '',
      totalAmount: invoice.totalAmount
    });
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();

    // Remove mobile number validation
    // if (editFormData.customerMobile && !/^[0-9]{10}$/.test(editFormData.customerMobile)) {
    //   alert('Mobile number must be 10 digits');
    //   return;
    // }

    setLoading(true);
    try {
      const response = await axios.put(
        `${INVOICE_API_URL}/${subadminId}/${selectedInvoice.id}/update`,
        null,
        {
          params: {
            customerName: editFormData.customerName,
            customerMobile: editFormData.customerMobile,
            employeeId: editFormData.employeeId,
            totalAmount: editFormData.totalAmount
          }
        }
      );

      if (response.data.success) {
        alert('Invoice updated successfully!');
        setShowEditModal(false);
        setSelectedInvoice(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      if (error.code === 'ERR_NETWORK') {
        alert('Network error: Please check if the backend server is running on port 8081');
      } else {
        alert('Failed to update invoice: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${INVOICE_API_URL}/${subadminId}/${invoiceToDelete.id}/delete`);

      if (response.data.success) {
        alert('Invoice deleted successfully!');
        setShowDeleteConfirm(false);
        setInvoiceToDelete(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      if (error.code === 'ERR_NETWORK') {
        alert('Network error: Please check if the backend server is running on port 8081');
      } else {
        alert('Failed to delete invoice: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchInvoices();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${INVOICE_API_URL}/${subadminId}/search`, {
        params: { employeeName: searchTerm }
      });

      if (response.data.success) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Error searching invoices:', error);
      alert('Failed to search invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProductLine = (indexToRemove) => {
    setPdfInvoiceData(prev => {
      const updatedItems = prev.items.filter((_, idx) => idx !== indexToRemove);
      const grand = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
      return {
        ...prev,
        items: updatedItems,
        totalAmount: grand.toFixed(2)
      };
    });
    toast.success('Product removed from invoice');
  };

  const getEmployeeName = (employee) => {
    if (!employee) return 'N/A';
    return employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  };

  const handlePdfError = (invoice) => {
    console.error('PDF failed to load for invoice:', invoice.invoiceNumber);
    console.error('This may be due to browser security restrictions (CORS) or PDF generation issues');
    console.error('Invoice data:', invoice);

    // Show a user-friendly notification with multiple fallback options
    toast.info(`PDF preview unavailable for ${invoice.invoiceNumber}. Trying alternatives...`, {
      autoClose: 4000,
      onClose: () => {
        // First try: Open in new tab
        const pdfUrl = `http://localhost:8081/api/invoices/${subadminId}/${invoice.id}/pdf`;
        console.log('🔗 Attempting to open PDF in new tab:', pdfUrl);
        window.open(pdfUrl, '_blank');

        // Second fallback: Show download option
        setTimeout(() => {
          toast.info('💡 PDF opened in new tab. If it doesn\'t load, try downloading directly.', {
            autoClose: 3000
          });
        }, 1000);
      }
    });
  };

  const handleQRScan = (data) => {
    console.log('🚀 QR SCAN STARTED - Raw data received:', data);
    console.log('📋 Current pdfInvoiceData before scan:', pdfInvoiceData);

    if (data && data.trim()) {
      try {
        // Method 1: Try UPI QR Code with standard parameters
        let extractedAmount = null;
        let extractedUPI = null;
        let extractedBank = null;
        let extractedPayeeName = null;

        // Check if it's a UPI QR code
        if (data.includes('upi://pay') || data.includes('pa=')) {
          console.log('🔍 Detected UPI QR Code format');

          // Extract parameters using URLSearchParams for proper parsing
          let params;
          if (data.includes('upi://pay?')) {
            params = new URLSearchParams(data.split('?')[1]);
          } else if (data.includes('pa=')) {
            params = new URLSearchParams(data);
          } else {
            params = new URLSearchParams(data.split('?')[1] || '');
          }

          const pa = params.get('pa'); // UPI ID
          const am = params.get('am'); // Amount
          const pn = params.get('pn'); // Payee name

          console.log('📋 Extracted UPI params:', { pa, am, pn });

          if (pa) extractedUPI = pa;
          if (am) {
            extractedAmount = parseFloat(am.replace(/[^\d.-]/g, ''));
            console.log('✅ Amount from UPI params:', extractedAmount);
          }
          if (pn) {
            extractedPayeeName = pn;
            console.log('✅ Payee name from UPI params:', extractedPayeeName);
          }
        }

        // Method 2: Search for amount patterns in the raw data
        if (!extractedAmount) {
          console.log('🔍 Searching for amount patterns in raw data');

          // More comprehensive amount patterns for different UPI apps (GPay, Paytm, etc.)
          const amountPatterns = [
            // Standard UPI format
            /(\d+\.\d{2})/,  // 123.45
            /(\d{1,3}(?:,\d{3})*\.\d{2})/,  // 1,234.56
            /(\d{1,3}(?:,\d{2,3})*\.\d{2})/,  // 12,34.56 (Indian format)

            // With currency symbols
            /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // ₹ 1,234.56
            /Rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // Rs. 1,234.56
            /INR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // INR 1,234.56

            // URL parameters
            /[?&]am=(\d+(?:\.\d{2})?)/,  // ?am=123.45
            /[?&]amount=(\d+(?:\.\d{2})?)/,  // ?amount=123.45
            /[?&]amt=(\d+(?:\.\d{2})?)/,  // ?amt=123.45 (alternative)

            // Labeled amounts
            /(?:amount|total|sum)[:\s]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
            /(?:amount|total|sum)[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,

            // GPay/PhonePe specific patterns (sometimes embedded in text)
            /(\d+(?:\.\d{2})?)\s*(?:rupees?|rs\.?|inr)/i,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|inr)/i,

            // For cases where amount is after UPI ID
            /@(?:paytm|ybl|oksbi|okhdfc|okicici|okaxis)[^0-9]*(\d+(?:\.\d{2})?)/i,
          ];

          for (const pattern of amountPatterns) {
            const match = data.match(pattern);
            if (match && match[1]) {
              const cleanedAmount = match[1].replace(/[^\d.]/g, '');
              const parsedAmount = parseFloat(cleanedAmount);

              if (!isNaN(parsedAmount) && parsedAmount > 0) {
                extractedAmount = parsedAmount;
                console.log('✅ Found amount pattern:', pattern, 'Value:', extractedAmount);
                break;
              }
            }
          }
        }

        // Method 3: Extract UPI ID for bank detection (including specific format like "9561164142@ybl")
        if (!extractedUPI && data.includes('@')) {
          // Handle specific UPI ID format like "9561164142@ybl"
          if (data.includes('@ybl') || data.includes('@paytm') || data.includes('@oksbi') ||
              data.includes('@okhdfc') || data.includes('@okicici') || data.includes('@okaxis')) {
            extractedUPI = data.trim();
            console.log('✅ Extracted specific UPI ID format:', extractedUPI);

            // For specific UPI IDs like "9561164142@ybl", set a default amount if none found
            if (!extractedAmount) {
              extractedAmount = 500.00; // Default amount for manual entry UPI IDs
              console.log('💰 Set default amount for manual UPI entry:', extractedAmount);
            }
          } else {
            const upiMatch = data.match(/([a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+)/);
            if (upiMatch) {
              extractedUPI = upiMatch[1];
              console.log('✅ Extracted UPI ID:', extractedUPI);
            }
          }
        }

        // Method 3.5: If we have a UPI ID but no amount, set a reasonable default
        if (extractedUPI && !extractedAmount) {
          // Set default amount for any UPI ID without amount
          extractedAmount = 250.00;
          console.log(' Set default amount for UPI ID without amount:', extractedAmount);
        }

        // Method 4: Extract bank information from UPI ID
        if (extractedUPI) {
          const bankPatterns = [
            { pattern: /@oksbi|@sbi/, bank: 'State Bank of India' },
            { pattern: /@okhdfc|@hdfc/, bank: 'HDFC Bank' },
            { pattern: /@okicici|@icici/, bank: 'ICICI Bank' },
            { pattern: /@okaxis|@axis/, bank: 'Axis Bank' },
            { pattern: /@okpnb|@pnb/, bank: 'Punjab National Bank' },
            { pattern: /@okkotak|@kotak/, bank: 'Kotak Mahindra Bank' },
            { pattern: /@okboi|@boi/, bank: 'Bank of India' },
            { pattern: /@okcbi|@cbi/, bank: 'Central Bank of India' },
            { pattern: /@okubi|@ubi/, bank: 'Union Bank of India' },
            { pattern: /@okidfcb|@idfc/, bank: 'IDFC First Bank' },
            { pattern: /@okfederal|@federal/, bank: 'Federal Bank' },
            { pattern: /@oksbm|@sbm/, bank: 'State Bank of Mysore' },
            { pattern: /@paytm/, bank: 'Paytm Payments Bank' },
            { pattern: /@airtel/, bank: 'Airtel Payments Bank' },
            { pattern: /@jio/, bank: 'Jio Payments Bank' },
            { pattern: /@ybl/, bank: 'Yes Bank' }  // Add Yes Bank pattern
          ];

          for (const { pattern, bank } of bankPatterns) {
            if (pattern.test(extractedUPI)) {
              extractedBank = bank;
              console.log('✅ Detected bank:', extractedBank);
              break;
            }
          }
        }

        // Update the form data with extracted information
        const updatedData = {
          ...pdfInvoiceData,
          uid: extractedUPI || data,
          totalAmount: extractedAmount ? extractedAmount.toFixed(2) : (extractedAmount === 0 ? '0.00' : pdfInvoiceData.totalAmount),
          bankName: extractedBank || pdfInvoiceData.bankName,
          bankHolderName: extractedPayeeName || pdfInvoiceData.bankHolderName
        };

        setPdfInvoiceData(updatedData);

        // Show success message
        let successMessage = '✅ QR Code Scanned Successfully!\n\n';
        const details = [];

        if (extractedUPI) details.push(`🔗 UPI ID: ${extractedUPI}`);
        if (extractedPayeeName) details.push(`👤 Payee: ${extractedPayeeName}`);
        if (extractedAmount) {
          const messageCurrencySymbol = 'Rs.'; // Use "Rs." text for message
          const finalSymbol = messageCurrencySymbol;
          details.push(`💰 Amount: ${finalSymbol}${extractedAmount.toFixed(2)}`);
          successMessage += `🎉 Amount extracted and set: ${finalSymbol}${extractedAmount.toFixed(2)}\n\n`;
        } else {
          details.push('⚠️ Amount: Not detected in QR code');
          successMessage += 'ℹ️ Amount not found in QR code. Please enter manually.\n\n';
        }
        if (extractedBank) details.push(`🏦 Bank: ${extractedBank}`);

        if (details.length > 0) {
          successMessage += details.join('\n');
        } else {
          successMessage += 'QR code scanned. Please enter amount manually if needed.';
        }

        // Force state update to ensure form reflects changes
        setTimeout(() => {
          setPdfInvoiceData(prev => ({ ...prev }));
        }, 100);
        // Also reflect status banner
        if (extractedUPI || extractedBank || extractedPayeeName || extractedAmount) {
          const bannerCurrencySymbol = 'Rs.'; // Use "Rs." text for banner
          const finalSymbol = bannerCurrencySymbol;
          const banner = [
            extractedUPI ? `🔗 ${extractedUPI}` : null,
            extractedPayeeName ? `👤 ${extractedPayeeName}` : null,
            extractedBank ? `🏦 ${extractedBank}` : null,
            extractedAmount ? `${finalSymbol}${extractedAmount.toFixed(2)}` : null
          ].filter(Boolean).join(' • ');
          setQrStatus({ type: 'success', text: `✅ QR parsed: ${banner}` });
        }

      } catch (error) {
        console.error('❌ Error processing QR code:', error);

        // Fallback: just set the raw data as UPI ID
        setPdfInvoiceData(prev => ({
          ...prev,
          uid: data,
          totalAmount: prev.totalAmount // Keep existing amount
        }));

        setQrStatus({ type: 'warn', text: '⚠️ QR scanned but amount not found. Please enter manually.' });
        setShowQRScanner(false);
      }
    } else {
      setQrStatus({ type: 'error', text: '⚠️ No QR code data received. Please try again.' });
    }
  };
  const handleViewPdf = (invoice) => {
    if (!invoice) return;
    const path = invoice.invoicePdfPath;
    const fallbackUrl = `http://localhost:8081/api/invoices/${subadminId}/${invoice.id}/pdf`;
    const pdfUrl = path ? (path.startsWith('http') ? path : `http://localhost:8081${path}`) : fallbackUrl;
    window.open(pdfUrl, '_blank');
  };

  const handleDownloadPdf = (invoice) => {
    if (invoice.invoicePdfPath) {
      const pdfUrl = `http://localhost:8081${invoice.invoicePdfPath}`;
      window.open(pdfUrl, '_blank');
    } else {
      alert('No PDF available for this invoice');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-gradient-to-br from-purple-50 to-pink-100 text-gray-800"} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? "text-blue-400" : "text-gray-800"}`}>Invoice Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPdfInvoiceModal(true)}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition shadow-lg ${
                isDarkMode
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white`}
            >
              <Plus className="mr-2" size={20} />
              Create PDF Invoice
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg p-4 mb-6`}>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} size={20} />
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-800 placeholder-gray-500"
                }`}
              />
            </div>
            <button
              onClick={handleSearch}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                isDarkMode
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white`}
            >
              Search
            </button>
            <button
              onClick={fetchInvoices}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                isDarkMode
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg overflow-hidden`}>
          <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-purple-500 to-pink-600"}`}>
            <h2 className="text-2xl font-semibold text-white">Invoices List</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDarkMode ? "border-purple-500" : "border-purple-500"}`}></div>
              <p className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No invoices found. Create your first invoice!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? "bg-slate-700" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Sr No</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Invoice No</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Customer Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Mobile No</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Employee (Sales Person)</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Total Amount</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>PDF</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Action</th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? "bg-slate-800 divide-slate-700" : "bg-white divide-gray-200"} divide-y`}>
                  {invoices.map((invoice, index) => (
                    <tr key={invoice.id} className={`${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"} transition`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{index + 1}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{invoice.invoiceNumber}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>{invoice.customerName}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{invoice.customerMobile}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{getEmployeeName(invoice.employee)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>Rs.{invoice.totalAmount.toFixed(2)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                        {invoice.invoicePdfPath ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewPdf(invoice)}
                              className={`text-blue-600 hover:text-blue-800`}
                              title="View PDF"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(invoice)}
                              className={`text-green-600 hover:text-green-800`}
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>No PDF</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(invoice)}
                          className={`text-blue-600 hover:text-blue-900 mr-4`}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(invoice)}
                          className={`text-red-600 hover:text-red-900`}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-purple-500 to-pink-600"} px-6 py-4 flex justify-between items-center`}>
              <h3 className="text-2xl font-semibold text-white">Add New Invoice</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-blue-50"} p-4 rounded-lg mb-4 border-l-4 ${isDarkMode ? "border-blue-500" : "border-blue-500"}`}>
                <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                  <strong>ℹ️ Note:</strong> Invoice number will be auto-generated (e.g., INV-1-0001)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Customer Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerMobile"
                    value={formData.customerMobile}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Sales Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => {
                      handleInputChange(e);
                      handleRegularEmployeeSelect(e.target.value);
                    }}
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.empId} value={emp.empId}>
                        {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Invoice Date</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                      : "bg-green-500 hover:bg-green-600 disabled:bg-gray-400"
                  } text-white`}
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  } text-white`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-white">Edit Invoice</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Invoice Number: <span className="font-semibold text-purple-600">{selectedInvoice?.invoiceNumber}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={editFormData.customerName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Mobile</label>
                  <input
                    type="text"
                    name="customerMobile"
                    value={editFormData.customerMobile}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sales Employee</label>
                  <select
                    name="employeeId"
                    value={editFormData.employeeId}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.empId} value={emp.empId}>
                        {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                      </option>
                    ))}
                  </select>
                  {selectedInvoice?.employee && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {getEmployeeName(selectedInvoice.employee)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={editFormData.totalAmount}
                    onChange={handleEditInputChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-gray-400"
                >
                  {loading ? 'Updating...' : 'Update Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition disabled:bg-gray-400"
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setInvoiceToDelete(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive PDF Invoice Modal */}
      {showPdfInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-purple-500 to-indigo-600"} px-6 py-4 flex justify-between items-center`}>
              <h3 className="text-2xl font-semibold text-white">Create Comprehensive PDF Invoice</h3>
              <button
                onClick={() => {
                  setShowPdfInvoiceModal(false);
                  setPdfInvoiceData({
                    customerName: '',
                    customerMobile: '',
                    employeeId: '',
                    totalAmount: '',
                    invoicePdf: null,
                    uid: '',
                    // Company Details
                    companyName: '',
                    companyMobile: '',
                    companyAddress: '',
                    companyEmail: '',
                    companyGST: '',
                    // Employee Details
                    employeeName: '',
                    employeePhone: '',
                    employeeEmail: '',
                    employeeDepartment: '',
                    // Personal Details
                    panCard: '',
                    aadharCard: '',
                    dateOfBirth: '',
                    // Bank Details
                    bankName: '',
                    bankAccountNumber: '',
                    bankHolderName: '',
                    ifscCode: '',
                    bankBranch: '',
                    // Additional Details
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    paymentTerms: '',
                    notes: '',
                    // Product/Service Details
                    productDescription: '',
                    quantity: '',
                    unitPrice: '',
                    discount: '',
                    taxPercentage: '',
                    shippingCharges: '',
                    // Terms and Conditions
                    termsAndConditions: ''
                  });
                  setPdfPreview(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePdfInvoiceSubmit} className="p-6 space-y-6">
              {/* Company Information Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-blue-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>🏢 Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={pdfInvoiceData.companyName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, companyName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Mobile
                    </label>
                    <input
                      type="text"
                      name="companyMobile"
                      value={pdfInvoiceData.companyMobile}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, companyMobile: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Address
                    </label>
                    <textarea
                      name="companyAddress"
                      value={pdfInvoiceData.companyAddress}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, companyAddress: e.target.value }))}
                      rows="2"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Email
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      value={pdfInvoiceData.companyEmail}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, companyEmail: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="companyGST"
                      value={pdfInvoiceData.companyGST}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, companyGST: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Logo (JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleCompanyLogoChange}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                    />
                    {pdfInvoiceData.companyLogoPreview && (
                      <div className="mt-2">
                        <img
                          src={pdfInvoiceData.companyLogoPreview}
                          alt="Company Logo Preview"
                          className="max-w-32 max-h-20 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Stamp Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-teal-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-teal-300" : "text-teal-800"}`}>🖊️ Company Stamp</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Company Stamp Image (JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleCompanyStampChange}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                    />
                    {pdfInvoiceData.companyStampPreview && (
                      <div className="mt-2">
                        <img
                          src={pdfInvoiceData.companyStampPreview}
                          alt="Company Stamp Preview"
                          className="max-w-32 max-h-32 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-green-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-green-300" : "text-green-800"}`}>👤 Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={pdfInvoiceData.customerName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Customer Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerMobile"
                      value={pdfInvoiceData.customerMobile}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, customerMobile: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      PAN Card
                    </label>
                    <input
                      type="text"
                      name="panCard"
                      value={pdfInvoiceData.panCard}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, panCard: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Aadhar Card
                    </label>
                    <input
                      type="text"
                      name="aadharCard"
                      value={pdfInvoiceData.aadharCard}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, aadharCard: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={pdfInvoiceData.dateOfBirth}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Employee Information Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-yellow-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-yellow-300" : "text-yellow-800"}`}>👨‍💼 Employee/Sales Person Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Sales Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="employeeId"
                      value={pdfInvoiceData.employeeId}
                      onChange={(e) => {
                        setPdfInvoiceData(prev => ({ ...prev, employeeId: e.target.value }));
                        handleEmployeeSelect(e.target.value);
                      }}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.empId} value={emp.empId}>
                          {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Employee Name
                    </label>
                    <input
                      type="text"
                      name="employeeName"
                      value={pdfInvoiceData.employeeName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, employeeName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Employee Phone
                    </label>
                    <input
                      type="text"
                      name="employeePhone"
                      value={pdfInvoiceData.employeePhone}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, employeePhone: e.target.value }))}
                      pattern="[0-9]{10}"
                      maxLength="10"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Employee Email
                    </label>
                    <input
                      type="email"
                      name="employeeEmail"
                      value={pdfInvoiceData.employeeEmail}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, employeeEmail: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Employee Department
                    </label>
                    <input
                      type="text"
                      name="employeeDepartment"
                      value={pdfInvoiceData.employeeDepartment}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, employeeDepartment: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Product/Service Details Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-purple-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-purple-300" : "text-purple-800"}`}>📦 Product/Service Details</h4>

                {/* Instructions */}
                <div className={`${isDarkMode ? "bg-blue-900" : "bg-blue-50"} p-3 rounded-lg mb-4 border-l-4 ${isDarkMode ? "border-blue-500" : "border-blue-500"}`}>
                  <div className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                    <strong>📋 How to Add Products:</strong>
                    <ol className="mt-2 list-decimal list-inside space-y-1">
                      <li>Select a product from the dropdown below (auto-fills details)</li>
                      <li>OR manually fill Product Description, Quantity, and Unit Price</li>
                      <li>Click "Add Product" button to add to the invoice table</li>
                      <li>Repeat for multiple products if needed</li>
                    </ol>
                    <p className="mt-2 font-semibold">⚠️ You must add at least one product before generating the PDF!</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Select Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productId"
                      value={pdfInvoiceData.productId}
                      onChange={handleProductChange}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                      required={!pdfInvoiceData.items || pdfInvoiceData.items.length === 0}
                    >
                      <option value="">Select a Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.productName} - ₹{product.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Product Description
                    </label>
                    <textarea
                      name="productDescription"
                      value={pdfInvoiceData.productDescription}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, productDescription: e.target.value }))}
                      rows="3"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={pdfInvoiceData.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPdfInvoiceData(prev => ({ ...prev, quantity: value }));
                        if (value !== '' && !isNaN(parseFloat(value))) {
                          calculateTotalAmount({ ...pdfInvoiceData, quantity: value });
                        }
                      }}
                      placeholder="1"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Unit Price
                    </label>
                    <input
                      type="number"
                      name="unitPrice"
                      value={pdfInvoiceData.unitPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPdfInvoiceData(prev => ({ ...prev, unitPrice: value }));
                        if (value !== '' && !isNaN(parseFloat(value))) {
                          calculateTotalAmount({ ...pdfInvoiceData, unitPrice: value });
                        }
                      }}
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Discount
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={pdfInvoiceData.discount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPdfInvoiceData(prev => ({ ...prev, discount: value }));
                        if (value !== '' && !isNaN(parseFloat(value))) {
                          calculateTotalAmount({ ...pdfInvoiceData, discount: value });
                        }
                      }}
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="taxPercentage"
                      value={pdfInvoiceData.taxPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPdfInvoiceData(prev => ({ ...prev, taxPercentage: value }));
                        if (value !== '' && !isNaN(parseFloat(value))) {
                          calculateTotalAmount({ ...pdfInvoiceData, taxPercentage: value });
                        }
                      }}
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Shipping Charges
                    </label>
                    <input
                      type="number"
                      name="shippingCharges"
                      value={pdfInvoiceData.shippingCharges}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPdfInvoiceData(prev => ({ ...prev, shippingCharges: value }));
                        // Trigger calculation when shipping charges change
                        if (value !== '' && !isNaN(parseFloat(value))) {
                          calculateTotalAmount({ ...pdfInvoiceData, shippingCharges: value });
                        }
                      }}
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Total Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>₹</span>
                      <input
                        type="number"
                        name="totalAmount"
                        value={pdfInvoiceData.totalAmount}
                        onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, totalAmount: e.target.value }))}
                        step="0.01"
                        className={`w-full pl-8 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          isDarkMode
                            ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Enter amount or scan QR code"
                      />
                      <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        QR Auto-fill
                      </div>
                    </div>
                    {/* Show QR scanned amount if available */}
                    {pdfInvoiceData.totalAmount && (
                      <div className={`mt-1 text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                        ✅ Amount from QR scan: ₹{pdfInvoiceData.totalAmount}
                      </div>
                    )}

                    {/* Debug info - remove in production */}
                    <div className={`mt-1 text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                      Debug: totalAmount = "{pdfInvoiceData.totalAmount}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions: Add product to items table */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddProductLine}
                  className={`${isDarkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"} text-white px-4 py-2 rounded-md`}
                >
                  + Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setPdfInvoiceData(prev => ({ ...prev, productId: '', productDescription: '', quantity: '', unitPrice: '', discount: '', taxPercentage: '', shippingCharges: '' }))}
                  className={`${isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-500 hover:bg-gray-600"} text-white px-4 py-2 rounded-md`}
                >
                  Clear Fields
                </button>
              </div>

              {/* Invoice Items Table */}
              <div className={`${isDarkMode ? "bg-slate-800" : "bg-white"} mt-4 p-4 rounded-lg border ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h5 className={`${isDarkMode ? "text-gray-200" : "text-gray-800"} font-semibold`}>Invoice Items</h5>
                    {/* Status indicator */}
                    {(pdfInvoiceData.items || []).length > 0 ? (
                      <span className={`${isDarkMode ? "bg-green-600" : "bg-green-500"} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
                        ✅ {pdfInvoiceData.items.length} item{(pdfInvoiceData.items || []).length > 1 ? 's' : ''} added
                      </span>
                    ) : (
                      <span className={`${isDarkMode ? "bg-red-600" : "bg-red-500"} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
                        ⚠️ No items added yet
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProductLine}
                    className={`${isDarkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"} text-white px-3 py-2 rounded-md text-sm`}
                  >
                    + Add Product
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm rounded-lg overflow-hidden">
                    <thead className={`${isDarkMode ? "bg-slate-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                      <tr>
                        <th className="px-3 py-2 text-left">Sr. No.</th>
                        <th className="px-3 py-2 text-left">Product Name</th>
                        <th className="px-3 py-2 text-left">Quantity</th>
                        <th className="px-3 py-2 text-left">Unit Price</th>
                        <th className="px-3 py-2 text-left">Shipping</th>
                        <th className="px-3 py-2 text-left">Discount (%)</th>
                        <th className="px-3 py-2 text-left">Tax (%)</th>
                        <th className="px-3 py-2 text-left">Total Amount</th>
                        <th className="px-3 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? "divide-slate-700" : "divide-gray-200"} divide-y`}>
                      {(pdfInvoiceData.items || []).length === 0 ? (
                        <tr>
                          <td colSpan="9" className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} px-3 py-8 text-center`}>
                            <div className="flex flex-col items-center">
                              <div className="text-4xl mb-2">📦</div>
                              <p className="font-semibold">No products added yet</p>
                              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"} mt-1`}>
                                Add products using the "Add Product" button above
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (pdfInvoiceData.items || []).map((it, idx) => (
                          <tr key={idx} className={`${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"}`}>
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{it.name}</td>
                            <td className="px-3 py-2">{it.quantity}</td>
                            <td className="px-3 py-2">₹{Number(it.unitPrice).toFixed(2)}</td>
                            <td className="px-3 py-2">₹{Number(it.shipping).toFixed(2)}</td>
                            <td className="px-3 py-2">{Number(it.discountPct).toFixed(2)}</td>
                            <td className="px-3 py-2">{Number(it.taxPct).toFixed(2)}</td>
                            <td className="px-3 py-2 font-semibold">₹{Number(it.total || 0).toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => handleRemoveProductLine(idx)} className={`${isDarkMode ? "text-red-300 hover:text-red-400" : "text-red-600 hover:text-red-700"}`}>Remove</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className={`${isDarkMode ? "bg-slate-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                        <td colSpan="7" className="px-3 py-2 text-right font-semibold">Grand Total</td>
                        <td className="px-3 py-2 font-bold">₹{Number(pdfInvoiceData.totalAmount || 0).toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-orange-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-orange-300" : "text-orange-800"}`}>🏦 Banking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={pdfInvoiceData.bankName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="bankHolderName"
                      value={pdfInvoiceData.bankHolderName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankHolderName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={pdfInvoiceData.bankAccountNumber}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={pdfInvoiceData.ifscCode}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, ifscCode: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      UID (Unique ID) <span className="text-blue-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="uid"
                        value={pdfInvoiceData.uid}
                        onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, uid: e.target.value }))}
                        onBlur={() => handleVerifyUPI(pdfInvoiceData.uid)}
                        className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          isDarkMode
                            ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Enter UID for QR payment"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowQRScanner(true)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          isDarkMode
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-blue-500 hover:bg-blue-600"
                        } text-white`}
                        title="Scan QR Code"
                      >
                        📱 Scan
                      </button>
                    </div>
                    {qrStatus.text && (
                      <div className={`mt-1 text-xs ${qrStatus.type === 'success' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-yellow-300' : 'text-yellow-700')}`}>
                        {qrStatus.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-gray-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>📋 Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={pdfInvoiceData.invoiceDate}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={pdfInvoiceData.dueDate}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white"
                          : "border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Payment Terms
                    </label>
                    <textarea
                      name="paymentTerms"
                      value={pdfInvoiceData.paymentTerms}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      rows="2"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={pdfInvoiceData.notes}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                      rows="3"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-red-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-red-300" : "text-red-800"}`}>📜 Terms and Conditions</h4>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Terms and Conditions
                  </label>
                  <textarea
                    name="termsAndConditions"
                    value={pdfInvoiceData.termsAndConditions}
                    onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    rows="4"
                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDarkMode
                        ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                        : "border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Enter terms and conditions for this invoice..."
                  />
                </div>
              </div>

              {/* Bank Details Section */}
              <div className={`${isDarkMode ? "bg-slate-700" : "bg-orange-50"} p-4 rounded-lg`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-orange-300" : "text-orange-800"}`}>🏦 Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={pdfInvoiceData.bankName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Auto-filled from QR scan"
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Auto-detected from scanned UPI ID
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={pdfInvoiceData.bankAccountNumber}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="bankHolderName"
                      value={pdfInvoiceData.bankHolderName}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankHolderName: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={pdfInvoiceData.ifscCode}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, ifscCode: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bank Branch
                    </label>
                    <input
                      type="text"
                      name="bankBranch"
                      value={pdfInvoiceData.bankBranch}
                      onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, bankBranch: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        isDarkMode
                          ? "bg-slate-600 border-slate-500 text-white placeholder-gray-400"
                          : "border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* PDF Preview Section */}
              {pdfPreview && (
                <div className={`${isDarkMode ? "bg-slate-700" : "bg-gray-50"} p-4 rounded-lg`}>
                  <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                    📄 PDF Preview
                  </h4>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                      src={pdfPreview}
                      className="w-full h-96"
                      title="PDF Preview"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const pdfBlob = await generatePDFFromForm();
                          if (pdfBlob) {
                            const url = URL.createObjectURL(pdfBlob);
                            setPdfPreview(url);
                            toast.success('PDF preview updated!');
                          }
                        } catch (error) {
                          toast.error('Error generating preview: ' + error.message);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      🔄 Refresh Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pdfPreview) {
                          const link = document.createElement('a');
                          link.href = pdfPreview;
                          link.download = `invoice_${pdfInvoiceData.customerName}_${Date.now()}.pdf`;
                          link.click();
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      📥 Download Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Preview Button */}
              {!pdfPreview && (
                <div className={`${isDarkMode ? "bg-slate-700" : "bg-amber-50"} p-4 rounded-lg`}>
                  <div className="text-center">
                    <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
                      🎨 Generate PDF Preview
                    </h4>
                    <p className={`mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Click the button below to generate a PDF preview of your invoice.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const pdfBlob = await generatePDFFromForm();
                          if (pdfBlob) {
                            const url = URL.createObjectURL(pdfBlob);
                            setPdfPreview(url);
                            toast.success('PDF preview generated successfully!');
                          }
                        } catch (error) {
                          toast.error('Error generating preview: ' + error.message);
                        }
                      }}
                      className={`px-6 py-3 rounded-lg font-semibold transition ${
                        isDarkMode
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-amber-500 hover:bg-amber-600 text-white"
                      }`}
                    >
                      🚀 Generate Preview
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-6 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-4 rounded-lg font-semibold transition text-white text-lg ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : (pdfInvoiceData.items || []).length > 0
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    'Creating PDF Invoice...'
                  ) : (pdfInvoiceData.items || []).length > 0 ? (
                    '🚀 Create Comprehensive PDF Invoice'
                  ) : (
                    '⚠️ Add Products First'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfInvoiceModal(false);
                    setPdfInvoiceData({
                      customerName: '',
                      customerMobile: '',
                      employeeId: '',
                      totalAmount: '',
                      invoicePdf: null,
                      // Company Details
                      companyName: '',
                      companyMobile: '',
                      companyAddress: '',
                      companyEmail: '',
                      companyGST: '',
                      companyLogo: null,
                      companyLogoPreview: '',
                      companyStamp: null,
                      companyStampPreview: '',
                      // Employee Details
                      employeeName: '',
                      employeePhone: '',
                      employeeEmail: '',
                      employeeDepartment: '',
                      // Personal Details
                      panCard: '',
                      aadharCard: '',
                      dateOfBirth: '',
                      // Bank Details
                      bankName: '',
                      bankAccountNumber: '',
                      bankHolderName: '',
                      ifscCode: '',
                      bankBranch: '',
                      uid: '',
                      // Additional Details
                      invoiceDate: new Date().toISOString().split('T')[0],
                      dueDate: '',
                      paymentTerms: '',
                      notes: '',
                      // Product/Service Details
                      productDescription: '',
                      productId: '',
                      quantity: '',
                      unitPrice: '',
                      discount: '',
                      taxPercentage: '',
                      shippingCharges: '',
                      // Terms and Conditions
                      termsAndConditions: ''
                    });
                    setPdfPreview(null);
                  }}
                  className={`flex-1 py-4 rounded-lg font-semibold transition text-white text-lg ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPdfModal && selectedPdfInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-0">
          <div className={`${isDarkMode ? "bg-slate-800" : "bg-white"} w-full h-full flex flex-col`}>
            <div className={`${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-blue-500 to-purple-600"} px-6 py-3 flex justify-between items-center`}>
              <h3 className="text-xl font-semibold text-white">
                PDF Viewer - {selectedPdfInvoice.invoiceNumber} (Fullscreen)
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    // Direct fallback to new tab
                    window.open(`http://localhost:8081/api/invoices/${subadminId}/${selectedPdfInvoice.id}/pdf`, '_blank');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                  title="Open PDF in new tab"
                >
                  📄 New Tab
                </button>
                <button
                  onClick={() => {
                    setShowPdfModal(false);
                    setSelectedPdfInvoice(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-hidden">
              {selectedPdfInvoice.invoicePdfPath ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-700" : "text-gray-600"}`}>
                      PDF Preview - {selectedPdfInvoice.invoiceNumber}
                    </span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDownloadPdf(selectedPdfInvoice)}
                        className={`flex items-center px-3 py-2 rounded-lg font-semibold transition ${
                          isDarkMode
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        <Download className="mr-2" size={16} />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          // Direct fallback to new tab
                          window.open(`http://localhost:8081/api/invoices/${subadminId}/${selectedPdfInvoice.id}/pdf`, '_blank');
                        }}
                        className={`px-3 py-2 rounded-lg font-semibold transition ${
                          isDarkMode
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-purple-500 hover:bg-purple-600 text-white"
                        }`}
                        title="Open PDF in new tab"
                      >
                        📄 New Tab
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="w-full h-full max-w-none">
                      <iframe
                        src={`http://localhost:8081/api/invoices/${subadminId}/${selectedPdfInvoice.id}/pdf`}
                        className="w-full h-full"
                        title={`Invoice ${selectedPdfInvoice.invoiceNumber}`}
                        onError={(e) => {
                          console.error('PDF iframe failed to load:', e);
                          console.error('PDF path:', selectedPdfInvoice.invoicePdfPath);
                          handlePdfError(selectedPdfInvoice);
                        }}
                        onLoad={() => {
                          console.log('PDF iframe loaded successfully for invoice:', selectedPdfInvoice.invoiceNumber);
                        }}
                        style={{
                          border: 'none',
                          background: 'white'
                        }}
                        allow="fullscreen"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 border-t text-center">
                    <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      💡 Tip: Use Ctrl+Scroll to zoom in/out | Click "New Tab" if preview doesn't work
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-xl mb-2 font-semibold">PDF Not Available</p>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
                      The PDF file path is not available for this invoice
                    </p>
                    <button
                      onClick={() => {
                        setShowPdfModal(false);
                        setSelectedPdfInvoice(null);
                      }}
                      className={`mt-4 px-6 py-2 rounded-lg font-semibold transition ${
                        isDarkMode
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                📱 Scan QR Code for UID
              </h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className={`text-gray-500 hover:text-gray-700 ${isDarkMode ? "text-gray-400 hover:text-gray-300" : ""}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <div className={`p-4 border-2 border-dashed ${isDarkMode ? "border-gray-600" : "border-gray-300"} rounded-lg`}>
                {isScanning ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full max-w-sm mx-auto rounded-lg"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className={`text-center mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      📷 Scanning for QR code...
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 border-2 border-dashed ${isDarkMode ? "border-gray-600" : "border-gray-300"} rounded-lg text-center`}>
                    <div className="text-4xl mb-4">📱</div>
                    <p className={`mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      QR Code Scanner
                    </p>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Click "Start Camera" to begin scanning QR codes.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-4">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  Stop Camera
                </button>
              )}

              {/* Test QR Code Button for demonstration */}
              <button
                type="button"
                onClick={() => {
                  // Simulate scanning a test QR code with amount
                  const testQRData = "upi://pay?pa=test@oksbi&pn=Test%20Merchant&am=6261.26&cu=INR&tn=Test%20Payment";
                  handleQRScan(testQRData);
                  setShowQRScanner(false);
                }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                title="Test QR scan with sample data (6261.26)"
              >
                🧪 Test QR Scan
              </button>

              {/* Additional test for GPay-like QR codes */}
              <button
                type="button"
                onClick={() => {
                  // Simulate scanning a GPay-like QR code with amount
                  const gpayQRData = "upi://pay?pa=merchant@ybl&pn=GPay%20Merchant&am=999.50&cu=INR";
                  handleQRScan(gpayQRData);
                  setShowQRScanner(false);
                }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
                title="Test GPay-like QR scan (999.50)"
              >
                📱 GPay Test
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Or manually enter UID here..."
                value={pdfInvoiceData.uid}
                onChange={(e) => setPdfInvoiceData(prev => ({ ...prev, uid: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
              {/* Show current UID value for debugging */}
              <div className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Current UID: {pdfInvoiceData.uid || 'None'}
              </div>
            </div>

            <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              <p className="mb-2">📷 Camera-based QR Code Scanner</p>
              <p className="mb-2"><strong>How to use:</strong></p>
              <ol className="mb-2 list-decimal list-inside space-y-1">
                <li>Click "Start Camera" to access your camera</li>
                <li>Point camera at QR code containing UPI payment details</li>
                <li>System will automatically detect and extract payment info</li>
                <li>Use "🧪 Test QR Scan" to test with sample data</li>
              </ol>
              <p className="mb-2"><strong>Auto-fills:</strong> UPI ID, Amount, Company Name, Bank Name & more</p>
              <p className="mb-2"><strong>💰 Amount Auto-Population:</strong> The total amount field will be automatically filled when QR is scanned!</p>
              <p>You can also manually enter the UID in the form if scanning doesn't work.</p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowQRScanner(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckInvoice;