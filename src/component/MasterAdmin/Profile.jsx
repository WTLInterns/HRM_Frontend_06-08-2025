import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaCheckCircle, FaLock } from "react-icons/fa";
import "../DashoBoard/animations.css";
import axios from "axios";
import { toast } from "react-toastify";

// Custom hook to monitor server status
const useServerStatus = () => {
  const [isServerUp, setIsServerUp] = useState(true);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Use a HEAD request to avoid fetching content, reducing load
        await axios.head('http://localhost:8081/masteradmin/update', { timeout: 5000 });
        setIsServerUp(true);
        console.log('Server status: UP');
      } catch (error) {
        setIsServerUp(false);
        console.log('Server status: DOWN', error.message);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return isServerUp;
};

// ImageWithFallback component with retry logic
const ImageWithFallback = ({ src, alt, className, fallbackIcon: FallbackIcon }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imageRef = useRef(null);
  const isServerUp = useServerStatus();
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!src) {
      setImgSrc('');
      setLoading(false);
      setError(true);
      console.log('No image source provided');
      return;
    }

    setLoading(true);
    setError(false);

    const isBlobUrl = src.startsWith('blob:');
    if (isBlobUrl) {
      setImgSrc(src);
      setLoading(false);
      console.log('Using blob URL:', src);
      return;
    }

    let url = src.includes('?') ? `${src}&t=${new Date().getTime()}` : `${src}?t=${new Date().getTime()}`;

    let isMounted = true;

    const loadImage = () => {
      const img = new Image();
      img.onload = () => {
        if (isMounted) {
          setImgSrc(url);
          setLoading(false);
          setError(false);
          retryCount.current = 0;
          console.log(`Image loaded successfully: ${url}`);
        }
      };
      img.onerror = () => {
        if (isMounted && retryCount.current < maxRetries) {
          retryCount.current += 1;
          console.log(`Image load failed for ${url}, retry ${retryCount.current}/${maxRetries}`);
          setTimeout(loadImage, 5000);
        } else if (isMounted) {
          setError(true);
          setLoading(false);
          console.log(`Image load failed after ${maxRetries} retries: ${url}`);
        }
      };
      img.src = url;
    };

    loadImage();

    if (!isServerUp && !error) {
      const interval = setInterval(() => {
        if (isServerUp && retryCount.current < maxRetries) {
          console.log(`Retrying image load for ${url} as server is back up`);
          loadImage();
        }
      }, 10000);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [src, isServerUp]);

  if (!src || error) {
    return (
      <div className={`flex flex-col justify-center items-center bg-slate-700 rounded-full border-2 border-blue-500 ${className || ''}`}>
        {FallbackIcon && <FallbackIcon className="text-slate-400 text-4xl" />}
        <span className="text-xs text-gray-500 mt-2">
          {!src ? "No image available" : "Image not available"}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center rounded-full border-2 border-blue-500 ${className || ''}`}>
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
      />
    </div>
  );
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    mobileno: "",
    password: "",
    roll: "MASTER_ADMIN",
    profileImg: "",
    MasterAdminEmailServerPassword: ""
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const isServerUp = useServerStatus();

  // Load user data from localStorage or API on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      setUserData(parsedUser);
      
      // Initialize the form with current user data
      setFormData({
        id: parsedUser.id || "",
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        mobileno: parsedUser.mobileno || "",
        password: "", // Password field starts empty for security
        roll: parsedUser.roll || parsedUser.role || "MASTER_ADMIN",
        profileImg: parsedUser.profileImg || "",
        MasterAdminEmailServerPassword: parsedUser.MasterAdminEmailServerPassword || ""
      });
      
      // Set preview image if email is available (retry handled by ImageWithFallback)
      if (parsedUser.email) {
        setPreviewImage(`http://localhost:8081/masteradmin/profileImg?email=${parsedUser.email}`);
      }
    }
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes and reset form
      if (userData) {
        setFormData({
          id: userData.id || "",
          name: userData.name || "",
          email: userData.email || "",
          mobileno: userData.mobileno || "",
          password: "", // Reset password field
          roll: userData.roll || userData.role || "MASTER_ADMIN",
          profileImg: userData.profileImg || "",
          MasterAdminEmailServerPassword: userData.MasterAdminEmailServerPassword || ""
        });
        
        // Reset image preview
        if (userData.email) {
          setPreviewImage(`http://localhost:8081/masteradmin/profileImg?email=${userData.email}`);
        } else {
          setPreviewImage(null);
        }
        setSelectedFile(null);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        toast.warning('Invalid file type. Use jpg, jpeg, png, or gif.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.warning(`File too large (${Math.round(file.size/1024/1024)} MB). Maximum size is 20MB.`);
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Create form data for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("id", formData.id);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobileno", formData.mobileno);
      formDataToSend.append("roll", formData.roll);
      
      // Only include password if it's provided
      if (formData.password) {
        formDataToSend.append("password", formData.password);
      } else {
        // Use the existing password if not changed
        formDataToSend.append("password", userData.password || "");
      }
      
      // Include MasterAdminEmailServerPassword if provided
      if (formData.MasterAdminEmailServerPassword) {
        formDataToSend.append("MasterAdminEmailServerPassword", formData.MasterAdminEmailServerPassword);
      } else {
        // Use the existing value if not changed
        formDataToSend.append("MasterAdminEmailServerPassword", userData.MasterAdminEmailServerPassword || "");
      }
      
      // Include profile image if selected
      if (selectedFile) {
        formDataToSend.append("profileImg", selectedFile);
      }
      
      // Make API call
      const response = await axios.put(
        "http://localhost:8081/masteradmin/update",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      console.log("Profile updated:", response.data);
      
      // Update local data
      const updatedUser = response.data;
      setUserData(updatedUser);
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const updatedUserForStorage = {
        ...currentUser,
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobileno: updatedUser.mobileno,
        role: updatedUser.roll, // Map roll to role for frontend consistency
        profileImg: updatedUser.profileImg,
        MasterAdminEmailServerPassword: updatedUser.MasterAdminEmailServerPassword
      };
      localStorage.setItem("user", JSON.stringify(updatedUserForStorage));
      
      // Add a trigger for sidebar to update
      sessionStorage.setItem("profileUpdated", Date.now().toString());
      
      // Update the preview image with the new image path
      if (updatedUser.email) {
        setPreviewImage(`http://localhost:8081/masteradmin/profileImg?email=${updatedUser.email}`);
      } else {
        setPreviewImage(null);
      }
      
      setIsEditing(false);
      setShowSuccessModal(true);
      
      // Auto-hide the success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 animate-fadeIn text-gray-100">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="bg-slate-800 rounded-lg shadow-xl border border-green-600 w-full max-w-md p-6 z-10 animate-scaleIn transform hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg animate-pulse-slow">
                <FaCheckCircle className="text-white text-3xl" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">Success!</h3>
              <p className="text-green-300">Profile updated successfully!</p>
              
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-md shadow-md transition-all duration-300 flex items-center justify-center"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-900/50 rounded-full text-blue-400">
            <FaUser className="text-xl md:text-2xl" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold">Profile Information</h2>
        </div>
        
        <button
          onClick={handleEditToggle}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 ${
            isEditing 
              ? "bg-red-900/70 text-red-200 hover:bg-red-800"
              : "bg-blue-900/70 text-blue-200 hover:bg-blue-800"
          }`}
        >
          {isEditing ? (
            <>
              <FaTimes size={16} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <FaEdit size={16} />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-700 border-2 border-blue-500">
              <ImageWithFallback
                src={previewImage}
                alt="Profile"
                className="w-full h-full object-cover"
                fallbackIcon={FaUser}
              />
            </div>
            {isEditing && (
              <label 
                htmlFor="profileImg" 
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-colors"
              >
                <FaEdit />
                <input 
                  id="profileImg" 
                  type="file" 
                  accept="image/jpeg,image/png,image/gif" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-blue-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 transition-all duration-300 ${
                  isEditing 
                    ? "bg-slate-700 border border-slate-600 text-gray-100" 
                    : "bg-slate-800 border border-slate-700 text-gray-300 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-blue-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 transition-all duration-300 ${
                  isEditing 
                    ? "bg-slate-700 border border-slate-600 text-gray-100" 
                    : "bg-slate-800 border border-slate-700 text-gray-300 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
          
          {/* Mobile Number */}
          <div className="space-y-2">
            <label htmlFor="mobileno" className="block text-sm font-medium text-gray-300">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-blue-400" />
              </div>
              <input
                type="text"
                id="mobileno"
                name="mobileno"
                value={formData.mobileno}
                onChange={handleChange}
                disabled={!isEditing}
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 transition-all duration-300 ${
                  isEditing 
                    ? "bg-slate-700 border border-slate-600 text-gray-100" 
                    : "bg-slate-800 border border-slate-700 text-gray-300 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
          
          {/* Password (only shown when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password (leave empty to keep current)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-blue-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="pl-10 block w-full rounded-md bg-slate-700 border border-slate-600 text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 transition-all duration-300"
                />
              </div>
            </div>
          )}
          
          {/* MasterAdminEmailServerPassword (only shown when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <label htmlFor="MasterAdminEmailServerPassword" className="block text-sm font-medium text-gray-300">
                Email Server Password (leave empty to keep current)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-blue-400" />
                </div>
                <input
                  type="password"
                  id="MasterAdminEmailServerPassword"
                  name="MasterAdminEmailServerPassword"
                  value={formData.MasterAdminEmailServerPassword}
                  onChange={handleChange}
                  placeholder="Enter new email server password"
                  className="pl-10 block w-full rounded-md bg-slate-700 border border-slate-600 text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 transition-all duration-300"
                />
              </div>
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-md shadow-md transition-all duration-300 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaSave size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;