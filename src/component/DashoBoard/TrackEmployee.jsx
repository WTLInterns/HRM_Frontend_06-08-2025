import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { GoogleMap, Marker, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const containerStyle = {
  width: "100%",
  height: "400px",
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
  const [markerPosition, setMarkerPosition] = useState(null);
  const animationRef = useRef();
  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [followMarker, setFollowMarker] = useState(true); // Toggle for map following
  const markerIcon = {
    url: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png", // Use a custom/animated icon if you wish
    scaledSize: { width: 48, height: 48 },
    anchor: { x: 24, y: 48 }
  };


  // Smooth marker animation effect
  useEffect(() => {
    if (!location || !location.lat || !location.lng) return;

    // If it's the first time, set marker and map directly
    if (!markerPosition) {
      setMarkerPosition({ lat: location.lat, lng: location.lng });
      setMapCenter({ lat: location.lat, lng: location.lng });
      return;
    }

    // Animate marker from previous to new location
    const duration = 1200; // ms for smoother effect
    const frameRate = 60;
    const frameCount = Math.round((duration / 1000) * frameRate);
    const startLat = markerPosition.lat;
    const startLng = markerPosition.lng;
    const endLat = location.lat;
    const endLng = location.lng;
    let frame = 0;
    cancelAnimationFrame(animationRef.current);

    function animate() {
      frame++;
      const t = Math.min(1, frame / frameCount);
      // Ease-in-out for smoother animation
      const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      const newLat = startLat + (endLat - startLat) * ease;
      const newLng = startLng + (endLng - startLng) * ease;
      setMarkerPosition({ lat: newLat, lng: newLng });
      if (followMarker) setMapCenter({ lat: newLat, lng: newLng });
      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }
    animate();
    // Don't reset markerPosition or mapCenter anywhere else on update!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const stompClientRef = useRef(null); // For WebSocket client
  const { isDarkMode } = useApp();
  const [employeeName, setEmployeeName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [lastAddress, setLastAddress] = useState("");

  // Google Maps API Loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCelDo4I5cPQ72TfCTQW-arhPZ7ALNcp8w"
  });

  // Fetch employee list on mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const subAdminId = user?.id;
      if (subAdminId) {
        axios
          .get(`http://localhost:8282/api/employee/${subAdminId}/employee/all`)
          .then(res => {
            setEmployeeList(res.data || []);
          })
          .catch(() => setEmployeeList([]));
      }
    }
  }, []);

  // Autocomplete logic (from SalarySlip.jsx)
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
    const startsWith = [];
    const endsWith = [];
    const includes = [];
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    setSuggestions([...startsWith, ...endsWith, ...includes].slice(0, 10));
  }, [employeeName, employeeList]);

  // Fetch employee location (initial fetch, then rely on WebSocket)
  const handleTrack = async (emp) => {
    setError("");
    setLocation(null);
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const subadminId = user?.id;
      if (!subadminId) throw new Error("No subadmin session");
      // Use the correct endpoint for location fetch
      const locRes = await axios.get(
        `http://localhost:8282/api/employee/${subadminId}/employee/${emp.empId}/location`
      );
      if (!locRes.data || !locRes.data.latitude || !locRes.data.longitude) {
        throw new Error("No location data available for this employee");
      }
      const lat = parseFloat(locRes.data.latitude);
      const lng = parseFloat(locRes.data.longitude);
      const lastLat = locRes.data.lastLatitude ? parseFloat(locRes.data.lastLatitude) : null;
      const lastLng = locRes.data.lastLongitude ? parseFloat(locRes.data.lastLongitude) : null;
      setLocation({
        lat,
        lng,
        empName: emp.fullName,
        lastLat,
        lastLng
      });
      // Reverse geocode for current location
      fetchAddress(lat, lng, setAddress);
      // Reverse geocode for last known location if present
      if (lastLat && lastLng) {
        fetchAddress(lastLat, lastLng, setLastAddress);
      } else {
        setLastAddress("");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const [wsStatus, setWsStatus] = useState("disconnected"); // Connection status for UI/debugging

  // Real-time WebSocket subscription with connection status and debug logs
  useEffect(() => {
    if (!selectedEmployee) return;
    const user = JSON.parse(localStorage.getItem("user"));
    const subadminId = user?.id;
    if (!subadminId) return;

    // Clean up previous connection
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.deactivate();
      console.log("Previous STOMP client deactivated.");
    }

    // Setup STOMP client
    const sock = new SockJS("http://localhost:8282/ws");
    const stompClient = new Client({
      webSocketFactory: () => sock,
      debug: (str) => console.log("STOMP:", str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      setWsStatus("connected");
      console.log("WebSocket connected. Subscribing to /topic/location/" + subadminId);
      // Subscribe to the topic for this subadmin
      stompClient.subscribe(`/topic/location/${subadminId}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          // Only update if the update is for the selected employee
          if (data.empId === selectedEmployee.empId) {
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);
            const lastLat = data.lastLatitude ? parseFloat(data.lastLatitude) : null;
            const lastLng = data.lastLongitude ? parseFloat(data.lastLongitude) : null;
            setLocation({
              lat,
              lng,
              empName: data.fullName,
              lastLat,
              lastLng
            });
            // Smooth animated marker movement
            if (markerPosition) {
              const duration = 900; // ms, adjust for smoothness
              const frameRate = 60;
              const frameCount = Math.round((duration / 1000) * frameRate);
              const startLat = markerPosition.lat;
              const startLng = markerPosition.lng;
              const endLat = lat;
              const endLng = lng;
              let frame = 0;
              cancelAnimationFrame(animationRef.current);
              function animate() {
                frame++;
                const t = Math.min(1, frame / frameCount);
                const newLat = startLat + (endLat - startLat) * t;
                const newLng = startLng + (endLng - startLng) * t;
                setMarkerPosition({ lat: newLat, lng: newLng });
                if (t < 1) {
                  animationRef.current = requestAnimationFrame(animate);
                }
              }
              animate();
            } else {
              setMarkerPosition({ lat, lng });
            }
            fetchAddress(lat, lng, setAddress);
            if (lastLat && lastLng) {
              fetchAddress(lastLat, lastLng, setLastAddress);
            } else {
              setLastAddress("");
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      setWsStatus("error");
      console.error("Broker reported error:", frame.headers["message"], frame.body);
    };
    stompClient.onWebSocketError = (event) => {
      setWsStatus("error");
      console.error("WebSocket error:", event);
    };
    stompClient.onDisconnect = () => {
      setWsStatus("disconnected");
      console.log("WebSocket disconnected.");
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    // Clean up on unmount or employee change
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
        console.log("STOMP client deactivated on cleanup.");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  // Automatically start tracking when selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee) {
      handleTrack(selectedEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  return (
    <div className={`w-full max-w-xl mx-auto p-6 rounded-lg shadow-lg mt-10 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}
      sm:p-4 sm:mt-6 md:p-6 md:mt-8 lg:mt-10`} style={{ boxSizing: 'border-box' }}>
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Track Employee Location</h2>
      <div className="mb-6">
        <div className="relative w-full">
          <input
            type="text"
            className={`w-full p-3 rounded-lg border text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none
              ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-300' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'}`}
            placeholder="Enter Employee Name"
            value={employeeName}
            onChange={e => {
              setEmployeeName(e.target.value);
              setSelectedEmployee(null);
              setLocation(null);
            }}
            autoComplete="off"
            style={{ minHeight: 48, fontSize: 18 }}
          />
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && !selectedEmployee && (
            <div className={`absolute left-0 right-0 z-30 w-full mt-1 border rounded-lg shadow-lg overflow-hidden
              ${isDarkMode ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-200'}`}
              style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {suggestions.map(sug => (
                <div
                  key={sug.empId}
                  className={`px-5 py-3 cursor-pointer text-lg transition-all duration-150
                    ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-100'}`}
                  style={{ minHeight: 48 }}
                  onClick={() => {
                    setEmployeeName(sug.fullName);
                    setSelectedEmployee(sug); // handleTrack will be called by useEffect below
                  }}
                >
                  {sug.fullName}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Live Tracking indicator and button logic */}
      {selectedEmployee && (
        <div className="flex items-center mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mr-2 animate-pulse">
            ● Live Tracking
          </span>
        </div>
      )}
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-4"
        disabled={!!selectedEmployee || loading}
        style={{ display: selectedEmployee ? 'none' : 'block' }}
        onClick={() => selectedEmployee && handleTrack(selectedEmployee)}
      >
        {loading ? "Tracking..." : "Track Location"}
      </button>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {location && isLoaded && markerPosition && (
        <div>
          <div className="mb-2 text-lg font-semibold text-gray-700">
            {location.empName ? `Current Location for ${location.empName}` : "Employee Location"}
          </div>
          <div className="flex items-center mb-2">
            <label className="mr-2 text-sm font-medium">Map follow marker:</label>
            <input type="checkbox" checked={followMarker} onChange={e => setFollowMarker(e.target.checked)} />
          </div>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter || { lat: location.lat, lng: location.lng }}
            zoom={16}
            options={{
              gestureHandling: "greedy",
              disableDefaultUI: false,
              clickableIcons: false,
              mapTypeControl: false,
            }}
          >
            {/* Smooth animated marker movement with custom icon */}
            <MarkerF
              position={markerPosition}
              icon={markerIcon}
              animation={window.google && window.google.maps ? window.google.maps.Animation.DROP : undefined}
            />
          </GoogleMap>
          <div className="mt-2 text-gray-700 text-sm">
            <div><b>Latitude:</b> {location.lat}</div>
            <div><b>Longitude:</b> {location.lng}</div>
            {address && (
              <div className="text-xs text-blue-500 mt-1">Current Address: {address}</div>
            )}
            {location.lastLat && location.lastLng && (
              <div>
                <div className="text-xs text-gray-500 mt-1">Last known: {location.lastLat}, {location.lastLng}</div>
                {lastAddress && (
                  <div className="text-xs text-blue-400 mt-1">Last Known Address: {lastAddress}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackEmployee;
