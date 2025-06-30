import React, { useState, useEffect } from "react";
import "../DashoBoard/animations.css";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
import axios from "axios";

const ViewAttendance = () => {
  const [empId, setEmpId] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setEmpId(e.target.value);
  };

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!empId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/public/getAllAttendace/${empId}`);
        
        if (response.data && response.data.length > 0) {
          setAttendanceData(response.data);
          calculateStats(response.data);
        } else {
          setAttendanceData([]);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [empId]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 animate-fadeIn page-container">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg transform transition duration-500 hover:shadow-2xl card">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105">
          <FaCalendarAlt className="text-blue-500 animate-float" />
          Search Attendance
        </h2>

        <div className="mb-6 transform transition duration-300 hover:translate-y-[-2px]">
          <label
            htmlFor="empId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Employee ID
          </label>
          <div className="relative">
            <input
              id="empId"
              type="number"
              className="block w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out hover:border-blue-300"
              value={empId}
              onChange={handleInputChange}
              placeholder="Enter Employee ID"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaSearch />
            </span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4 animate-pulse">{error}</p>}

        <div className="text-center">
          <button
            onClick={fetchAttendance}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transform transition duration-300 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px] relative overflow-hidden btn"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="loader mr-2"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <span>Search Attendance</span>
                <span className="absolute inset-0 bg-white opacity-20 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100"></span>
              </>
            )}
          </button>
        </div>

        {attendanceData.length > 0 && (
          <div className="mt-8 animate-slideIn">
            <h3 className="text-xl font-medium mb-4 text-gray-700 transform transition duration-300 hover:translate-x-1">Attendance Records:</h3>
            <div className="space-y-3">
              {attendanceData.map((attendance, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm transform transition duration-300 hover:translate-y-[-5px] hover:shadow-md hover:bg-blue-50 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-700">
                      <span className="text-gray-500">Date:</span> {attendance.date}
                    </p>
                    <p className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      attendance.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {attendance.status === 'present' ? 'Present' : 'Absent'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAttendance;
