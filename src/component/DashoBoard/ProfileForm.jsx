import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaCalendarAlt, FaRegEnvelope, FaPhone, FaUser, FaStamp, FaSignature, FaEdit, FaSave, FaTimes, FaCheck, FaIdCard, FaBriefcase, FaBuilding, FaUserTie, FaImage, FaCompass, FaMapPin, FaMap, FaGlobe, FaLock } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

// ImageWithFallback component to handle image loading errors
const ImageWithFallback = ({ src, alt, className, fallbackSrc, fallbackIcon: FallbackIcon, ...rest }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const imageRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setImgSrc('');
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    // Handle blob URLs directly
    const isBlobUrl = src.startsWith('blob:');
    if (isBlobUrl) {
      setImgSrc(src);
      setLoading(false);
      return;
    }

    // Full path check - if it's a full URL, use it directly
    const isFullPath = src.startsWith('http://') || src.startsWith('https://');
    
    // For local images stored on the server, construct the URL
    let url = isFullPath ? src : `https://api.managifyhr.com/images/profile/${src}`;
    
    // Add cache-busting parameter to avoid browser cache issues
    url = `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
    
    // Create a new image to preload
    const img = new Image();
    
    // Track if component unmounts during loading
    let isMounted = true;
    
    img.onload = () => {
      if (isMounted) {
        setImgSrc(url);
        setLoading(false);
      }
    };
    
    img.onerror = () => {
      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    };
    
    // Set the source to start loading
    img.src = url;
    
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src || error) {
    return (
      <div className={`flex flex-col justify-center items-center bg-gray-100 ${className || ''}`}>
        {FallbackIcon && <FallbackIcon className="text-gray-400 text-4xl" />}
        {!FallbackIcon && (
          <img 
            src={fallbackSrc || "https://via.placeholder.com/150?text=No+Image"} 
            alt={alt || "Placeholder"} 
            className={`max-h-full max-w-full object-contain ${className || ''}`}
            {...rest} 
          />
        )}
        <span className="text-xs text-gray-500 mt-2">
          {!src ? "No image available" : "Image not available"}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img 
        ref={imageRef} 
        src={imgSrc} 
        alt={alt} 
        className={className || ''} 
        {...rest} 
      />
    </div>
  );
};

// Add this new component for better image upload previews
const ImageUploadPreview = ({ 
  label, 
  preview, 
  file, 
  loading, 
  onUpload, 
  editMode, 
  fallbackIcon: FallbackIcon,
  isDarkMode 
}) => {
  return (
    <div>
      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label} {label === "Company Logo" && <span className="text-red-400">*</span>}</p>
      <div className={`relative w-32 h-32 md:w-40 md:h-40 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-gray-100 border-gray-300'} rounded-lg overflow-hidden ${editMode ? (isDarkMode ? 'border-2 border-blue-500' : 'border-2 border-blue-400') : 'border'}`}>
        {/* Show direct preview for new files */}
        {file ? (
          <div className={`w-full h-full flex justify-center items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <img 
              src={preview} 
              alt={`${label}`} 
              className="max-h-full max-w-full object-contain" 
            />
          </div>
        ) : preview ? (
          <ImageWithFallback
            src={preview}
            alt={label}
            className="w-full h-full object-contain"
            fallbackIcon={FallbackIcon}
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center">
            {FallbackIcon && <FallbackIcon className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-4xl mb-2`} />}
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No {label}</span>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        
        {editMode && (
          <div className="absolute bottom-2 right-2 z-10">
            <input
              type="file"
              id={`${label.replace(/\s+/g, '')}-upload`}
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={onUpload}
            />
            <label 
              htmlFor={`${label.replace(/\s+/g, '')}-upload`}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white cursor-pointer transition-colors duration-200 shadow-md`}
            >
              <FaEdit size={14} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileForm = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState({
    id: "",
    name: "",
    lastname: "",
    email: "",
    phoneno: "",
    emailServerPassword: "",
    registercompanyname: "",
    status: "",
    stampImg: "",
    signature: "",
    companylogo: "",
    gstno: "",
    cinno: "",
    companyurl: "",
    address: "",
    latitude: "",
    longitude: ""
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tempData, setTempData] = useState({...profileData});
  
  // Files to upload
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [stampImgFile, setStampImgFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  
  // Image preview URLs
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [stampImgPreview, setStampImgPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  
  // Add these new states to track image loading status
  const [logoLoading, setLogoLoading] = useState(false);
  const [stampLoading, setStampLoading] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
    const fetchSubadminData = async () => {
      try {
        setLoading(true);
        
        // Get email from localStorage for the API call
        const userFromStorage = JSON.parse(localStorage.getItem("user"));
        if (!userFromStorage || !userFromStorage.email) {
          throw new Error("No user email found in localStorage");
        }
        
        // Call the API to get full subadmin details by email
        const response = await axios.get(
          `https://api.managifyhr.com/api/subadmin/subadmin-by-email/${userFromStorage.email}`
        );
        
        console.log("Subadmin data from API:", response.data);
        
        if (response.data) {
          const userData = response.data;
          
          // Update state with the fetched data
          setProfileData({
            id: userData.id || "",
            name: userData.name || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            phoneno: userData.phoneno || "",
            emailServerPassword: userData.emailServerPassword || "",
            registercompanyname: userData.registercompanyname || "",
            status: userData.status || "active",
            stampImg: userData.stampImg || "",
            signature: userData.signature || "",
            companylogo: userData.companylogo || "",
            gstno: userData.gstno || "",
            cinno: userData.cinno || "",
            companyurl: userData.companyurl || "",
            address: userData.address || "",
            latitude: userData.latitude || "",
            longitude: userData.longitude || ""
          });
          
          setTempData({
            id: userData.id || "",
            name: userData.name || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            phoneno: userData.phoneno || "",
            emailServerPassword: userData.emailServerPassword || "",
            registercompanyname: userData.registercompanyname || "",
            status: userData.status || "active",
            stampImg: userData.stampImg || "",
            signature: userData.signature || "",
            companylogo: userData.companylogo || "",
            gstno: userData.gstno || "",
            cinno: userData.cinno || "",
            companyurl: userData.companyurl || "",
            address: userData.address || "",
            latitude: userData.latitude || "",
            longitude: userData.longitude || ""
          });
          
          // Also update the localStorage with this more complete data
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching subadmin data:", error);
        setError("Failed to load profile data. Please try again.");
        
        // Fallback to localStorage if API fails
        const fallbackData = JSON.parse(localStorage.getItem("user"));
        if (fallbackData) {
          console.log("Falling back to localStorage data");
          setProfileData({
            id: fallbackData.id || "",
            name: fallbackData.name || "",
            lastname: fallbackData.lastname || "",
            email: fallbackData.email || "",
            phoneno: fallbackData.phoneno || "",
            emailServerPassword: fallbackData.emailServerPassword || "",
            registercompanyname: fallbackData.registercompanyname || "",
            status: fallbackData.status || "active",
            stampImg: fallbackData.stampImg || "",
            signature: fallbackData.signature || "",
            companylogo: fallbackData.companylogo || "",
            gstno: fallbackData.gstno || "",
            cinno: fallbackData.cinno || "",
            companyurl: fallbackData.companyurl || "",
            address: fallbackData.address || "",
            latitude: fallbackData.latitude || "",
            longitude: fallbackData.longitude || ""
          });
          
          setTempData({
            id: fallbackData.id || "",
            name: fallbackData.name || "",
            lastname: fallbackData.lastname || "",
            email: fallbackData.email || "",
            phoneno: fallbackData.phoneno || "",
            emailServerPassword: fallbackData.emailServerPassword || "",
            registercompanyname: fallbackData.registercompanyname || "",
            status: fallbackData.status || "active",
            stampImg: fallbackData.stampImg || "",
            signature: fallbackData.signature || "",
            companylogo: fallbackData.companylogo || "",
            gstno: fallbackData.gstno || "",
            cinno: fallbackData.cinno || "",
            companyurl: fallbackData.companyurl || "",
            address: fallbackData.address || "",
            latitude: fallbackData.latitude || "",
            longitude: fallbackData.longitude || ""
          });
        }
        
        setLoading(false);
      }
    };
    
    fetchSubadminData();
  }, []);
  
  // Modified function to fetch image URLs with the correct pattern
  const getImageUrl = (filename) => {
    if (!filename) return null;
    
    // First, check if it's an absolute URL
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    // Use the server URL pattern
    return `https://api.managifyhr.com/images/profile/${filename}`;
  };

  // Function to fetch images from the server - not used due to 500 error
  const fetchImages = async (subadminId) => {
    if (!subadminId) {
      console.error("No subadminId provided");
      return;
    }

    console.log(`Setting up image paths for subadmin ID: ${subadminId}`);
    
    // Just use static image paths instead of API calls
    setCompanyLogoPreview(getImageUrl(profileData.companylogo));
    setStampImgPreview(getImageUrl(profileData.stampImg));
    setSignaturePreview(getImageUrl(profileData.signature));
    
    // We won't try to fetch from API anymore since it gives 500 error
    console.log("Using static image paths:", {
      logo: getImageUrl(profileData.companylogo),
      stamp: getImageUrl(profileData.stampImg),
      signature: getImageUrl(profileData.signature)
    });
  };

  // Update this effect to use the simpler getImageUrl function
  useEffect(() => {
    if (profileData) {
      // Reset all image states first
      setCompanyLogoPreview("");
      setStampImgPreview("");
      setSignaturePreview("");
      
      setTimeout(() => {
        // Set image previews if available - just passing the filename
        if (profileData.companylogo) {
          console.log(`Setting company logo preview to filename: ${profileData.companylogo}`);
          setCompanyLogoPreview(profileData.companylogo);
        }
        if (profileData.stampImg) {
          console.log(`Setting stamp preview to filename: ${profileData.stampImg}`);
          setStampImgPreview(profileData.stampImg);
        }
        if (profileData.signature) {
          console.log(`Setting signature preview to filename: ${profileData.signature}`);
          setSignaturePreview(profileData.signature);
        }
      }, 100); // Small delay to ensure reset happens first
    }
  }, [profileData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({
      ...tempData,
      [name]: value,
    });
  };

  const handleEdit = () => {
    setTempData({...profileData});
    
    // Make sure image previews are set when entering edit mode
    if (profileData.companylogo) {
      console.log(`Setting company logo preview for edit mode: ${profileData.companylogo}`);
      // We'll pass the filename directly - the ImageWithFallback component will construct the URL
      setCompanyLogoPreview(profileData.companylogo);
    }
    
    if (profileData.stampImg) {
      console.log(`Setting stamp preview for edit mode: ${profileData.stampImg}`);
      setStampImgPreview(profileData.stampImg);
    }
    
    if (profileData.signature) {
      console.log(`Setting signature preview for edit mode: ${profileData.signature}`);
      setSignaturePreview(profileData.signature);
    }
    
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    
    // Reset file states
    setCompanyLogoFile(null);
    setStampImgFile(null);
    setSignatureFile(null);
    
    // Reset preview URLs to the current values from profileData
    if (profileData.companylogo) {
      setCompanyLogoPreview(profileData.companylogo);
    } else {
      setCompanyLogoPreview("");
    }
    
    if (profileData.stampImg) {
      setStampImgPreview(profileData.stampImg);
    } else {
      setStampImgPreview("");
    }
    
    if (profileData.signature) {
      setSignaturePreview(profileData.signature);
    } else {
      setSignaturePreview("");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create form data for the API
      const formData = new FormData();
      
      console.log("Preparing form data with values:", {
        id: profileData.id,
        name: tempData.name,
        lastname: tempData.lastname,
        email: tempData.email,
        phoneno: tempData.phoneno,
        emailServerPassword: tempData.emailServerPassword,
        registercompanyname: tempData.registercompanyname,
        status: tempData.status || 'active',
        gstno: tempData.gstno || '',
        cinno: tempData.cinno || '',
        companyurl: tempData.companyurl || '',
        address: tempData.address || '',
        latitude: tempData.latitude || '',
        longitude: tempData.longitude || ''
      });
      
      // Required fields from API endpoint
      formData.append('name', tempData.name);
      formData.append('lastname', tempData.lastname);
      formData.append('email', tempData.email);
      formData.append('phoneno', tempData.phoneno);
      formData.append('emailServerPassword', tempData.emailServerPassword || '');
      formData.append('registercompanyname', tempData.registercompanyname);
      formData.append('status', tempData.status || 'active');
      
      // Make sure to include all required params even if they're empty
      formData.append('gstno', tempData.gstno || '');
      formData.append('cinno', tempData.cinno || '');
      formData.append('companyurl', tempData.companyurl || '');
      formData.append('address', tempData.address || '');
      formData.append('latitude', tempData.latitude || '');
      formData.append('longitude', tempData.longitude || '');
      
      // The logic for handling files - for each file, either upload a new one or pass the existing filename
      let hasUploadedFiles = false;
      
      // Company Logo handling
      if (companyLogoFile) {
        // New file being uploaded
        const fileExt = companyLogoFile.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
          if (companyLogoFile.size <= 20 * 1024 * 1024) {
            formData.append('companylogo', companyLogoFile);
            console.log('Adding new company logo file:', companyLogoFile.name);
            hasUploadedFiles = true;
          } else {
            toast.warning(`Logo file is too large (${Math.round(companyLogoFile.size/1024/1024)} MB). Maximum size is 20MB.`);
          }
        } else {
          toast.warning(`Invalid file type for logo: ${fileExt}. Use jpg, jpeg, png, or gif.`);
        }
      } else {
        // Pass empty parameter to avoid null pointer exception
        formData.append('companylogo', new Blob([], {type: 'application/octet-stream'}));
        console.log('No new company logo, sending empty file');
      }
      
      // Stamp Image handling
      if (stampImgFile) {
        // New file being uploaded
        const fileExt = stampImgFile.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
          if (stampImgFile.size <= 20 * 1024 * 1024) {
            formData.append('stampImg', stampImgFile);
            console.log('Adding new stamp image file:', stampImgFile.name);
            hasUploadedFiles = true;
          } else {
            toast.warning(`Stamp file is too large (${Math.round(stampImgFile.size/1024/1024)} MB). Maximum size is 20MB.`);
          }
        } else {
          toast.warning(`Invalid file type for stamp: ${fileExt}. Use jpg, jpeg, png, or gif.`);
        }
      } else {
        // Pass empty parameter to avoid null pointer exception
        formData.append('stampImg', new Blob([], {type: 'application/octet-stream'}));
        console.log('No new stamp image, sending empty file');
      }
      
      // Signature handling
      if (signatureFile) {
        // New file being uploaded
        const fileExt = signatureFile.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
          if (signatureFile.size <= 20 * 1024 * 1024) {
            formData.append('signature', signatureFile);
            console.log('Adding new signature file:', signatureFile.name);
            hasUploadedFiles = true;
          } else {
            toast.warning(`Signature file is too large (${Math.round(signatureFile.size/1024/1024)} MB). Maximum size is 20MB.`);
          }
        } else {
          toast.warning(`Invalid file type for signature: ${fileExt}. Use jpg, jpeg, png, or gif.`);
        }
      } else {
        // Pass empty parameter to avoid null pointer exception
        formData.append('signature', new Blob([], {type: 'application/octet-stream'}));
        console.log('No new signature, sending empty file');
      }
      
      // Add existing filenames as text fields for reference
      if (profileData.companylogo) {
        formData.append('existingCompanyLogo', profileData.companylogo);
        console.log('Including existing company logo reference:', profileData.companylogo);
      }
      
      if (profileData.stampImg) {
        formData.append('existingStampImg', profileData.stampImg);
        console.log('Including existing stamp image reference:', profileData.stampImg);
      }
      
      if (profileData.signature) {
        formData.append('existingSignature', profileData.signature);
        console.log('Including existing signature reference:', profileData.signature);
      }
      
      // Log the form data for debugging
      console.log('Submitting form data with the following fields:');
      for (let pair of formData.entries()) {
        console.log(pair[0], typeof pair[1] === 'object' ? 'File: ' + pair[1].name : pair[1]);
      }
      
      // Call the API
      try {
        console.log(`Sending update request to: https://api.managifyhr.com/api/subadmin/update-fields/${profileData.id}`);
        const response = await axios.put(
          `https://api.managifyhr.com/api/subadmin/update-fields/${profileData.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          }
        );
        
        console.log("Profile update response:", response.data);
        
        // Handle successful update
        toast.success("Profile updated successfully!");
        
        // Fetch updated data
        try {
          // Add a small delay to allow server to complete file processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Fetch the updated user data
          const fetchResponse = await axios.get(
            `https://api.managifyhr.com/api/subadmin/subadmin-by-email/${response.data.email}`
          );
          
          if (fetchResponse.data) {
            const updatedUser = fetchResponse.data;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            
            // Reset file states since upload is complete
            setCompanyLogoFile(null);
            setStampImgFile(null);
            setSignatureFile(null);
            
            // Update state with the newest data
            setProfileData(updatedUser);
            
            // Set image previews with the updated filenames
            setTimeout(() => {
              if (updatedUser.companylogo) {
                console.log(`Setting company logo preview to: ${updatedUser.companylogo}`);
                setCompanyLogoPreview(updatedUser.companylogo);
              }
              
              if (updatedUser.stampImg) {
                console.log(`Setting stamp preview to: ${updatedUser.stampImg}`);
                setStampImgPreview(updatedUser.stampImg);
              }
              
              if (updatedUser.signature) {
                console.log(`Setting signature preview to: ${updatedUser.signature}`);
                setSignaturePreview(updatedUser.signature);
              }
            }, 500);
          }
        } catch (fetchError) {
          console.error("Error fetching updated user data:", fetchError);
          // Fall back to using the data from the update response
          const updatedUser = response.data;
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setProfileData(updatedUser);
          
          // Set image previews with a delay
          setTimeout(() => {
            if (updatedUser.companylogo) {
              setCompanyLogoPreview(updatedUser.companylogo);
            }
            
            if (updatedUser.stampImg) {
              setStampImgPreview(updatedUser.stampImg);
            }
            
            if (updatedUser.signature) {
              setSignaturePreview(updatedUser.signature);
            }
          }, 500);
        }
        
        setEditMode(false);
        setShowSuccessModal(true);
        
        // Hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } catch (axiosError) {
        console.error("Error updating profile:", axiosError);
        
        // Get detailed error message from the server if available
        const errorMessage = axiosError.response?.data || "Failed to update profile. Please try again.";
        console.log("Backend error details:", errorMessage);
        
        toast.error(typeof errorMessage === 'string' ? errorMessage : "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log(`Selected ${type} file:`, file.name);
    
    // Create a preview URL using URL.createObjectURL
    const previewUrl = URL.createObjectURL(file);
    
    switch(type) {
      case 'logo':
        setCompanyLogoFile(file);
        setCompanyLogoPreview(previewUrl);
        break;
      case 'stamp':
        setStampImgFile(file);
        setStampImgPreview(previewUrl);
        break;
      case 'signature':
        setSignatureFile(file);
        setSignaturePreview(previewUrl);
        break;
      default:
        break;
    }
  };

  // Function to handle loading of images and provide fallbacks
  const handleImageLoad = (type) => {
    let imageUrl = null;
    let filename = null;
    
    switch(type) {
      case 'logo':
        filename = profileData.companylogo;
        break;
      case 'stamp':
        filename = profileData.stampImg;
        break;
      case 'signature':
        filename = profileData.signature;
        break;
      default:
        return null;
    }

    if (!filename) return null;
    
    // Try first with the standard URL
    imageUrl = `https://api.managifyhr.com/images/profile/${filename}`;
    
    return imageUrl;
  };

  useEffect(() => {
    if (profileData) {
      // Set image previews if available
      if (profileData.companylogo) {
        setCompanyLogoPreview(handleImageLoad('logo'));
      }
      if (profileData.stampImg) {
        setStampImgPreview(handleImageLoad('stamp'));
      }
      if (profileData.signature) {
        setSignaturePreview(handleImageLoad('signature'));
      }
    }
  }, [profileData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 rounded-lg p-4 text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen`}>      
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-2`}>
          <FaUser className="mr-2" /> {t('navigation.profileInformation')}
        </h2>
        
        {/* Edit/Save Buttons */}
        <div>
          {editMode ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-green-600' : 'bg-green-500'} text-white font-medium hover:bg-green-700 transition duration-300 ease-in-out`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave /> Save
                  </>
                )}
              </button>
              <button 
                onClick={handleCancel} 
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-600' : 'bg-red-500'} text-white font-medium hover:bg-red-700 transition duration-300 ease-in-out`}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={handleEdit} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white font-medium hover:bg-blue-700 transition duration-300 ease-in-out`}
            >
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>
      </div>
      
      {/* Profile Information */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md border-2 ${editMode ? (isDarkMode ? 'border-blue-600' : 'border-blue-400') : ''} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} p-5 rounded-lg shadow border-2 ${editMode ? (isDarkMode ? 'border-blue-500' : 'border-blue-300') : ''}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              <FaIdCard className="mr-2" /> Personal Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>First Name</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaUser className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={tempData.name}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.name}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Last Name</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaUser className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="lastname"
                      value={tempData.lastname}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.lastname}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaRegEnvelope className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={tempData.email}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.email}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email Server Password</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaLock className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="password"
                      name="emailServerPassword"
                      value={tempData.emailServerPassword}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.emailServerPassword || 'Not provided'}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone Number</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaPhone className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="phoneno"
                      value={tempData.phoneno}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.phoneno}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Information */}
          <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} p-5 rounded-lg shadow border-2 ${editMode ? (isDarkMode ? 'border-blue-500' : 'border-blue-300') : ''}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              <FaBuilding className="mr-2" /> Company Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Company Name</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaBuilding className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="registercompanyname"
                      value={tempData.registercompanyname}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.registercompanyname}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>GST Number</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaIdCard className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="gstno"
                      value={tempData.gstno}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.gstno || 'Not provided'}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>CIN Number</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaIdCard className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="cinno"
                      value={tempData.cinno}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.cinno || 'Not provided'}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Company Website</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaBuilding className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="companyurl"
                      value={tempData.companyurl}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.companyurl || 'Not provided'}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Address</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaBuilding className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={tempData.address}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.address || 'Not provided'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Latitude</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaGlobe className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="latitude"
                      value={tempData.latitude}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.latitude || 'Not provided'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Longitude</label>
                <div className={`flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} px-3 py-2 rounded-md ${editMode ? (isDarkMode ? 'border border-blue-400' : 'border border-blue-300') : ''}`}>
                  <FaGlobe className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                  {editMode ? (
                    <input
                      type="text"
                      name="longitude"
                      value={tempData.longitude}
                      onChange={handleInputChange}
                      className={`w-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                    />
                  ) : (
                    <div className="font-medium">{profileData.longitude || 'Not provided'}</div>
                  )}
                </div>
              </div>
                
            </div>
          </div>
        </div>
      </div>
      
      {/* Images Section */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md border-2 ${editMode ? (isDarkMode ? 'border-blue-600' : 'border-blue-400') : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-2`}>
            <FaIdCard /> Images & Signature
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Logo */}
          <ImageUploadPreview
            label="Company Logo"
            preview={companyLogoFile ? companyLogoPreview : companyLogoPreview}
            file={companyLogoFile}
            loading={logoLoading}
            onUpload={(e) => handleImageUpload(e, 'logo')}
            editMode={editMode}
            fallbackIcon={FaImage}
            isDarkMode={isDarkMode}
          />
          
          {/* Stamp Image */}
          <ImageUploadPreview
            label="Stamp Image *"
            preview={stampImgFile ? stampImgPreview : stampImgPreview}
            file={stampImgFile}
            loading={stampLoading}
            onUpload={(e) => handleImageUpload(e, 'stamp')}
            editMode={editMode}
            fallbackIcon={FaStamp}
            isDarkMode={isDarkMode}
          />
          
          {/* Signature */}
          <ImageUploadPreview
            label="Signature *"
            preview={signatureFile ? signaturePreview : signaturePreview}
            file={signatureFile}
            loading={signatureLoading}
            onUpload={(e) => handleImageUpload(e, 'signature')}
            editMode={editMode}
            fallbackIcon={FaSignature}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
      
      {/* Edit/Save Buttons - visible on mobile */}
      <div className="md:hidden flex justify-center mt-6">
        {editMode ? (
          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-green-600' : 'bg-green-500'} text-white font-medium hover:bg-green-700 transition duration-300 ease-in-out`}
              disabled={loading}
            >
              {loading ? "Saving..." : <><FaSave /> Save</>}
            </button>
            <button 
              onClick={handleCancel} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-600' : 'bg-red-500'} text-white font-medium hover:bg-red-700 transition duration-300 ease-in-out`}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={handleEdit} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white font-medium hover:bg-blue-700 transition duration-300 ease-in-out`}
          >
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={() => setShowSuccessModal(false)}
          ></div>
          <div className={`${isDarkMode ? 'bg-slate-800 border-green-800' : 'bg-white border-green-200'} rounded-lg shadow-xl border w-full max-w-md p-6 z-10 animate-scaleIn`}>
            <div className={`flex items-center mb-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              <FaCheck className="text-2xl mr-3 animate-pulse" />
              <h3 className="text-xl font-semibold">Profile Updated Successfully</h3>
            </div>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your profile has been updated successfully. You may need to log out and log back in to see all changes.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className={`w-full py-2 ${isDarkMode ? 'bg-green-600' : 'bg-green-500'} text-white rounded-md hover:bg-green-700 transition-all duration-300`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;