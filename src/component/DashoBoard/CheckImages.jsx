import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, User, Users, Image, Clock, MapPin, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CheckImages = () => {
  const { isDarkMode } = useApp();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [employeeImage, setEmployeeImage] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchEmployees();
    setSelectedDate(getCurrentDate());
  }, []);

  const fetchEmployees = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const subAdminId = storedUser?.subAdminId || storedUser?.id || 2;
      
      const response = await axios.get(`https://api.managifyhr.com/api/employee/${subAdminId}/list`);
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEmployeeImage = async () => {
    if (!selectedEmployee || !selectedDate) {
      toast.error('Please select employee and date');
      return;
    }

    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const subAdminId = storedUser?.subAdminId || storedUser?.id || 2;
      
      const response = await axios.get(
        `https://api.managifyhr.com/api/employee/${subAdminId}/${selectedEmployee}/attendance/images?date=${selectedDate}`
      );
      
      if (response.data.imageUrl) {
        setEmployeeImage(response.data);
        toast.success('Image found!');
      } else {
        setEmployeeImage(null);
        toast.error(response.data.message || 'No image found for this date');
      }
    } catch (error) {
      toast.error('Failed to fetch image');
      console.error('Error fetching image:', error);
      setEmployeeImage(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllImages = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const subAdminId = storedUser?.subAdminId || storedUser?.id || 2;
      
      const response = await axios.get(
        `https://api.managifyhr.com/api/employee/${subAdminId}/attendance/images/all?date=${selectedDate}`
      );
      
      setAllImages(response.data);
      if (response.data.length === 0) {
        toast.error('No work from field images found for this date');
      } else {
        toast.success(`Found ${response.data.length} images`);
      }
    } catch (error) {
      toast.error('Failed to fetch images');
      console.error('Error fetching images:', error);
      setAllImages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empId.toString().includes(searchTerm)
  );

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee.empId);
    setSearchTerm(employee.fullName);
    setShowEmployeeDropdown(false);
    setEmployeeImage(null);
  };

  const openImageModal = (image) => {
    setSelectedImageModal(image);
    setImageLoading(true);
  };

  const closeImageModal = () => {
    setSelectedImageModal(null);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    console.error('Failed to load image:', e.target.src);
    setImageLoading(false);
    toast.error('Failed to load high-quality image');
  };

  return (
    <>
      {/* High-Quality Image Rendering Styles */}
      <style jsx>{`
        .high-quality-image {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: high-quality;
          -ms-interpolation-mode: bicubic;
          image-orientation: from-image;
        }

        .ultra-hd-container {
          contain: layout style paint;
          will-change: transform;
        }

        @media (min-resolution: 2dppx) {
          .high-quality-image {
            image-rendering: -webkit-optimize-contrast;
          }
        }
      `}</style>

      <div className={`min-h-screen p-6 ${
        isDarkMode ? "bg-slate-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${
              isDarkMode ? "bg-blue-800" : "bg-blue-100"
            }`}>
              <Image className={`w-6 h-6 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? "text-blue-400" : "text-gray-800"
              }`}>Check Attendance Images</h1>
              <p className={`${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}>View work from field attendance images</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`} />
              <label className={`font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>Select Date:</label>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
        </div>

        {/* Employee Search Section */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${
          isDarkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-gray-200"
        } border`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? "bg-green-800" : "bg-green-100"
            }`}>
              <User className={`w-5 h-5 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`} />
            </div>
            <h2 className={`text-xl font-semibold ${
              isDarkMode ? "text-blue-400" : "text-gray-800"
            }`}>Search by Employee</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Employee Search */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Search Employee
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? "text-gray-400" : "text-gray-400"
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="Search by name or ID..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              {/* Employee Dropdown */}
              {showEmployeeDropdown && filteredEmployees.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600"
                    : "bg-white border-gray-300"
                }`}>
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.empId}
                      onClick={() => handleEmployeeSelect(employee)}
                      className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${
                        isDarkMode
                          ? "hover:bg-slate-600 border-slate-600"
                          : "hover:bg-blue-50 border-gray-100"
                      }`}
                    >
                      <div className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}>{employee.fullName}</div>
                      <div className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}>ID: {employee.empId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={fetchEmployeeImage}
              disabled={loading || !selectedEmployee || !selectedDate}
              className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                loading || !selectedEmployee || !selectedDate
                  ? "bg-gray-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search Image
            </button>

            {/* Check All Images Button */}
            <button
              onClick={fetchAllImages}
              disabled={loading || !selectedDate}
              className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                loading || !selectedDate
                  ? "bg-gray-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Users className="w-4 h-4" />
              )}
              Check All Images
            </button>
          </div>
        </div>

        {/* Employee Image Result */}
        {employeeImage && (
          <div className={`rounded-xl shadow-lg p-6 mb-6 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          } border`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? "text-blue-400" : "text-gray-800"
            }`}>Employee Image</h3>
            <div className={`rounded-lg p-4 ${
              isDarkMode ? "bg-slate-700" : "bg-gray-50"
            }`}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img
                    src={employeeImage.imageUrl}
                    alt={`${employeeImage.employeeName} attendance`}
                    className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow high-quality-image"
                    onClick={() => openImageModal(employeeImage)}
                    loading="lazy"
                    style={{
                      imageRendering: 'high-quality',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div className="md:w-2/3 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>Employee:</span>
                    <span className={isDarkMode ? "text-white" : "text-gray-800"}>{employeeImage.employeeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>Date:</span>
                    <span className={isDarkMode ? "text-white" : "text-gray-800"}>{employeeImage.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>Work Type:</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      isDarkMode
                        ? "bg-blue-800 text-blue-200"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {employeeImage.workType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>Punch In:</span>
                    <span className={isDarkMode ? "text-white" : "text-gray-800"}>{employeeImage.punchInTime || 'Not recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={`font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>Punch Out:</span>
                    <span className={isDarkMode ? "text-white" : "text-gray-800"}>{employeeImage.punchOutTime || 'Not recorded'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Images Grid */}
        {allImages.length > 0 && (
          <div className={`rounded-xl shadow-lg p-6 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          } border`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? "bg-purple-800" : "bg-purple-100"
              }`}>
                <Users className={`w-5 h-5 ${
                  isDarkMode ? "text-purple-400" : "text-purple-600"
                }`} />
              </div>
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? "text-blue-400" : "text-gray-800"
              }`}>
                All Work From Field Images ({allImages.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allImages.map((image, index) => (
                <div key={index} className={`rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-50"
                }`}>
                  <img
                    src={image.imageUrl}
                    alt={`${image.employeeName} attendance`}
                    className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity high-quality-image"
                    onClick={() => openImageModal(image)}
                    loading="lazy"
                    style={{
                      imageRendering: 'high-quality',
                      objectFit: 'cover'
                    }}
                  />
                  <div className="space-y-2">
                    <div className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}>{image.employeeName}</div>
                    <div className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>ID: {image.empId}</div>
                    <div className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {image.punchInTime && (
                        <span>In: {image.punchInTime}</span>
                      )}
                      {image.punchOutTime && (
                        <span className="ml-3">Out: {image.punchOutTime}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        image.status === 'Present' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>{image.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Image Modal with High Quality Display */}
        {selectedImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl max-w-7xl max-h-[95vh] overflow-auto ${
              isDarkMode
                ? "bg-slate-800 border-slate-600"
                : "bg-white border-gray-200"
            } border`}>
              <div className={`p-4 border-b flex justify-between items-center ${
                isDarkMode ? "border-slate-600" : "border-gray-200"
              }`}>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? "text-blue-400" : "text-gray-800"
                  }`}>{selectedImageModal.employeeName} - {selectedImageModal.date}</h3>
                  <p className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>Click image to view in original quality • Right-click to save</p>
                </div>
                <button
                  onClick={closeImageModal}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "hover:bg-slate-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                {/* High Quality Image Display */}
                <div className="relative group">
                  {/* Loading Indicator */}
                  {imageLoading && (
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isDarkMode ? "bg-slate-700" : "bg-gray-100"
                    } rounded-lg`}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}>Loading high-quality image...</p>
                      </div>
                    </div>
                  )}

                  <img
                    src={selectedImageModal.imageUrl}
                    alt={`${selectedImageModal.employeeName} attendance - Ultra HD Quality`}
                    className={`w-full max-h-[75vh] object-contain cursor-zoom-in hover:shadow-2xl transition-all duration-300 high-quality-image ultra-hd-container ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{
                      imageRendering: 'high-quality',
                      imageOrientation: 'from-image',
                      maxWidth: '100%',
                      height: 'auto',
                      filter: 'none', // Ensure no compression filters
                      backfaceVisibility: 'hidden', // Optimize rendering
                      transform: 'translateZ(0)', // Force hardware acceleration
                      objectFit: 'contain',
                      objectPosition: 'center'
                    }}
                    onClick={() => window.open(selectedImageModal.imageUrl, '_blank')}
                    onLoad={(e) => {
                      handleImageLoad();
                      // Log detailed image quality info
                      console.log(`🔥 Ultra HD image loaded: ${e.target.naturalWidth}x${e.target.naturalHeight}px`);
                      const megapixels = ((e.target.naturalWidth * e.target.naturalHeight) / 1000000).toFixed(1);
                      console.log(`📸 Resolution: ${megapixels}MP`);

                      // Show success toast for high-res images
                      if (e.target.naturalWidth > 2000 || e.target.naturalHeight > 2000) {
                        toast.success(`🔥 Ultra HD image loaded (${megapixels}MP)`);
                      }
                    }}
                    onError={handleImageError}
                  />
                  {/* Image Quality Indicator */}
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode
                      ? "bg-slate-700 text-green-400 border border-slate-600"
                      : "bg-white text-green-600 border border-gray-200"
                  } shadow-lg backdrop-blur-sm`}>
                    🔥 Ultra HD Quality
                  </div>
                  {/* Zoom Hint */}
                  <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs ${
                    isDarkMode
                      ? "bg-slate-700 text-gray-300 border border-slate-600"
                      : "bg-white text-gray-600 border border-gray-200"
                  } shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Click to open full size
                  </div>
                </div>

                {/* Image Metadata */}
                <div className={`mt-4 grid grid-cols-2 gap-4 text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Employee:</strong> {selectedImageModal.employeeName}</div>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Date:</strong> {selectedImageModal.date}</div>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Work Type:</strong> {selectedImageModal.workType}</div>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Status:</strong> {selectedImageModal.status}</div>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Punch In:</strong> {selectedImageModal.punchInTime || 'Not recorded'}</div>
                  <div><strong className={isDarkMode ? "text-white" : "text-gray-900"}>Punch Out:</strong> {selectedImageModal.punchOutTime || 'Not recorded'}</div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => window.open(selectedImageModal.imageUrl, '_blank')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    View Full Size
                  </button>
                  <a
                    href={selectedImageModal.imageUrl}
                    download={`${selectedImageModal.employeeName}_${selectedImageModal.date}_attendance.jpg`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    Download Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default CheckImages;
