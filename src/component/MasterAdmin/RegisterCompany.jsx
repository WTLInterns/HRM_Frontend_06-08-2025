import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  FaUser, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaFileSignature, 
  FaStamp, 
  FaCheck, 
  FaTimes, 
  FaArrowLeft,
  FaUpload,
  FaLock
} from "react-icons/fa";
import "../DashoBoard/animations.css";

const RegisterCompany = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = new URLSearchParams(location.search).get("mode") === "edit";

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  const initialFormState = {
    id: Date.now(),
    name: "",
    lastName: "",
    registerCompanyName: "",
    email: "",
    phoneno: "",
    address: "",
    logo: null,
    signature: null,
    stampImage: null,
    hasSignature: false,
    hasStamp: false,
    status: "Active",
    gstno: "",
    cinNo: "",
    companyUrl: "",
    packageType: "10",
    customCount: "",
    emailServerPassword: "", // Added new field
    deviceSerialNumber: "", // Device serial number for biometric mapping
  };

  const [formData, setFormData] = useState(initialFormState);

  const normalizePackageType = (pkgType) => {
    if (!pkgType) return "10";
    if (typeof pkgType === "number") pkgType = String(pkgType);
    if (typeof pkgType === "string") {
      const lower = pkgType.toLowerCase();
      if (lower.includes("custom")) return "custom";
      if (lower.includes("10")) return "10";
      if (lower.includes("15")) return "15";
      if (lower.includes("30")) return "30";
      if (lower.includes("40")) return "40";
    }
    return "10";
  };

  const normalizeStatus = (status) => {
    if (!status) return "Active";
    if (typeof status === "string") {
      if (status.toLowerCase() === "active") return "Active";
      if (status.toLowerCase() === "inactive") return "Inactive";
    }
    return "Active";
  };

  useEffect(() => {
    if (isEditMode) {
      const companyToEdit = JSON.parse(localStorage.getItem("companyToEdit") || "null");
      if (companyToEdit) {
        const mappedData = {
          id: companyToEdit.id,
          name: companyToEdit.name,
          lastName: companyToEdit.lastname,
          registerCompanyName: companyToEdit.registercompanyname,
          email: companyToEdit.email,
          phoneno: companyToEdit.phoneno,
          address: companyToEdit.address || "",
          gstno: companyToEdit.gstno,
          cinNo: companyToEdit.cinNo || companyToEdit.cinno || "",
          companyUrl: companyToEdit.companyUrl || companyToEdit.companyurl || "",
          status: normalizeStatus(companyToEdit.status),
          logo: companyToEdit.logo || companyToEdit.companylogo,
          signature: companyToEdit.signature,
          stampImage: companyToEdit.stampImg,
          hasSignature: !!companyToEdit.signature,
          hasStamp: !!companyToEdit.stampImg,
          packageType: normalizePackageType(companyToEdit.packageType),
          customCount: normalizePackageType(companyToEdit.packageType) === "custom" ? (companyToEdit.packageCount || "") : "",
          emailServerPassword: companyToEdit.emailServerPassword || "", // Added new field
          deviceSerialNumber: companyToEdit.deviceSerialNumber || "", // Device serial number
        };
        console.log("Loading company data for edit:", mappedData);
        setFormData(mappedData);
        if (mappedData.logo && typeof mappedData.logo === "string") setLogoPreview(mappedData.logo);
        if (mappedData.signature && typeof mappedData.signature === "string") setSignaturePreview(mappedData.signature);
        if (mappedData.stampImage && typeof mappedData.stampImage === "string") setStampPreview(mappedData.stampImage);
      }
    }
  }, [isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "packageType" && value !== "custom" ? { customCount: "" } : {}),
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      console.log(`Selected ${fileType} file:`, file.name);
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        [fileType]: file,
      });
      if (fileType === "logo") setLogoPreview(previewUrl);
      else if (fileType === "signature") {
        setSignaturePreview(previewUrl);
        setFormData((prev) => ({ ...prev, hasSignature: true }));
      } else if (fileType === "stampImage") {
        setStampPreview(previewUrl);
        setFormData((prev) => ({ ...prev, hasStamp: true }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !formData.logo) {
      alert("Please upload a company logo");
      return;
    }

    try {
      if (isEditMode) {
        const apiUrl = `http://localhost:8081/api/subadmin/update-fields/${formData.id}`;
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("lastname", formData.lastName);
        formDataToSend.append("registercompanyname", formData.registerCompanyName);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phoneno", formData.phoneno);
        formDataToSend.append("status", normalizeStatus(formData.status));
        formDataToSend.append("gstno", formData.gstno);
        formDataToSend.append("cinno", formData.cinNo);
        formDataToSend.append("companyurl", formData.companyUrl);
        formDataToSend.append("address", formData.address || "");
        formDataToSend.append("emailServerPassword", formData.emailServerPassword); // Added new field
        formDataToSend.append("deviceSerialNumber", formData.deviceSerialNumber || ""); // Device serial number
        if (formData.logo) formDataToSend.append("companylogo", formData.logo);
        if (formData.signature) formDataToSend.append("signature", formData.signature);
        if (formData.stampImage) formDataToSend.append("stampImg", formData.stampImage);
        let pkgType = normalizePackageType(formData.packageType);
        formDataToSend.append("packageType", pkgType);
        if (pkgType === "custom") formDataToSend.append("customCount", formData.customCount);

        const response = await fetch(apiUrl, {
          method: "PUT",
          body: formDataToSend,
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error updating company:", errorText);
          throw new Error(`Failed to update company: ${errorText}`);
        }
        const updatedCompany = await response.json();
        console.log("Company updated successfully:", updatedCompany);
        localStorage.removeItem("companyToEdit");
        setSuccessMessage("Company updated successfully!");

        const refreshedResponse = await fetch(`http://localhost:8081/api/subadmin/${formData.id}`);
        if (refreshedResponse.ok) {
          const refreshedData = await refreshedResponse.json();
          setFormData((prev) => ({ ...prev, status: normalizeStatus(refreshedData.status) }));
        }

        // Dispatch event to notify other components
        window.dispatchEvent(new Event("userStatusUpdated"));
      } else {
        const apiUrl = `http://localhost:8081/masteradmin/addSubAdmin/1`;
        const formDataToSend = new FormData();
        formDataToSend.append("id", formData.id);
        formDataToSend.append("name", formData.name);
        formDataToSend.append("lastname", formData.lastName);
        formDataToSend.append("registercompanyname", formData.registerCompanyName);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phoneno", formData.phoneno);
        formDataToSend.append("password", formData.phoneno);
        formDataToSend.append("gstno", formData.gstno);
        formDataToSend.append("cinno", formData.cinNo);
        formDataToSend.append("companyurl", formData.companyUrl);
        formDataToSend.append("address", formData.address);
        formDataToSend.append("status", formData.status);
        formDataToSend.append("packageType", normalizePackageType(formData.packageType));
        if (normalizePackageType(formData.packageType) === "custom") {
          formDataToSend.append("customCount", formData.customCount);
        }
        if (formData.logo) formDataToSend.append("companylogo", formData.logo);
        if (formData.signature) formDataToSend.append("signature", formData.signature);
        if (formData.stampImage) formDataToSend.append("stampImg", formData.stampImage);
        formDataToSend.append("emailServerPassword", formData.emailServerPassword); // Added new field
        formDataToSend.append("deviceSerialNumber", formData.deviceSerialNumber || ""); // Device serial number

        const response = await fetch(apiUrl, {
          method: "POST",
          body: formDataToSend,
        });
        if (!response.ok) throw new Error("Failed to register company");
        try {
          await fetch(`http://localhost:8081/api/subadmin/send-email/${formData.email}`, { method: "POST" });
        } catch (emailErr) {
          console.error("Failed to send registration email:", emailErr);
        }
        setSuccessMessage("Company registered successfully! Please send Login Details through this email - " + formData.email);
      }

      setShowSuccessPopup(true);
      window.dispatchEvent(new Event("companiesUpdated"));
      if (!isEditMode) {
        setFormData(initialFormState);
        setLogoPreview(null);
        setSignaturePreview(null);
        setStampPreview(null);
      }
      setTimeout(() => {
        setShowSuccessPopup(false);
        if (isEditMode) navigate("/masteradmin/view-company");
      }, 5000);
    } catch (error) {
      console.error("Error saving company data:", error);
      alert("Failed to save company data. Please try again.");
    }
  };

  const handleClear = () => {
    if (isEditMode) {
      const companyToEdit = JSON.parse(localStorage.getItem("companyToEdit") || "null");
      if (companyToEdit) setFormData(companyToEdit);
    } else {
      setFormData(initialFormState);
      setLogoPreview(null);
      setSignaturePreview(null);
      setStampPreview(null);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      localStorage.removeItem("companyToEdit");
      navigate("/masteradmin/view-company");
    } else {
      setFormData(initialFormState);
      setLogoPreview(null);
      setSignaturePreview(null);
      setStampPreview(null);
    }
  };

  return (
    <div className="p-2 md:p-4 lg:p-6 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 animate-fadeIn text-gray-100 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="p-3 bg-blue-900/50 rounded-full text-blue-400 self-start md:self-auto">
          <FaBuilding className="text-xl md:text-2xl" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">{isEditMode ? "Update Company" : "Register Company"}</h2>
        {isEditMode && (
          <button
            onClick={handleCancel}
            className="ml-auto flex items-center gap-1 text-sm bg-slate-700 hover:bg-slate-600 text-gray-100 px-3 py-1.5 rounded-md transition-all duration-300 shadow-sm"
          >
            <FaArrowLeft size={14} />
            <span>Back</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Contact Person</h3>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                First Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="John"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Company Details</h3>
            <div className="space-y-2">
              <label htmlFor="registerCompanyName" className="block text-sm font-medium">
                Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="registerCompanyName"
                  name="registerCompanyName"
                  value={formData.registerCompanyName}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="ABC Corporation"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="gstno" className="block text-sm font-medium">
                GST Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="gstno"
                  name="gstno"
                  value={formData.gstno}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="22AAAAA0000A1Z5"
 comportamiento />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="cinNo" className="block text-sm font-medium">
                CIN Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFileSignature className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="cinNo"
                  name="cinNo"
                  value={formData.cinNo}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="L12345AB6789CDE012345"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="companyUrl" className="block text-sm font-medium">
                Company URL
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-blue-400" />
                </div>
                <input
                  type="url"
                  id="companyUrl"
                  name="companyUrl"
                  value={formData.companyUrl}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="packageType" className="block text-sm font-medium">
                Package Type <span className="text-red-400">*</span>
              </label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                required
                className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
              >
                <option value="10">10 Employees</option>
                <option value="15">15 Employees</option>
                <option value="30">30 Employees</option>
                <option value="40">40 Employees</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {formData.packageType === "custom" && (
              <div className="space-y-2">
                <label htmlFor="customCount" className="block text-sm font-medium">
                  Enter Package Count <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="customCount"
                  name="customCount"
                  min={1}
                  value={formData.customCount}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                  placeholder="Enter employee count"
                />
              </div>
            )}
          </div>
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Contact Information</h3>
            <div className="space-y-2">
              <label htmlFor="phoneno" className="block text-sm font-medium">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-blue-400" />
                </div>
                <input
                  type="tel"
                  id="phoneno"
                  name="phoneno"
                  value={formData.phoneno}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="123-456-7890"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-blue-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="company@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium">
                Address <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                  <FaMapMarkerAlt className="text-blue-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="2"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="123 Business St, City, Country"
                ></textarea>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="emailServerPassword" className="block text-sm font-medium">
                Email Server Password <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-blue-400" />
                </div>
                <input
                  type="password"
                  id="emailServerPassword"
                  name="emailServerPassword"
                  value={formData.emailServerPassword}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="Enter email server password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="deviceSerialNumber" className="block text-sm font-medium">
                Device Serial Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="deviceSerialNumber"
                  name="deviceSerialNumber"
                  value={formData.deviceSerialNumber}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="Enter biometric device serial number"
                />
              </div>
            </div>
          </div>
        </div>
        {!isEditMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Logo <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                  {logoPreview ? (
                    <>
                      <div className="w-full h-full flex justify-center items-center">
                        <img
                          src={typeof formData.logo === "string" ? `http://localhost:8081/images/profile/${formData.logo}` : logoPreview}
                          alt="Company Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        tabIndex={-1}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLogoPreview(null);
                          setFormData({ ...formData, logo: null });
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md z-10"
                        style={{ pointerEvents: "auto" }}
                      >
                        <FaTimes size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <FaUpload className="text-blue-500 text-xl mb-2" />
                      <p className="text-xs text-gray-400 text-center">Click to upload logo</p>
                    </>
                  )}
                  {!logoPreview && (
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "logo")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={!logoPreview && !isEditMode}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Signature
              </label>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                  {signaturePreview ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <img
                        src={typeof formData.signature === "string" ? `http://localhost:8081/images/profile/${formData.signature}` : signaturePreview}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSignaturePreview(null);
                          setFormData({ ...formData, signature: null, hasSignature: false });
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaFileSignature className="text-blue-500 text-xl mb-2" />
                      <p className="text-xs text-gray-400 text-center">Click to upload signature</p>
                    </>
                  )}
                  <input
                    type="file"
                    name="signature"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "signature")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Stamp
              </label>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                  {stampPreview ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <img
                        src={typeof formData.stampImage === "string" ? `http://localhost:8081/images/profile/${formData.stampImage}` : stampPreview}
                        alt="Company Stamp"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setStampPreview(null);
                          setFormData({ ...formData, stampImage: null, hasStamp: false });
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaStamp className="text-blue-500 text-xl mb-2" />
                      <p className="text-xs text-gray-400 text-center">Click to upload company stamp</p>
                    </>
                  )}
                  <input
                    type="file"
                    name="stampImage"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "stampImage")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {showSuccessPopup && (
          <div className="mb-4 w-full flex justify-center">
            <div className="bg-gradient-to-r from-green-900 to-green-800 text-green-100 px-4 py-2 rounded-lg shadow border border-green-700 flex items-center animate-fadeIn">
              <FaCheck className="mr-2 text-green-300" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClear}
            className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md shadow-sm transition-all duration-300 flex items-center"
          >
            <span>{isEditMode ? "Reset Form" : "Clear"}</span>
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white py-2 px-4 rounded-md shadow-md transition-all duration-300 font-medium flex items-center"
          >
            <span>{isEditMode ? "Update Information" : "Register Company"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterCompany;