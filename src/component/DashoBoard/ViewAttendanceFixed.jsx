import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "./calendar-custom.css";
import "./animations.css";
import { FaCalendarAlt, FaUserCheck, FaSearch, FaTimes, FaDownload } from 'react-icons/fa';
import { exportAttendanceToExcel } from './excelExport';
import { toast } from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

export default function ViewAttendanceFixed() {
  const { t } = useTranslation();
  const { isDarkMode } = useApp();

  const [loggedUser, setLoggedUser] = useState(null);
  const [empFullName, setEmpFullName] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [empName, setEmpName] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tooltipContent, setTooltipContent] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Safe API base URL with localhost default
  let API_URL = import.meta.env?.VITE_API_URL;
  if (!API_URL || typeof API_URL !== 'string' || !/^https?:\/\//i.test(API_URL)) {
    API_URL = 'https://api.managifyhr.com';
  }

  // Format time helper
  const fmt = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string') {
      const v = val.trim();
      if (!v || v.toLowerCase() === 'null' || v === '00:00:00' || v === '00:00') return '-';
      const parts = v.split(':');
      if (parts.length >= 2) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
      return v;
    }
    try {
      const s = String(val);
      const parts = s.split(':');
      if (parts.length >= 2) return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
      return s || '-';
    } catch {
      return '-';
    }
  };

  // Today's attendance state + modal
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayModalOpen, setTodayModalOpen] = useState(false);
  const [todayDisplayDate, setTodayDisplayDate] = useState('');
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [selectedModalDate, setSelectedModalDate] = useState(null); // yyyy-MM-dd

  // Ensure employees are loaded before showing today's modal
  const ensureEmployeesLoaded = async () => {
    try {
      let user = loggedUser;
      if (!user) {
        const userData = localStorage.getItem('user');
        if (userData) user = JSON.parse(userData);
      }
      if (user && (!employeeList || employeeList.length === 0)) {
        const res = await axios.get(`${API_URL}/api/employee/${user.id}/employee/all`);
        setEmployeeList(res.data || []);
      }
    } catch (e) {
      console.error('Failed to ensure employees loaded', e);
    }
  };

  const handleDownloadAll = async (month) => {
    if (!loggedUser?.id) {
      toast.error(t('attendanceManagement.noSubadminFound'));
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/employee/${loggedUser.id}/attendance/download?month=${month}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading attendance report:', error);
      toast.error(t('attendanceManagement.failedToDownloadReport'));
    }
  };

  // Fetch monthly attendance and open modal
  const fetchTodayAttendance = async () => {
    if (!loggedUser?.id) {
      toast.error(t('attendanceManagement.noSubadminFound'));
      return;
    }
    setTodayLoading(true);
    await ensureEmployeesLoaded();
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const month = `${yyyy}-${mm}`; // yyyy-MM
      const todayStr = `${yyyy}-${mm}-${dd}`; // yyyy-MM-dd

      const res = await axios.get(`${API_URL}/api/employee/${loggedUser.id}/attendance/month?month=${month}`);
      const monthly = Array.isArray(res.data) ? res.data : [];
      setMonthlyAttendance(monthly);
      let todays = monthly.filter(r => ((r?.date ?? '').toString().trim().slice(0,10)) === todayStr);

      if (todays.length === 0 && monthly.length > 0) {
        const latestDate = monthly
          .map(r => (r?.date ?? '').toString().trim().slice(0,10))
          .filter(Boolean)
          .sort()
          .pop();
        if (latestDate) {
          todays = monthly.filter(r => (r?.date ?? '').toString().trim().slice(0,10) === latestDate);
          setTodayDisplayDate(latestDate);
          setSelectedModalDate(latestDate);
        } else {
          setTodayDisplayDate(todayStr);
          setSelectedModalDate(todayStr);
        }
      } else {
        setTodayDisplayDate(todayStr);
        setSelectedModalDate(todayStr);
      }
      setTodayAttendance(todays);
      setTodayModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
      toast.error(t('attendanceManagement.failedToLoadAttendanceData'));
    } finally {
      setTodayLoading(false);
    }
  };

  // Fetch logged-in subadmin and employee list
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedUser(user);
      axios
        .get(`${API_URL}/api/employee/${user.id}/employee/all`)
        .then(res => setEmployeeList(res.data))
        .catch(err => console.error("Failed to load employee list:", err));
    }
  }, []);

  // Compute autocomplete suggestions
  useEffect(() => {
    const query = empFullName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const list = employeeList.map(emp => ({ empId: emp.empId, fullName: `${emp.firstName} ${emp.lastName}` }));
    const startsWith = [];
    const endsWith = [];
    const includes = [];
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    setSuggestions([...startsWith, ...endsWith, ...includes]);
  }, [empFullName, employeeList]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleInputChange = (e) => setEmpFullName(e.target.value);

  const fetchAttendance = async () => {
    if (!empFullName.trim()) {
      setError(t('attendanceManagement.enterEmployeeFullName'));
      return;
    }
    if (!loggedUser?.id) {
      setError(t('attendanceManagement.noSubadminFound'));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const subadminId = loggedUser.id;
      const res = await axios.get(`${API_URL}/api/employee/${subadminId}/${selectedEmpId}/attendance`);
      setAttendanceData(res.data);
      setEmpName(res.data[0]?.employee?.firstName || "Employee");
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error(t('attendanceManagement.failedToLoadAttendanceData'));
      setError(`${t('attendanceManagement.errorFetchingAttendance')} ${err.message}`);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAttendance = () => {
    setEmpFullName("");
    setAttendanceData([]);
    setError("");
    setEmpName("");
    setSelectedDate(null);
    setSuggestions([]);
    setSelectedEmpId(null);
  };

  const handleMonthChange = ({ activeStartDate, view }) => {
    if (view === 'month') {
      setCurrentMonth(activeStartDate.getMonth());
      setCurrentYear(activeStartDate.getFullYear());
    }
  };

  const handleDateClick = (value) => {
    const d = new Date(value);
    d.setHours(12,0,0,0);
    const dateStr = d.toISOString().split('T')[0];
    const record = attendanceData.find(i => i.date === dateStr) || {};
    setSelectedDate(dateStr);
    setTooltipContent(record);
    if (["Absent", "Leave", "Paid Leave"].includes(record.status)) {
      setShowDetailModal(true);
    } else {
      setShowDetailModal(false);
    }
  };

  const statusColors = {
    'Present': 'bg-green-600 text-white',
    'Absent': 'bg-red-700 text-white',
    'Half-Day': 'bg-yellow-700 text-white',
    'Paid Leave': 'bg-purple-800 text-white',
    'Week Off': 'bg-blue-800 text-white',
    'Holiday': isDarkMode ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-800',
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const d = new Date(date);
      d.setHours(12,0,0,0);
      const dateStr = d.toISOString().split('T')[0];
      const rec = attendanceData.find(i => i.date === dateStr);
      const isSaturday = d.getDay() === 6;
      const isSunday = d.getDay() === 0;
      if ((isSaturday || isSunday) && !rec) return null;
      if (rec) {
        return (
          <div className={`w-full h-full p-1 ${statusColors[rec.status]}`}>
            <div className="text-xs font-bold">{rec.status}</div>
          </div>
        );
      }
      return null;
    }
    return null;
  };

  const filteredAttendanceData = attendanceData.filter(rec => {
    const d = new Date(rec.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const renderAttendanceSummary = (data) => {
    if (!data.length) return null;
    const counts = data.reduce((acc, rec) => {
      acc[rec.status] = (acc[rec.status] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {Object.entries(counts).map(([status, cnt]) => (
          <div key={status} className={`p-3 rounded-lg border ${statusColors[status] || 'border-gray-700'}`}>
            <div className="font-medium text-lg">{status}</div>
            <div className="text-2xl font-bold">{cnt}</div>
            <div className="text-xs text-gray-400">{t('attendanceManagement.days')}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-full lg:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 animate-fadeIn ${isDarkMode ? "bg-slate-800 text-gray-100" : "bg-white text-gray-900"}`}>
      {error && (
        <div className={`p-3 mb-4 rounded animate-shake ${isDarkMode ? "bg-red-700 text-white" : "bg-red-200 text-red-900"}`}>{error}</div>
      )}

      {/* Search Section */}
      <div className={`${isDarkMode ? "bg-slate-800 border-blue-900" : "bg-blue-50 border-blue-200"} p-4 md:p-6 rounded-lg shadow-lg mb-6 md:mb-8 border animate-slideIn`}>
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
          <div className="basis-full sm:basis-auto sm:flex-1 relative">
            <input
              type="text"
              value={empFullName}
              onChange={handleInputChange}
              placeholder={t('attendanceManagement.enterEmployeeFullName')}
              className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDarkMode ? "bg-slate-700 border-gray-700 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
            {suggestions.length > 0 && (
              <ul className={`absolute z-10 w-full mt-1 rounded-lg max-h-60 overflow-auto border ${isDarkMode ? "bg-slate-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}>
                {suggestions.map(item => (
                  <li
                    key={item.empId}
                    onClick={() => { setEmpFullName(item.fullName); setSelectedEmpId(item.empId); setSuggestions([]); }}
                    className={`px-3 py-2 hover:${isDarkMode ? "bg-slate-700" : "bg-blue-100"} cursor-pointer ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
                  >{item.fullName}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className={`w-full sm:w-auto px-4 md:px-6 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${isDarkMode ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{t('attendanceManagement.loadingAttendance')}</span>
              </div>
            ) : (
              <><FaUserCheck /> {t('attendanceManagement.viewAttendanceTitle')}</>
            )}
          </button>
          <button
            onClick={fetchTodayAttendance}
            disabled={todayLoading}
            className={`w-full sm:w-auto px-3 py-2 rounded-md text-sm transition-all duration-200 ${isDarkMode ? 'bg-indigo-700 text-white hover:bg-indigo-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
            title={t('viewTodaysAttendance') || "View Today's Attendance"}
          >
            {todayLoading ? (t('attendanceManagement.loadingAttendance') || 'Loading...') : (t('Check Today Attendance') || 'View Today')}
          </button>

          <button
            onClick={() => setShowMonthPicker(true)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow transition-all duration-200 ${isDarkMode ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            <FaDownload /> {t('attendanceManagement.downloadAll')}
          </button>
          {attendanceData.length > 0 && (
            <button
              onClick={clearAttendance}
              className={`w-full sm:w-auto px-4 md:px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${isDarkMode ? "bg-gray-700 text_WHITE hover:bg-gray-600" : "bg-gray-300 text-gray-900 hover:bg-gray-200"}`}
            ><FaTimes /> {t('attendanceManagement.clear')}</button>
          )}
        </div>
      </div>

      {loading && (
        <div className={`text-center py-8 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>{t('attendanceManagement.loadingAttendance')}</div>
      )}
      {!loading && attendanceData.length > 0 && (
        <>
          <div className={`${isDarkMode ? "bg-slate-800 border-blue-900" : "bg-blue-50 border-blue-200"} p-4 md:p-6 rounded-lg shadow-lg border animate-slideIn`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className={`text-2xl font-semibold flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                <FaCalendarAlt className={isDarkMode ? "text-blue-400" : "text-blue-600"} /> {t('attendanceManagement.attendanceFor', { name: empName })}
              </h2>
              {attendanceData.length > 0 && (
                <button
                  onClick={() => {
                    let empObj = employeeList.find(e => e.empId === selectedEmpId);
                    if (!empObj) empObj = employeeList[0] || {};
                    exportAttendanceToExcel(filteredAttendanceData, empObj);
                  }}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow transition-all duration-200 ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  <FaDownload /> {t('attendanceManagement.exportToExcel')}
                </button>
              )}
            </div>
          </div>
          <Calendar
            value={null}
            onActiveStartDateChange={handleMonthChange}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            className={`${isDarkMode ? "dark-calendar bg-slate-800 text-gray-100 border-gray-700" : "light-calendar bg-white text-gray-900 border-gray-200"} rounded-lg w-full`}
            showNeighboringMonth={false}
          />
          {renderAttendanceSummary(filteredAttendanceData)}
          {showDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className={`rounded-lg shadow-lg border w-full max-w-xl p-6 ${isDarkMode ? "bg-slate-800 border-blue-900 text-gray-100" : "bg-white border-blue-300 text-gray-900"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold flex items_center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                    <FaCalendarAlt className={`${isDarkMode ? "text-blue-400" : "text-blue-600 animate-pulse"}`} /> {t('attendanceManagement.attendanceDetails', { date: formatDate(selectedDate) })}
                  </h3>
                  <button onClick={() => setShowDetailModal(false)} className="text-xl font-bold hover:text-red-500 transition-colors duration-200">&times;</button>
                </div>
                <div className={`p-4 rounded-lg border ${statusColors[tooltipContent.status]}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>{t('attendanceManagement.status')}</p>
                      <p className="font-semibold text-lg">{tooltipContent.status}</p>
                    </div>
                    <div className="space-y-2">
                      <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>{t('attendanceManagement.reason')}</p>
                      <p className="font-semibold text-lg">{tooltipContent.reason || t('attendanceManagement.noReason')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {todayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className={`w-full max-w-full sm:max-w-3xl lg:max-w-5xl rounded-xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold">
                {t('Check Attendance') || "Today's Attendance"}
              </h3>
              <button
                onClick={() => setTodayModalOpen(false)}
                className={`px-3 py-1 rounded-md text-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                aria-label="Close"
              >
                × Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {todayLoading ? (
                <div className="p-6">{t('attendanceManagement.loadingAttendance') || 'Loading attendance...'}</div>
              ) : (
                <div className="p-4">
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 lg:col-span-1">
                      <Calendar
                        value={selectedModalDate ? new Date(selectedModalDate) : new Date()}
                        onChange={(val) => {
                          const d = new Date(val);
                          d.setHours(12,0,0,0);
                          const iso = d.toISOString().split('T')[0];
                          setSelectedModalDate(iso);
                          setTodayDisplayDate(iso);
                          const dayRecs = (monthlyAttendance || []).filter(r => ((r?.date ?? '').toString().trim().slice(0,10)) === iso);
                          setTodayAttendance(dayRecs);
                        }}
                        className={`${isDarkMode ? "dark-calendar bg-slate-800 text-gray-100 border-gray-700" : "light-calendar bg_white text-gray-900 border-gray-200"} rounded-lg w-full`}
                        showNeighboringMonth={false}
                      />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-2">
                      <div className="overflow-x-auto -mx-2 sm:mx-0">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead>
                            <tr className={`${isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                              <th className="px-2 sm:px-3 py-2 text-left">Emp ID</th>
                              <th className="px-2 sm:px-3 py-2 text-left">Name</th>
                              <th className="px-2 sm:px-3 py-2 text-left">Punch In</th>
                              <th className="px-2 sm:px-3 py-2 text-left">Lunch In</th>
                              <th className="px-2 sm:px-3 py-2 text-left">Lunch Out</th>
                              <th className="px-2 sm:px-3 py-2 text-left">Punch Out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeList
                              .slice()
                              .sort((a,b) => (a.empId||0) - (b.empId||0))
                              .map((emp) => {
                                const rec = todayAttendance.find(r => (r?.employee?.empId ?? r?.empId) === emp.empId);
                                return (
                                  <tr key={emp.empId} className={`${isDarkMode ? 'border-slate-700' : 'border-gray-200'} border-t`}>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{emp.empId}</td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{fmt(rec?.punchInTime ?? rec?.punchIn)}</td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{fmt(rec?.lunchInTime ?? rec?.lunchPunchIn)}</td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{fmt(rec?.lunchOutTime ?? rec?.lunchPunchOut)}</td>
                                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{fmt(rec?.punchOutTime ?? rec?.punchOut)}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMonthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-0">
          <div className={`rounded-lg shadow-lg border w-full max-w-sm sm:max-w-md p-4 sm:p-6 ${isDarkMode ? "bg-slate-800 border-blue-900 text-gray-100" : "bg-white border-blue-300 text-gray-900"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                <FaCalendarAlt className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`} /> {t('attendanceManagement.selectMonth')}
              </h3>
              <button onClick={() => setShowMonthPicker(false)} className="text-xl font-bold hover:text-red-500 transition-colors duration-200">&times;</button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="month"
                className={`w-full p-2 rounded-lg ${isDarkMode ? "bg-slate-700 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
                onChange={(e) => {
                  handleDownloadAll(e.target.value);
                  setShowMonthPicker(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
