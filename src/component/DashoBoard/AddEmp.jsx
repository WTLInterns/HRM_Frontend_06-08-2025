"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "./ConfirmDialog";
import { CiEdit } from "react-icons/ci";
import { MdDeleteOutline, MdOutlineEmail } from "react-icons/md";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaFilter,
} from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { BiFilterAlt } from "react-icons/bi";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

// Utility to get API base URL from env
const API_URL = import.meta.env.VITE_API_URL;

export default function AddEmp() {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  // States for Add/Update Employee fields
  const [firstName, setFname] = useState("");
  const [lastName, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNo, setaadharNo] = useState("");
  const [panCard, setpanCard] = useState("");
  const [education, seteducation] = useState("");
  const [bloodGroup, setbloodGroup] = useState("");
  const [jobRole, setjobRole] = useState("");
  const [gender, setgender] = useState("");
  const [address, setaddress] = useState("");
  const [birthDate, setbirthDate] = useState("");
  const [joiningDate, setjoiningDate] = useState("");
  const [status, setstatus] = useState("");
  const [bankName, setbankName] = useState("");
  const [bankIfscCode, setbankIfscCode] = useState("");
  const [branchName, setbranchName] = useState("");
  const [salary, setsalary] = useState("");
  const [bankAccountNo, setbankAccountNo] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState(""); // <-- New state for password

  // States for navigation and success messages
  // const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  // const [showCancelNavigation, setShowCancelNavigation] = useState(false);

  // File upload states
  const [empImg, setEmpImg] = useState(null);
  const [adharImg, setAdharImg] = useState(null);
  const [panImg, setPanImg] = useState(null);

  // Preview URLs for images
  const [empImgPreview, setEmpImgPreview] = useState("");
  const [adharImgPreview, setAdharImgPreview] = useState("");
  const [panImgPreview, setPanImgPreview] = useState("");

  // Modal states: add modal and update modal
  const [modal, setModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  // Selected employee for update
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;

  // Get subadmin data from localStorage
  const [subadminId, setSubadminId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // State to store subadmin package info
  // const [packageType, setPackageType] = useState(null);
  const [packageCount, setPackageCount] = useState(null);

  // Add this state for confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', empId: null });

  // Add state for send email loading
  const [sendEmailLoading, setSendEmailLoading] = useState(false);

  useEffect(() => {
    // Get the subadmin data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.id) {
      setSubadminId(userData.id);
      console.log("Found user ID in localStorage:", userData.id); 
    } else {
      console.log("No user data found in localStorage or missing ID");
    }
  }, []);

  // Instead, get package info from localStorage user on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    // Remove all setPackageType and packageType usage
    if (userData && userData.packageCount) {
      setPackageCount(userData.packageCount);
    } else {
      setPackageCount(null);
    }
  }, []);

  // Fetch employees when subadminId is available
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!subadminId) {
        console.log("No subadminId available, can't fetch employees");
        return;
      }
      setLoading(true);
      try {
        console.log(`Fetching employees for subadmin ID: ${subadminId}`);
        const response = await axios.get(
          `${API_URL}/api/employee/${subadminId}/employee/all`
        );
        console.log("Fetched employees:", response.data);
        // Fix: Ensure employees is always an array
        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        if (error.response && error.response.status === 404) {
          toast.error(t('employeeManagement.errors.apiNotFound'));
        } else if (error.response && error.response.status === 401) {
          console.log("User not authenticated, skipping error toast");
        } else {
          toast.error(
            t('employeeManagement.errors.failedToFetch') + " " +
              (error.response?.data?.message || error.message)
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [subadminId]);

  // Filter employees based on search term only
  const filteredEmployees = employees.filter((employee) => {
    // Only filter by search term now that we've removed the status and job role filters
    return (
      searchTerm === "" ||
      employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate totalPages based on employees data
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const indexOfLastEmp = currentPage * employeesPerPage;
  const indexOfFirstEmp = indexOfLastEmp - employeesPerPage;

  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmp,
    indexOfLastEmp
  );

  const handleModalToggle = () => {
    setModal(!modal);
  };

  const handleUpdateModalToggle = () => {
    setUpdateModal(!updateModal);
    if (updateModal) {
      // Clear update state when closing the modal
      setSelectedEmployee(null);
      // Show navigation option when canceling (not success message)
      setShowCancelNavigation(true);
    }
  };

  // Validation function for all fields
  // Validation is now unused for both add and update
// const validateFields = () => {
//   return true;

//   // Email validation
//   const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
//   if (!email) {
//     toast.error("Please fill Email ID (e.g., johndoe@email.com)");
//     return false;
//   }
//   if (!emailRegex.test(email)) {
//     toast.error("Please enter a valid Email ID (e.g., johndoe@email.com)");
//     return false;
//   }

//   // Contact number validation (10 digits)
//   const phoneRegex = /^[6-9]\d{9}$/;
//   if (!phone) {
//     toast.error("Please fill Contact No (10 digits, starts with 6-9)");
//     return false;
//   }
//   if (!phoneRegex.test(phone)) {
//     toast.error("Please enter a valid Contact No (10 digits, starts with 6-9)");
//     return false;
//   }

//   // Aadhar number validation (12 digits)
//   const aadharRegex = /^\d{12}$/;
//   if (!aadharNo) {
//     toast.error("Please fill Aadhar No (12 digits)");
//     return false;
//   }
//   if (!aadharRegex.test(aadharNo)) {
//     toast.error("Please enter a valid Aadhar No (12 digits)");
//     return false;
//   }

//   // PAN card validation (ABCDE1234F)
//   const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
//   if (!panCard) {
//     toast.error("Please fill PAN Card (e.g., ABCDE1234F)");
//     return false;
//   }
//   if (!panRegex.test(panCard)) {
//     toast.error("Please enter a valid PAN Card (e.g., ABCDE1234F)");
//     return false;
//   }

//   // Bank account number validation (9-18 digits)
//   const bankAccountRegex = /^\d{9,18}$/;
//   if (!bankAccountNo) {
//     toast.error("Please fill Bank Account No (9-18 digits)");
//     return false;
//   }
//   if (!bankAccountRegex.test(bankAccountNo)) {
//     toast.error("Please enter a valid Bank Account No (9-18 digits)");
//     return false;
//   }

//   // IFSC code validation (4 letters, 7 alphanumeric)
//   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//   if (!bankIfscCode) {
//     toast.error("Please fill IFSC Code (e.g., SBIN0001234)");
//     return false;
//   }
//   if (!ifscRegex.test(bankIfscCode.toUpperCase())) {
//     toast.error("Please enter a valid IFSC Code (e.g., SBIN0001234)");
//     return false;
//   }

//   return true;
// };

  // Reset function to clear all form fields
  const handleReset = (e) => {
    e.preventDefault();
    // Reset text fields
    setFname("");
    setLname("");
    setEmail("");
    setPhone("");
    setaadharNo("");
    setpanCard("");
    seteducation("");
    setbloodGroup("");
    setjobRole("");
    setgender("");
    setaddress("");
    setbirthDate("");
    setjoiningDate("");
    setstatus("");
    setbankName("");
    setbankAccountNo("");
    setbankIfscCode("");
    setbranchName("");
    setsalary("");
    setDepartment("");

    // Reset image states
    setEmpImg(null);
    setAdharImg(null);
    setPanImg(null);

    // Clear image previews
    setEmpImgPreview("");
    setAdharImgPreview("");
    setPanImgPreview("");

    // Clear selected employee
    setSelectedEmployee(null);
  };

  // Add Employee submission
  const handleAddEmp = async (e) => {
    e.preventDefault();
    console.log('handleAddEmp called');

    // Check package limit before adding
    if (packageCount !== null && employees.length >= packageCount) {
      toast.error(t('messages.packageLimitExceeded'), { toastId: 'package-limit' });
      return;
    }

    if (!subadminId) {
      toast.error(t('messages.sessionExpired'));
      return;
    }

    try {
      // Create FormData to send to the backend API (multipart/form-data)
      const formData = new FormData();

      // Add all text fields
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("aadharNo", aadharNo);
      formData.append("panCard", panCard);
      formData.append("education", education);
      formData.append("bloodGroup", bloodGroup);
      formData.append("jobRole", jobRole);
      formData.append("gender", gender);
      formData.append("address", address);
      formData.append("birthDate", birthDate);
      formData.append("joiningDate", joiningDate);
      formData.append("status", status);
      formData.append("bankName", bankName);
      formData.append("bankAccountNo", bankAccountNo);
      formData.append("bankIfscCode", bankIfscCode);
      formData.append("branchName", branchName);
      formData.append("salary", salary);
      formData.append("department", department);
      // Always send password: if not changed, use original; if changed, use new; never omit
      if (password && password.trim() !== "") {
        formData.append("password", password);
      } else if (selectedEmployee && selectedEmployee.password) {
        formData.append("password", selectedEmployee.password);
      } else {
        formData.append("password", "");
      }

      // Add image files if they exist
      if (empImg) {
        formData.append("empimg", empImg);
      }

      if (adharImg) {
        formData.append("adharimg", adharImg);
      }

      if (panImg) {
        formData.append("panimg", panImg);
      }

      console.log("Sending employee data to backend...");
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ': ' + pair[1]);
    }
    // Use the dynamic subadminId from state
    await axios.post(
        `${API_URL}/api/subadmin/add-employee/${subadminId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

    // API response handled above; no need to log response variable.
      toast.success(t('messages.employeeAddedSuccessfully'));
      setModal(false);
      handleReset(e);

      // Refresh the employee list
      const refreshResponse = await axios.get(
        `${API_URL}/api/employee/${subadminId}/employee/all`
      );
      setEmployees(refreshResponse.data);

      // Dispatch event to notify Dashboard of employee updates
      window.dispatchEvent(new Event("employeesUpdated"));
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error(t('employeeManagement.errors.apiNotFound'));
      } else {
        toast.error(
          t('employeeManagement.errors.failedToRegister') + " " +
            (err.response?.data?.message || err.message)
        );
      }
      console.error(err);
    }
  };

  // Handle Update Employee submission
  const handleUpdateEmp = async (e) => {
    e.preventDefault();
    if (!subadminId) {
      toast.error(t('employeeManagement.errors.sessionExpired'));
      return;
    }

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();

      // Add all text fields
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("aadharNo", aadharNo);
      formData.append("panCard", panCard);
      formData.append("education", education);
      formData.append("bloodGroup", bloodGroup);
      formData.append("jobRole", jobRole);
      formData.append("gender", gender);
      formData.append("address", address);
      formData.append("birthDate", birthDate);
      formData.append("joiningDate", joiningDate);
      formData.append("status", status);
      formData.append("bankName", bankName);
      formData.append("bankAccountNo", bankAccountNo);
      formData.append("bankIfscCode", bankIfscCode);
      formData.append("branchName", branchName);
      formData.append("salary", salary);
      formData.append("department", department);
      // Always send password: if not changed, use original; if changed, use new; never omit
      if (password && password.trim() !== "") {
        formData.append("password", password);
      } else if (selectedEmployee && selectedEmployee.password) {
        formData.append("password", selectedEmployee.password);
      } else {
        formData.append("password", "");
      }

      // Add image files if they exist
      if (empImg) {
        formData.append("empimg", empImg);
      }

      if (adharImg) {
        formData.append("adharimg", adharImg);
      }

      if (panImg) {
        formData.append("panimg", panImg);
      }

      console.log("Updating employee data...");

      // Use the employee's full name for the API endpoint (required by backend)
      const fullName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;

      // Log the request details for debugging
      console.log(`Updating employee with full name: ${fullName} for subadmin: ${subadminId}`);
      // Log all form data keys and values for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }

      // Use the correct API endpoint for updating an employee based on the backend code
      const response = await axios.put(
        `${API_URL}/api/employee/update-employee/${subadminId}/${selectedEmployee.empId}`,
      formData,
      {
        headers: {
          
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Update API response:", response);
    toast.success(t('messages.employeeUpdatedSuccessfully'));
    setUpdateModal(false);
    handleReset(e);

    // Refresh the employee list
    const refreshResponse = await axios.get(
      `${API_URL}/api/employee/${subadminId}/employee/all`
    );
    setEmployees(refreshResponse.data);

    // Show success message with back button
    toast.success(t('messages.employeeUpdatedSuccessfully'));

    // Dispatch event to notify Dashboard of employee updates
    window.dispatchEvent(new Event("employeesUpdated"));
  } catch (err) {
    // Log the full backend error response for debugging
    if (err.response) {
      console.error("Error updating employee:", err, err.response.data);
      if (err.response.status === 500) {
        console.error("Backend error:", err.response.data);
      }
    } else {
      console.error("Error updating employee:", err);
    }
    toast.error(
      "Failed to update employee: " +
        (err.response?.data?.message || JSON.stringify(err.response?.data) || err.message)
    );
  }
};

// Delete Employee
// const handleDeleteEmp = async (empId) => {
//   setConfirmDialog({ open: true, type: 'delete', empId });
// };

// Confirmed delete logic
const confirmedDeleteEmp = async (empId) => {
  if (!subadminId) {
    toast.error("Subadmin session expired. Please login again.");
    return;
  }

  try {
    // Get the employee to delete
    const employee = employees.find((e) => e.empId === empId);
    if (!employee) {
      toast.error(t('employeeManagement.errors.employeeNotFound'));
      return;
    }

    console.log(`Deleting employee with ID: ${empId}`);

    // Use the dynamic subadminId from state
    const response = await axios.delete(
      `${API_URL}/api/employee/${subadminId}/delete/${empId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API response:", response);
    toast.success(t('messages.employeeDeletedSuccessfully'));

    // Refresh the employee list
    const refreshResponse = await axios.get(
      `${API_URL}/api/employee/${subadminId}/employee/all`
    );
    setEmployees(refreshResponse.data);

    // Dispatch event to notify Dashboard of employee updates
    window.dispatchEvent(new Event("employeesUpdated"));
    setConfirmDialog({ open: false, type: '', empId: null });
  } catch (err) {
    toast.error(
      "Failed to delete employee: " + (err.response?.data || err.message)
    );
    console.error(err);
    setConfirmDialog({ open: false, type: '', empId: null });
  }
};

// Send login details (email) logic as a single async function
// const handleSendLoginDetails = async (empId) => {
//   setConfirmDialog({ open: true, type: 'email', empId });
// };

// Confirmed send email logic
const confirmedSendLoginDetails = async (empId) => {
  setConfirmDialog({ open: false, type: '', empId: null }); // Close dialog immediately
  setSendEmailLoading(true); // Show loading overlay
  try {
    const employee = employees.find((e) => e.empId === empId);
    if (!employee) {
      toast.error(t('employeeManagement.errors.employeeNotFound'));
      setSendEmailLoading(false);
      return;
    }
    await axios.post(
      `${API_URL}/api/employee/${subadminId}/send-login-details?empId=${empId}`
    );
    toast.success("Login details sent successfully");
  } catch (err) {
    toast.error(
      "Failed to send login details: " + (err.response?.data || err.message)
    );
    console.error(err);
  } finally {
    setSendEmailLoading(false); // Hide loading overlay
  }
};


// When clicking the edit icon, populate update modal with employee info
const handleEditEmp = (employee) => {
  setSelectedEmployee(employee);
  setFname(employee.firstName);
  setLname(employee.lastName);
  setEmail(employee.email);
  setPhone(employee.phone);
  setaadharNo(employee.aadharNo);
  setpanCard(employee.panCard);
  seteducation(employee.education);
  setbloodGroup(employee.bloodGroup);
  setjobRole(employee.jobRole);
  setgender(employee.gender);
  setaddress(employee.address);
  setbirthDate(employee.birthDate);
  setjoiningDate(employee.joiningDate);
  setstatus(employee.status);
  setbankName(employee.bankName);
  setbankAccountNo(employee.bankAccountNo);
  setbankIfscCode(employee.bankIfscCode);
  setbranchName(employee.branchName);
  setsalary(employee.salary);
  setDepartment(employee.department || "");
  setPassword(employee.password || ""); // Set password only once
    seteducation(employee.education);
    setbloodGroup(employee.bloodGroup);
    setjobRole(employee.jobRole);
    setgender(employee.gender);
    setaddress(employee.address);
    setbirthDate(employee.birthDate);
    setjoiningDate(employee.joiningDate);
    setstatus(employee.status);
    setbankName(employee.bankName);
    setbankAccountNo(employee.bankAccountNo);
    setbankIfscCode(employee.bankIfscCode);
    setbranchName(employee.branchName);
    setsalary(employee.salary);
    setDepartment(employee.department || "");

    // Reset image states
    setEmpImg(null);
    setAdharImg(null);
    setPanImg(null);

    // Set image previews from existing employee images if available
    console.log("Employee data for images:", employee);

    // Profile image - using the correct field name from the backend entity (empimg)
    if (employee.empimg) {
      const profileImageUrl = `http://localhost:8282/images/profile/${employee.empimg}`;
      console.log("Setting profile image URL:", profileImageUrl);
      setEmpImgPreview(profileImageUrl);

      // Verify image loading
      const img = new Image();
      img.onload = () => console.log("Profile image loaded successfully");
      img.onerror = () => console.error("Failed to load profile image");
      img.src = profileImageUrl;
    } else {
      setEmpImgPreview("");
    }

    // Aadhar image - using the correct field name from the backend entity (adharimg)
    if (employee.adharimg) {
      const aadharImageUrl = `http://localhost:8282/images/profile/${employee.adharimg}`;
      console.log("Setting aadhar image URL:", aadharImageUrl);
      setAdharImgPreview(aadharImageUrl);

      // Verify image loading
      const img = new Image();
      img.onload = () => console.log("Aadhar image loaded successfully");
      img.onerror = () => console.error("Failed to load aadhar image");
      img.src = aadharImageUrl;
    } else {
      setAdharImgPreview("");
    }

    // PAN image - using the correct field name from the backend entity (panimg)
    if (employee.panimg) {
      const panImageUrl = `http://localhost:8282/images/profile/${employee.panimg}`;
      console.log("Setting PAN image URL:", panImageUrl);
      setPanImgPreview(panImageUrl);

      // Verify image loading
      const img = new Image();
      img.onload = () => console.log("PAN image loaded successfully");
      img.onerror = () => console.error("Failed to load PAN image");
      img.src = panImageUrl;
    } else {
      setPanImgPreview("");
    }

    setUpdateModal(true);
  };

  return (
    <div
      className={`w-full ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-800"
      } p-6 animate-fadeIn`}
    >
      <div className="flex justify-between items-center mb-4">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {t('navigation.employeeManagement')}
        </h1>
        <button
          onClick={() => setModal(!modal)}
          className={`px-4 py-2 rounded-md ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white flex items-center gap-2 transition-colors duration-200`}
        >
          {modal ? t('common.cancel') : t('navigation.addEmployee')}
        </button>
      </div>

      {/* Search */}
      <div
        className={`mb-6 p-4 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } rounded-lg shadow-md border`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('employeeManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500"
              } border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
          </div>
        </div>
      </div>

      {/* Employee Table - Desktop View */}
      <div
        className={`hidden md:block mb-6 overflow-x-auto ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } rounded-lg shadow-md border`}
      >
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div
              className={`animate-spin h-10 w-10 border-4 ${
                isDarkMode ? "border-blue-500" : "border-blue-600"
              } rounded-full border-t-transparent`}
            ></div>
          </div>
        ) : currentEmployees.length === 0 ? (
          <div
            className={`p-4 ${
              isDarkMode
                ? "bg-slate-800 text-gray-300"
                : "bg-white text-gray-600"
            } rounded-lg shadow-md text-center`}
          >
            <p className="mb-2">{t('employeeManagement.noDataAvailable')}</p>
            <p className="text-sm">
              {t('employeeManagement.noDataDescription')}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                className={`${
                  isDarkMode
                    ? "bg-slate-700 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.empId')}</th>
                <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.name')}</th>
                <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.email')}</th>
                {/* <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.phone')}</th> */}
                <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.jobRole')}</th>
                <th className="px-3 py-2 text-left">{t('employeeManagement.tableHeaders.status')}</th>
                <th className="px-3 py-2 text-center">{t('employeeManagement.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((employee) => (
                <tr
                  key={employee.empId}
                  className={`border-t ${
                    isDarkMode
                      ? "border-slate-700 hover:bg-slate-700"
                      : "border-gray-200 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <td className="px-3 py-2">{employee.empId}</td>
                  <td className="px-3 py-2">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-3 py-2">{employee.email}</td>
                  {/* <td className="px-3 py-2">{employee.phone}</td> */}
                  <td className="px-3 py-2">{employee.jobRole}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === "active" ||
                        employee.status === "Active"
                          ? isDarkMode
                            ? "bg-green-800 text-green-200"
                            : "bg-green-100 text-green-800"
                          : isDarkMode
                          ? "bg-red-800 text-red-200"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center space-x-1">
                    <button
                      onClick={() => handleEditEmp(employee)}
                      className={`action-btn p-1.5 rounded-full ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                      title="Edit Employee"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          type: "delete",
                          empId: employee.empId,
                        })
                      }
                      className="action-btn p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
                      title="Delete Employee"
                    >
                      <MdDeleteOutline size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          type: "sendEmail",
                          empId: employee.empId,
                        })
                      }
                      className="action-btn p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow"
                      title="Send Login Email"
                    >
                      <MdOutlineEmail size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee Cards - Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4 mb-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div
              className={`animate-spin h-10 w-10 border-4 ${
                isDarkMode ? "border-blue-500" : "border-blue-600"
              } rounded-full border-t-transparent`}
            ></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div
            className={`p-4 ${
              isDarkMode
                ? "bg-slate-800 text-gray-300"
                : "bg-white text-gray-600"
            } rounded-lg shadow-md text-center`}
          >
            <p className="mb-2">{t('employeeManagement.noDataAvailable')}</p>
            <p className="text-sm">
              {t('employeeManagement.noDataDescription')}
            </p>
          </div>
        ) : (
          filteredEmployees
            .slice(indexOfFirstEmp, indexOfLastEmp)
            .map((employee) => (
              <div
                key={employee.empId}
                className={`${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200"
                } rounded-lg shadow-md border p-4`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3
                      className={`font-semibold text-lg ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {employee.jobRole}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {employee.email}
                    </p>
                    {/* <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{employee.phone}</p> */}
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === "active" ||
                      employee.status === "Active"
                        ? isDarkMode
                          ? "bg-green-800 text-green-200"
                          : "bg-green-100 text-green-800"
                        : isDarkMode
                        ? "bg-red-800 text-red-200"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end space-x-2 text-sm">
                  <button
                    onClick={() => handleEditEmp(employee)}
                    className={`action-btn p-1.5 rounded-full ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                    title="Edit Employee"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        type: "delete",
                        empId: employee.empId,
                      })
                    }
                    className="action-btn p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
                    title="Delete Employee"
                  >
                    <MdDeleteOutline size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        type: "sendEmail",
                        empId: employee.empId,
                      })
                    }
                    className="action-btn p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow"
                    title="Send Login Email"
                  >
                    <MdOutlineEmail size={16} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 my-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${
              isDarkMode
                ? "bg-slate-800 text-gray-300 border-slate-700"
                : "bg-white text-gray-700 border-gray-300"
            } border ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            <FaChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-md ${
                page === currentPage
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                  ? "bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              } border`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${
              isDarkMode
                ? "bg-slate-800 text-gray-300 border-slate-700"
                : "bg-white text-gray-700 border-gray-300"
            } border ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Add Employee Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            &#8203;
            <div
              className={`inline-block align-bottom ${
                isDarkMode
                  ? "bg-slate-800 border-slate-600"
                  : "bg-white border-gray-300"
              } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border`}
            >
              <div
                className={`${
                  isDarkMode ? "bg-slate-800" : "bg-white"
                } px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg leading-6 font-medium ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {t('employee.addNewEmployee')}
                  </h3>
                  <button
                    onClick={handleModalToggle}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleAddEmp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {t('auth.firstName')}:
                      </label>
                      <input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFname(e.target.value)}
                        placeholder={t('auth.enterFirstName')}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="lastName"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Last Name:
                      </label>
                      <input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLname(e.target.value)}
                        placeholder="Enter your last name"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email ID:
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address (e.g., johndoe@email.com)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="contact"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Contact No:
                      </label>
                      <input
                        id="contact"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your 10-digit contact number (starts with 6-9)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="aadharNo"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Aadhar No:
                      </label>
                      <input
                        id="aadharNo"
                        value={aadharNo}
                        onChange={(e) => setaadharNo(e.target.value)}
                        placeholder="Enter your 12-digit Aadhar number"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="panCard"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Pancard No:
                      </label>
                      <input
                        id="panCard"
                        value={panCard}
                        onChange={(e) => setpanCard(e.target.value)}
                        placeholder="e.g., ABCDE1234F"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="education"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Education:
                      </label>
                      <select
                        id="education"
                        value={education}
                        onChange={(e) => seteducation(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select education</option>
                        <option value="hsc">HSC</option>
                        <option value="graduate">Graduate</option>
                        <option value="post-graduate">Post Graduate</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bloodGroup"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Blood Group:
                      </label>
                      <select
                        id="bloodGroup"
                        value={bloodGroup}
                        onChange={(e) => setbloodGroup(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select blood group</option>
                        <option value="a+">A+</option>
                        <option value="b+">B+</option>
                        <option value="o+">O+</option>
                        <option value="ab+">AB+</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="jobRole"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Job Role:
                      </label>
                      <select
                        id="jobRole"
                        value={jobRole}
                        onChange={(e) => setjobRole(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select job role</option>
                        <option value="HR">HR</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="JAVA FULL STACK DEVELOPER">
                          JAVA FULL STACK DEVELOPER
                        </option>
                        <option value="MERN STACK  DEVELOPER">
                          MERN STACK DEVELOPER
                        </option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="DIGITAL MARKETING INTERN">
                          DIGITAL MARKETING INTERN
                        </option>
                        <option value="JAVA FULL STACK">
                          JAVA FULL STACK DEVELOPER
                        </option>
                        <option value="TELECALLER EXCUTIVE">
                          TELECALLER EXECUTIVE
                        </option>
                        <option value="BACK OFFICE">BACK OFFICE</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="gender"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Gender:
                      </label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setgender(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="address"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Address:
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setaddress(e.target.value)}
                        placeholder="Enter your full address"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      ></textarea>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="department"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Department:
                      </label>
                      <select
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select department</option>
                        <option value="Engineering (Development)">
                          Engineering (Development)
                        </option>
                        <option value="Quality Assurance (QA / Test)">
                          Quality Assurance (QA / Test)
                        </option>
                        <option value="DevOps / Release Management">
                          DevOps / Release Management
                        </option>
                        <option value="IT Operations / Infrastructure">
                          IT Operations / Infrastructure
                        </option>
                        <option value="Product Management">
                          Product Management
                        </option>
                        <option value="UI/UX / Design">UI/UX / Design</option>
                        <option value="Information Security">
                          Information Security
                        </option>
                        <option value="Data & Analytics">
                          Data & Analytics
                        </option>
                        <option value="Human Resources (HR)">
                          Human Resources (HR)
                        </option>
                        <option value="Finance & Accounting">
                          Finance & Accounting
                        </option>
                        <option value="Sales & Business Development">
                          Sales & Business Development
                        </option>
                        <option value="Marketing">Marketing</option>
                        <option value="Customer Support / Service Desk">
                          Customer Support / Service Desk
                        </option>
                        <option value="Legal / Compliance">
                          Legal / Compliance
                        </option>
                        <option value="Procurement / Vendor Management">
                          Procurement / Vendor Management
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="birthDate"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Birth Date:
                      </label>
                      <input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setbirthDate(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        aria-label="Select your birth date"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="joiningDate"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Joining Date:
                      </label>
                      <input
                        id="joiningDate"
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setjoiningDate(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        aria-label="Select your joining date"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="status"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Status:
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setstatus(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      >
                        <option value="">Select status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bankName"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Name:
                      </label>
                      <input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setbankName(e.target.value)}
                        placeholder="Enter bank name (alphabets and spaces only)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bankAccountNo"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Account No:
                      </label>
                      <input
                        id="bankAccountNo"
                        value={bankAccountNo}
                        onChange={(e) => setbankAccountNo(e.target.value)}
                        placeholder="Enter your bank account number"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bankIfscCode"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank IFSC Code:
                      </label>
                      <input
                        id="bankIfscCode"
                        value={bankIfscCode}
                        onChange={(e) => setbankIfscCode(e.target.value)}
                        placeholder="Enter IFSC code (e.g., ABCD0EF1234)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="branchName"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Branch Name:
                      </label>
                      <input
                        id="branchName"
                        value={branchName}
                        onChange={(e) => setbranchName(e.target.value)}
                        placeholder="Enter branch name"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="salary"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Current CTC:
                      </label>
                      <input
                        id="salary"
                        value={salary}
                        onChange={(e) => setsalary(e.target.value)}
                        placeholder="Enter salary (numeric value)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                      />
                    </div>
                  </div>

                  {/* Image Upload Fields */}
                  <div className="mt-6 border-t pt-4 ml-6 border-gray-300">
                    <h4
                      className={`text-md font-medium mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Upload Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Employee Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="empImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Employee Photo:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {empImgPreview && (
                            <div className="mb-2 ml-6 relative">
                              <img
                                src={empImgPreview}
                                alt="Employee Preview"
                                className="h-32 w-32 object-cover rounded-md border-2 border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEmpImg(null);
                                  setEmpImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="empImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEmpImg(file);
                                setEmpImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>

                      {/* Aadhar Card Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="adharImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Aadhar Card Image:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {adharImgPreview && (
                            <div className="mb-2 relative">
                              <img
                                src={adharImgPreview}
                                alt="Aadhar Preview"
                                className="h-32 w-48 object-cover rounded-md border-2 border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setAdharImg(null);
                                  setAdharImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="adharImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setAdharImg(file);
                                setAdharImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>

                      {/* PAN Card Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="panImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          PAN Card Image:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {panImgPreview && (
                            <div className="mb-2 relative">
                              <img
                                src={panImgPreview}
                                alt="PAN Preview"
                                className="h-32 w-48 object-cover rounded-md border-2 border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPanImg(null);
                                  setPanImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="panImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setPanImg(file);
                                setPanImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleModalToggle}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2 ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                    >
                      {t('navigation.addEmployee')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Employee Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            &#8203;
            <div
              className={`inline-block align-bottom ${
                isDarkMode
                  ? "bg-slate-800 border-slate-600"
                  : "bg-white border-gray-300"
              } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border`}
            >
              <div
                className={`${
                  isDarkMode ? "bg-slate-800" : "bg-white"
                } px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg leading-6 font-medium ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {t('addEmployee.updateTitle')}
                  </h3>
                  <button
                    onClick={() => setUpdateModal(false)}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleUpdateEmp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstNameUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {t('addEmployee.fields.firstName')}:
                      </label>
                      <input
                        id="firstNameUpd"
                        value={firstName}
                        onChange={(e) => setFname(e.target.value)}
                        placeholder={t('addEmployee.placeholders.firstName')}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="lastNameUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {t('addEmployee.fields.lastName')}:
                      </label>
                      <input
                        id="lastNameUpd"
                        value={lastName}
                        onChange={(e) => setLname(e.target.value)}
                        placeholder={t('addEmployee.placeholders.lastName')}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="emailUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email:
                      </label>
                      <input
                        id="emailUpd"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border`}
                        // required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="contactUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Contact No:
                      </label>
                      <input
                        id="contactUpd"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contact No"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="aadharNoUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Aadhar No:
                      </label>
                      <input
                        id="aadharNoUpd"
                        value={aadharNo}
                        onChange={(e) => setaadharNo(e.target.value)}
                        placeholder="Aadhar No"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="panCardUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Pancard No:
                      </label>
                      <input
                        id="panCardUpd"
                        value={panCard}
                        onChange={(e) => setpanCard(e.target.value)}
                        placeholder="Enter your PAN card (e.g., ABCDE1234F)"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="educationUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Education:
                      </label>
                      <select
                        id="educationUpd"
                        value={education}
                        onChange={(e) => seteducation(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select education</option>
                        <option value="hsc">HSC</option>
                        <option value="graduate">Graduate</option>
                        <option value="post-graduate">Post Graduate</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label

                        htmlFor="bloodGroupUpd"
                        className={`block text-sm font-medium ${
                                                   isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Blood Group:
                      </label>
                      <select
                        id="bloodGroupUpd"
                        value={bloodGroup}
                        onChange={(e) => setbloodGroup(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select blood group</option>
                        <option value="a+">A+</option>
                        <option value="b+">B+</option>
                        <option value="o+">O+</option>
                        <option value="ab+">AB+</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="jobRoleUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Job Role:
                      </label>
                      <select
                        id="jobRoleUpd"
                        value={jobRole}
                        onChange={(e) => setjobRole(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select JobRole</option>
                        <option value="HR">HR</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="MERN STACK DEVELOPER">
                          MERN STACK DEVELOPER
                        </option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="DIGITAL MARKETING INTERN">
                          DIGITAL MARKETING INTERN
                        </option>
                        <option value="JAVA FULL STACK">
                          JAVA FULL STACK DEVELOPER
                        </option>
                        <option value="TELECALLER EXCUTIVE">
                          TELECALLER EXCUTIVE
                        </option>
                        <option value="BACK OFFICE">BACK OFFICE</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="genderUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Gender:
                      </label>
                      <select
                        id="genderUpd"
                        value={gender}
                        onChange={(e) => setgender(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="addressUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Address:
                      </label>
                      <textarea
                        id="addressUpd"
                        value={address}
                        onChange={(e) => setaddress(e.target.value)}
                        placeholder="Address Details"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      ></textarea>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="departmentUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Department:
                      </label>
                      <select
                        id="departmentUpd"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select department</option>
                        <option value="Engineering (Development)">
                          Engineering (Development)
                        </option>
                        <option value="Quality Assurance (QA / Test)">
                          Quality Assurance (QA / Test)
                        </option>
                        <option value="DevOps / Release Management">
                          DevOps / Release Management
                        </option>
                        <option value="IT Operations / Infrastructure">
                          IT Operations / Infrastructure
                        </option>
                        <option value="Product Management">
                          Product Management
                        </option>
                        <option value="UI/UX / Design">UI/UX / Design</option>
                        <option value="Information Security">
                          Information Security
                        </option>
                        <option value="Data & Analytics">
                          Data & Analytics
                        </option>
                        <option value="Human Resources (HR)">
                          Human Resources (HR)
                        </option>
                        <option value="Finance & Accounting">
                          Finance & Accounting
                        </option>
                        <option value="Sales & Business Development">
                          Sales & Business Development
                        </option>
                        <option value="Marketing">Marketing</option>
                        <option value="Customer Support / Service Desk">
                          Customer Support / Service Desk
                        </option>
                        <option value="Legal / Compliance">
                          Legal / Compliance
                        </option>
                        <option value="Procurement / Vendor Management">
                          Procurement / Vendor Management
                        </option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="birthDateUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Birth Date:
                      </label>
                      <input
                        id="birthDateUpd"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setbirthDate(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="joiningDateUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Joining Date:
                      </label>
                      <input
                        id="joiningDateUpd"
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setjoiningDate(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="statusUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Status:
                      </label>
                      <select
                        id="statusUpd"
                        value={status}
                        onChange={(e) => setstatus(e.target.value)}
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        // required
                      >
                        <option value="">Select status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="bankNameUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Name:
                      </label>
                      <input
                        id="bankNameUpd"
                        value={bankName}
                        onChange={(e) => setbankName(e.target.value)}
                        placeholder="Bank Name"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="bankAccountNoUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Account No:
                      </label>
                      <input
                        id="bankAccountNoUpd"
                        value={bankAccountNo}
                        onChange={(e) => setbankAccountNo(e.target.value)}
                        placeholder="Account No"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="bankIfscCodeUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank IFSC Code:
                      </label>
                      <input
                        id="bankIfscCodeUpd"
                        value={bankIfscCode}
                        onChange={(e) => setbankIfscCode(e.target.value)}
                        placeholder="Enter IFSC code (e.g., ABCD0EF1234"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="branchNameUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Branch Name:
                      </label>
                      <input
                        id="branchNameUpd"
                        value={branchName}
                        onChange={(e) => setbranchName(e.target.value)}
                        placeholder="Branch Name"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="salaryUpd"
                        className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Current CTC:
                      </label>
                      <input
                        id="salaryUpd"
                        value={salary}
                        onChange={(e) => setsalary(e.target.value)}
                        placeholder="Salary"
                        className={`block w-full px-4 py-2 ${
                          isDarkMode
                            ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                  {/* Image Upload Fields for Update Form */}
                  <div className="mt-6 border-t pt-4 border-gray-300">
                    <h4
                      className={`text-md font-medium mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Upload Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Employee Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="empImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Employee Photo:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {empImgPreview && (
                            <div className="mb-2 relative">
                              <img
                                src={empImgPreview}
                                alt="Employee Preview"
                                className="h-32 w-32 object-cover rounded-md border-2 border-gray-300 cursor-pointer"
                                onClick={() =>
                                  window.open(empImgPreview, "_blank")
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEmpImg(null);
                                  setEmpImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="empImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEmpImg(file);
                                setEmpImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>

                      {/* Aadhar Card Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="adharImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Aadhar Card Image:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {adharImgPreview && (
                            <div className="mb-2 relative">
                              <img
                                src={adharImgPreview}
                                alt="Aadhar Preview"
                                className="h-32 w-48 object-cover rounded-md border-2 border-gray-300 cursor-pointer"
                                onClick={() =>
                                  window.open(adharImgPreview, "_blank")
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setAdharImg(null);
                                  setAdharImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="adharImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setAdharImg(file);
                                setAdharImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>

                      {/* PAN Card Image Upload */}
                      <div className="space-y-2">
                        <label
                          htmlFor="panImg"
                          className={`block text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          PAN Card Image:
                        </label>
                        <div className="flex flex-col items-center space-y-2">
                          {panImgPreview && (
                            <div className="mb-2 relative">
                              <img
                                src={panImgPreview}
                                alt="PAN Preview"
                                className="h-32 w-48 object-cover rounded-md border-2 border-gray-300 cursor-pointer"
                                onClick={() =>
                                  window.open(panImgPreview, "_blank")
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPanImg(null);
                                  setPanImgPreview("");
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                          <input
                            id="panImg"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setPanImg(file);
                                setPanImgPreview(URL.createObjectURL(file));
                              }
                            }}
                            className={`block w-full text-sm ${
                              isDarkMode
                                ? "text-gray-300 file:bg-slate-700 file:text-white file:border-slate-600"
                                : "text-gray-700 file:bg-gray-100 file:text-gray-700 file:border-gray-300"
                            } file:cursor-pointer file:rounded-md file:px-4 file:py-2 file:mr-4 file:border`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-center space-x-4 mt-6">
                    <button
                      type="submit"
                      className={`px-4 py-2 ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200`}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateModalToggle}
                      className={`px-4 py-2 ${
                        isDarkMode
                          ? "bg-slate-600 hover:bg-slate-700"
                          : "bg-gray-300 hover:bg-gray-400"
                      } ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      } rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors duration-200`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Render ConfirmDialog for delete and email actions */}
      {!sendEmailLoading && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={
            confirmDialog.type === 'delete'
              ? t('employeeManagement.confirmDialog.deleteTitle')
              : confirmDialog.type === 'sendEmail'
              ? t('employeeManagement.confirmDialog.emailTitle')
              : ''
          }
          message={
            confirmDialog.type === 'delete'
              ? t('employeeManagement.confirmDialog.deleteMessage')
              : confirmDialog.type === 'sendEmail'
              ? t('employeeManagement.confirmDialog.emailMessage')
              : ''
          }
          confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Send'}
          cancelText="Cancel"
          onConfirm={() => {
            if (confirmDialog.type === 'delete') {
              confirmedDeleteEmp(confirmDialog.empId);
            } else if (confirmDialog.type === 'sendEmail') {
              confirmedSendLoginDetails(confirmDialog.empId);
            }
          }}
          onCancel={() => setConfirmDialog({ open: false, type: '', empId: null })}
        />
      )}
      {/* Loading overlay for sending email */}
      {sendEmailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-slate-900 text-white px-8 py-6 rounded-lg flex flex-col items-center shadow-2xl border-2 border-blue-400 animate-fadeIn">
            <div className="mb-4">
              <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>
            <div className="text-lg font-semibold mb-1">{t('employeeManagement.loadingOverlay.sendingDetails')}</div>
            <div className="text-sm text-blue-200">{t('employeeManagement.loadingOverlay.pleaseWait')}</div>
          </div>
        </div>
      )}
    </div>
  );
}