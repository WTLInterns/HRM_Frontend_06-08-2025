import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { GoogleMap, MarkerF, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { FaTimes, FaFileExcel } from "react-icons/fa";
import { toast } from "react-hot-toast";

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
  const [isTrackingAll, setIsTrackingAll] = useState(false);
  const [allEmployeeLocations, setAllEmployeeLocations] = useState([]);
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
      const res = await axios.get(`${API_URL}/location/${subadminId}/employee/locations`);
      const locations = res.data.map(loc => ({
        ...loc,
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude)
      }));
      setAllEmployeeLocations(locations);
      if (locations.length > 0) {
        setMapCenter({ lat: locations[0].lat, lng: locations[0].lng });
        setZoom(12);
      }
    } catch (err) {
      setError("Could not fetch employee locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTrackingAll) {
      handleTrackAll();
    }
  }, [isTrackingAll, handleTrackAll]);

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
        if (isTrackingAll) {
          setAllEmployeeLocations(prev =>
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
  }, [isTrackingAll, selectedEmployee]);

  const handleTrack = async (emp) => {
    // This function is now simplified as WebSocket handles updates
    setError("");
    setLocation(null);
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
      setLocation({ lat, lng, empName: emp.fullName });
      setMapCenter({ lat, lng });
      setZoom(16);
      fetchAddress(lat, lng, setAddress);
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
      <h2 className="text-3xl font-bold mb-4 text-blue-600">Track Employees</h2>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsTrackingAll(!isTrackingAll)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isTrackingAll 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-300 text-black'
            }`}
          >
            {isTrackingAll ? "Tracking All Employees" : "Track All Employees"}
          </button>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaFileExcel className="mr-2" />
          Export Data
        </button>
      </div>

      {!isTrackingAll && (
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
          {isTrackingAll
            ? allEmployeeLocations.map(emp => (
                <MarkerF
                  key={emp.empId}
                  position={{ lat: emp.lat, lng: emp.lng }}
                  label={`${emp.fullName} (ID: ${emp.empId})`}
                  onClick={() => setActiveMarker(emp.empId)}
                >
                  {activeMarker === emp.empId && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div>
                        <h4 className="font-bold">{emp.fullName}</h4>
                        <p>ID: {emp.empId}</p>
                        <p>Lat: {emp.lat.toFixed(6)}, Lng: {emp.lng.toFixed(6)}</p>
                      </div>
                    </InfoWindow>
                  )}
                </MarkerF>
              ))
            : location && (
                <MarkerF position={{ lat: location.lat, lng: location.lng }} />
              )}
        </GoogleMap>
      )}

      {!isTrackingAll && location && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
          <h3 className="font-bold text-lg">{location.empName}</h3>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lng}</p>
          <p className="text-sm text-gray-500">{address}</p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
           <div className={`p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">Export Location History</h3>
               <button onClick={() => setShowExportModal(false)}><FaTimes/></button>
             </div>
             
             <div className="flex space-x-4 mb-4">
                <button 
                  onClick={() => setExportCustomize(false)}
                  className={`px-4 py-2 rounded ${!exportCustomize ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  All Data
                </button>
                <button 
                  onClick={() => setExportCustomize(true)}
                  className={`px-4 py-2 rounded ${exportCustomize ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  Customize
                </button>
             </div>

            {exportCustomize && (
              <div className="relative w-full mb-4">
                <input
                  type="text"
                  placeholder="Enter employee name..."
                  value={exportEmployeeName}
                  onChange={(e) => setExportEmployeeName(e.target.value)}
                  className={`w-full p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-200 border-gray-300'}`}
                />
                {exportSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 z-10 w-full mt-1 border rounded shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`}>
                    {exportSuggestions.map(sug => (
                      <div key={sug.empId} onClick={() => {
                        setExportEmployeeName(sug.fullName);
                        setSelectedExportEmployee(sug);
                        setExportSuggestions([]);
                      }}
                      className={`p-2 cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
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
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download Report
              </button>
           </div>
         </div>
      )}
    </div>
  );
};

export default TrackEmployee;
