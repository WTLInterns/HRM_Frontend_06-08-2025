import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { GoogleMap, MarkerF, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { FaTimes, FaFileExcel } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useTranslation } from 'react-i18next';

const API_URL = "http://localhost:8282/api";

const containerStyle = {
  width: "100%",
  height: "500px", // Increased height for better view
  borderRadius: "16px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
  margin: "24px 0"
};

// Reverse geocoding function
const fetchAddress = async (lat, lng, setter) => {
  try {
    const apiKey = "AIzaSyCelDo4I5cPQ72TfCTQW-arhPZ7ALNcp8w";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      setter(data.results[0].formatted_address);
    } else {
      setter("");
    }
  } catch (e) {
    setter("");
  }
};

const TrackEmployee = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [isTrackingFieldEmployees, setIsTrackingFieldEmployees] = useState(false);
  const [fieldEmployeeLocations, setFieldEmployeeLocations] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null); // For InfoWindow

  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default to India
  const [zoom, setZoom] = useState(5); // Default zoom
  
  const stompClientRef = useRef(null);
  const [employeeName, setEmployeeName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [lastAddress, setLastAddress] = useState("");
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCustomize, setExportCustomize] = useState(false);
  const [exportEmployeeName, setExportEmployeeName] = useState("");
  const [exportSuggestions, setExportSuggestions] = useState([]);
  const [selectedExportEmployee, setSelectedExportEmployee] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCelDo4I5cPQ72TfCTQW-arhPZ7ALNcp8w"
  });

  const getSubadminId = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user?.id;
    }
    return null;
  };

  useEffect(() => {
    const subAdminId = getSubadminId();
    if (subAdminId) {
      axios
        .get(`${API_URL}/employee/${subAdminId}/employee/all`)
        .then(res => {
          setEmployeeList(res.data || []);
        })
        .catch(() => setEmployeeList([]));
    }
  }, []);

  const handleTrackAll = useCallback(async () => {
    const subadminId = getSubadminId();
    if (!subadminId) return;
    setLoading(true);
    setError("");
    try {
      // Use the new endpoint to get only "work from field" employees
      const res = await axios.get(`${API_URL}/location/${subadminId}/employee/locations/field-work`);
      const locations = res.data.map(loc => ({
        ...loc,
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude)
      }));
      setFieldEmployeeLocations(locations);
      if (locations.length > 0) {
        setMapCenter({ lat: locations[0].lat, lng: locations[0].lng });
        setZoom(12);
        toast.success(`Tracking ${locations.length} "work from field" employees`);
      } else {
        toast.info("No employees are currently working from field today");
        setError("No employees are currently working from field today.");
      }
    } catch (err) {
      setError("Could not fetch work from field employee locations.");
      toast.error("Failed to fetch work from field employee locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTrackingFieldEmployees) {
      handleTrackAll();
    }
  }, [isTrackingFieldEmployees, handleTrackAll]);

  useEffect(() => {
    const subadminId = getSubadminId();
    if (!subadminId) return;

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    const sock = new SockJS("http://localhost:8282/ws");
    const stompClient = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/location/${subadminId}`, (message) => {
        const data = JSON.parse(message.body);
        if (isTrackingFieldEmployees) {
          setFieldEmployeeLocations(prev =>
            prev.map(emp =>
              emp.empId === data.empId
                ? { ...emp, lat: parseFloat(data.latitude), lng: parseFloat(data.longitude), fullName: data.fullName }
                : emp
            )
          );
        } else if (selectedEmployee && data.empId === selectedEmployee.empId) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          setLocation({ lat, lng, empName: data.fullName });
          setMapCenter({ lat, lng });
          fetchAddress(lat, lng, setAddress);
        }
      });
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [isTrackingFieldEmployees, selectedEmployee]);

  const handleTrack = async (emp) => {
    // This function is now simplified as WebSocket handles updates
    setError("");
    setLocation(null);
    setAddress("");
    setLastAddress("");
    setLoading(true);
    const subadminId = getSubadminId();
    if (!subadminId) return;
    try {
      const res = await axios.get(`${API_URL}/location/${subadminId}/employee/${emp.empId}`);
      const data = res.data;
      if (!data || !data.latitude || !data.longitude) {
        throw new Error("No location data available for this employee.");
      }
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      // Store both current and last location data
      const locationData = {
        lat,
        lng,
        empName: emp.fullName,
        lastLat: data.lastLatitude ? parseFloat(data.lastLatitude) : null,
        lastLng: data.lastLongitude ? parseFloat(data.lastLongitude) : null
      };

      setLocation(locationData);
      setMapCenter({ lat, lng });
      setZoom(16);

      // Fetch current location address
      fetchAddress(lat, lng, setAddress);

      // Fetch last location address if available
      if (data.lastLatitude && data.lastLongitude) {
        const lastLat = parseFloat(data.lastLatitude);
        const lastLng = parseFloat(data.lastLongitude);
        fetchAddress(lastLat, lastLng, setLastAddress);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      handleTrack(selectedEmployee);
    }
  }, [selectedEmployee]);
  
  // Autocomplete for search
  useEffect(() => {
    const query = employeeName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const list = employeeList.map(emp => ({
      empId: emp.empId,
      fullName: `${emp.firstName} ${emp.lastName}`
    }));
    setSuggestions(list.filter(item => item.fullName.toLowerCase().includes(query)).slice(0, 10));
  }, [employeeName, employeeList]);

  // Autocomplete for export modal
  useEffect(() => {
    const query = exportEmployeeName.trim().toLowerCase();
    if (!query) {
      setExportSuggestions([]);
      return;
    }
     const list = employeeList.map(emp => ({
      empId: emp.empId,
      fullName: `${emp.firstName} ${emp.lastName}`
    }));
    setExportSuggestions(list.filter(item => item.fullName.toLowerCase().includes(query)).slice(0, 10));
  }, [exportEmployeeName, employeeList]);

  const handleDownload = async () => {
    const subadminId = getSubadminId();
    let url = "";
    if (exportCustomize) {
      if (!selectedExportEmployee) {
        toast.error("Please select an employee to export.");
        return;
      }
      url = `${API_URL}/location/export/employee/${selectedExportEmployee.empId}`;
    } else {
      if (!subadminId) {
        toast.error("Subadmin ID not found. Please log in again.");
        return;
      }
      url = `${API_URL}/location/export/subadmin/${subadminId}`;
    }

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob', // Important
      });

      // Robust filename extraction
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'location_history.xlsx'; // Default filename
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch.length > 1) {
              filename = filenameMatch[1];
          }
      }

      const href = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
      
      toast.success('Report download started!');

      // Reset modal state
      setShowExportModal(false);
      setExportCustomize(false);
      setExportEmployeeName("");
      setSelectedExportEmployee(null);

    } catch (err) {
        if (err.response && err.response.data) {
            // The response data is a blob, we need to read it as text to get the error
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    // Try to parse it as JSON
                    const errorData = JSON.parse(reader.result);
                    toast.error(`Download failed: ${errorData.message || 'Unknown server error'}`);
                } catch (e) {
                    // If not JSON, show the raw text
                    toast.error(`Download failed: ${reader.result || 'Could not parse error response.'}`);
                }
            };
            reader.onerror = () => {
                toast.error('Download failed. Could not read the error response from the server.');
            };
            reader.readAsText(err.response.data);
        } else {
            toast.error("Failed to download report. Check network connection or server status.");
        }
    }
  };


  return (
    <div className={`w-full max-w-4xl mx-auto p-6 rounded-lg shadow-lg mt-10 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
      <h2 className="text-3xl font-bold mb-4 text-blue-600">{t('navigation.trackEmployee')}</h2>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTrackingFieldEmployees(!isTrackingFieldEmployees)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isTrackingFieldEmployees
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isTrackingFieldEmployees ? "Tracking Field Employees" : "Track Field Employees"}
            </button>
            {isTrackingFieldEmployees && (
              <span className="text-sm text-green-600 font-medium">
                📍 Showing only "work from field" employees
              </span>
            )}
          </div>
          {!isTrackingFieldEmployees && (
            <p className="text-sm text-gray-600 mt-1">
              Click to track employees who are currently working from field today
            </p>
          )}
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaFileExcel className="mr-2" />
          Export Data
        </button>
      </div>

      {!isTrackingFieldEmployees && (
        <div className="relative w-full mb-4">
            <input
              type="text"
              className={`w-full p-3 rounded-lg border text-base focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'}`}
              placeholder="Search for a single employee..."
              value={employeeName}
              onChange={e => {
                setEmployeeName(e.target.value);
                setSelectedEmployee(null);
                setLocation(null);
              }}
              autoComplete="off"
            />
            {suggestions.length > 0 && !selectedEmployee && (
              <div className={`absolute left-0 right-0 z-10 w-full mt-1 border rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                {suggestions.map(sug => (
                  <div
                    key={sug.empId}
                    className={`px-4 py-2 cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-100'}`}
                    onClick={() => {
                      setEmployeeName(sug.fullName);
                      setSelectedEmployee(sug);
                      setSuggestions([]);
                    }}
                  >
                    {sug.fullName}
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
      
      {loading && <div className="text-center p-4">Loading...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={zoom}
          options={{ gestureHandling: "cooperative" }}
        >
          {isTrackingFieldEmployees
            ? fieldEmployeeLocations.map(emp => (
                <MarkerF
                  key={emp.empId}
                  position={{ lat: emp.lat, lng: emp.lng }}
                  label={`🏃 ${emp.fullName}`}
                  onClick={() => setActiveMarker(emp.empId)}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="3"/>
                        <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🏃</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20)
                  }}
                >
                  {activeMarker === emp.empId && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div>
                        <h4 className="font-bold text-green-600">🏃 {emp.fullName}</h4>
                        <p><strong>ID:</strong> {emp.empId}</p>
                        <p><strong>Work Type:</strong> <span className="text-green-600 font-medium">Work from Field</span></p>
                        <p><strong>Location:</strong> {emp.lat.toFixed(6)}, {emp.lng.toFixed(6)}</p>
                        <p className="text-sm text-gray-500 mt-1">📍 Currently working in the field</p>
                      </div>
                    </InfoWindow>
                  )}
                </MarkerF>
              ))
            : location && (
                <>
                  {/* Current Location Marker */}
                  <MarkerF
                    position={{ lat: location.lat, lng: location.lng }}
                    onClick={() => setActiveMarker('current')}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 2C10.48 2 6 6.48 6 12c0 8.25 10 18 10 18s10-9.75 10-18c0-5.52-4.48-10-10-10z" fill="#EA4335"/>
                          <circle cx="16" cy="12" r="4" fill="white"/>
                        </svg>
                      `),
                      scaledSize: new window.google.maps.Size(32, 32),
                      anchor: new window.google.maps.Point(16, 32)
                    }}
                  >
                    {activeMarker === 'current' && (
                      <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                        <div>
                          <h4 className="font-bold text-red-600">🎯 Current Location</h4>
                          <p><strong>Employee:</strong> {location.empName}</p>
                          <p><strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                          <p className="text-sm text-gray-500 mt-1">Latest known position</p>
                        </div>
                      </InfoWindow>
                    )}
                  </MarkerF>

                </>
              )}
        </GoogleMap>
      )}

      {!isTrackingFieldEmployees && location && (
        <div className="mt-4 space-y-4">
          <h3 className="font-bold text-xl text-center mb-4 text-blue-600 dark:text-blue-400">{location.empName}</h3>

          {/* Current Location */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <h4 className="font-semibold text-lg text-red-700 dark:text-red-300 mb-2">🎯 Current Location</h4>
            <div className="space-y-1">
              <p className="text-sm"><span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}</p>
              <p className="text-sm"><span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <span className="font-medium">Address:</span> {address || "Loading address..."}
              </p>
            </div>
          </div>

          {/* Last Location */}
          {location.lastLat && location.lastLng ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <h4 className="font-semibold text-lg text-orange-700 dark:text-orange-300 mb-2">📌 Last Location</h4>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Latitude:</span> {location.lastLat.toFixed(6)}</p>
                <p className="text-sm"><span className="font-medium">Longitude:</span> {location.lastLng.toFixed(6)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <span className="font-medium">Address:</span> {lastAddress || "Loading address..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-semibold text-lg text-gray-600 dark:text-gray-400 mb-2">📌 Last Location</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">No previous location data available</p>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            💡 This information helps track employee location even if their phone is dead or restarted
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
           <div className={`w-96 max-w-md p-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-lg font-bold">📊 Export Data</h3>
               <button
                 onClick={() => setShowExportModal(false)}
                 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
               >
                 <FaTimes/>
               </button>
             </div>

             <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
               <p className="text-xs text-blue-700 dark:text-blue-300">
                 <strong>📍 Excel Report:</strong> Last 12 hours with addresses & professional formatting.
               </p>
             </div>

             <div className="flex space-x-2 mb-3">
                <button
                  onClick={() => setExportCustomize(false)}
                  className={`px-3 py-1.5 text-sm rounded ${!exportCustomize ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  All Data
                </button>
                <button
                  onClick={() => setExportCustomize(true)}
                  className={`px-3 py-1.5 text-sm rounded ${exportCustomize ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  Customize
                </button>
             </div>

            {exportCustomize && (
              <div className="relative w-full mb-3">
                <input
                  type="text"
                  placeholder="Enter employee name..."
                  value={exportEmployeeName}
                  onChange={(e) => setExportEmployeeName(e.target.value)}
                  className={`w-full p-2 text-sm rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-200 border-gray-300'}`}
                />
                {exportSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 z-10 w-full mt-1 border rounded shadow-lg max-h-32 overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`}>
                    {exportSuggestions.map(sug => (
                      <div key={sug.empId} onClick={() => {
                        setExportEmployeeName(sug.fullName);
                        setSelectedExportEmployee(sug);
                        setExportSuggestions([]);
                      }}
                      className={`p-2 text-sm cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                      >
                        {sug.fullName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button
                onClick={handleDownload}
                className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <FaFileExcel className="text-sm" />
                Download Report
              </button>
           </div>
         </div>
      )}
    </div>
  );
};

export default TrackEmployee;
