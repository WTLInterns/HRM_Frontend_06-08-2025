import React, { useState, useEffect, useMemo, useRef } from "react";
import "./animations.css";
import { FaCheckCircle, FaTimes, FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar-custom.css";
import "./theme-calendar.css";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

export default function Attendance() {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  // ...existing states...
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDate, setPendingDate] = useState(null);
  const [reasonInput, setReasonInput] = useState("");
  const [reasonError, setReasonError] = useState("");

  // Time selection states
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeModalType, setTimeModalType] = useState(null); // 'punchIn', 'punchOut', 'lunchIn', 'lunchOut'
  const [selectedTime, setSelectedTime] = useState("");
  const [timeError, setTimeError] = useState("");
  const [currentTimeRecord, setCurrentTimeRecord] = useState(null);
  // Component States
  const [employeeName, setEmployeeName] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  // Ref to focus the employee name input after submit/reset
  const employeeInputRef = useRef(null);

  // Reset the entire form to initial state and focus employee input
  const resetForm = (options = {}) => {
    const { keepSubmitting = false } = options;
    setEmployeeName("");
    setSelectedEmpId(null);
    setSelectedDates([]);
    setAttendanceRecords([]);
    setSelectedDate(null);
    setShowStatusDropdown(false);
    setDropdownPosition({ x: 0, y: 0 });
    setSuggestions([]);
    setError(null);

    // Clear any transient modal/time/reason state
    setShowReasonModal(false);
    setPendingStatus(null);
    setPendingDate(null);
    setReasonInput("");
    setReasonError("");

    setShowTimeModal(false);
    setSelectedTime("");
    setTimeError("");
    setCurrentTimeRecord(null);
    setTimeModalType(null);

    if (!keepSubmitting) setSubmitting(false);

    // Return focus to the employee input
    setTimeout(() => employeeInputRef.current?.focus(), 0);
  };

  // Attendance statuses with translations - using useMemo to ensure updates on language change
  const statusOptions = useMemo(() => [
    { key: "Present", label: t('attendance.present') },
    { key: "Absent", label: t('attendance.absent') },
    { key: "Half-Day", label: t('attendance.halfDay') },
    { key: "Paid Leave", label: t('attendance.paidLeave') },
    { key: "Week Off", label: t('attendance.weekOff') },
    { key: "Holiday", label: t('attendance.holiday') }
  ], [t]);

  // Fetch employee list when component mounts
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const subAdminId = user?.id || 2;
      
      // Fetch employee list for autocomplete
      axios
        .get(`http://localhost:8081/api/employee/${subAdminId}/employee/all`)
        .then(res => {
          console.log("Loaded employee list:", res.data.length, "employees");
          setEmployeeList(res.data);
        })
        .catch(err => {
          console.error("Failed to load employee list:", err);
          toast.error("Failed to load employee list");
        });
    }
  }, []);

  // Compute autocomplete suggestions when employeeName changes
  useEffect(() => {
    const query = employeeName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    
    // Map employees to a simpler format for suggestions
    const list = employeeList.map(emp => ({
      empId: emp.empId,
      fullName: `${emp.firstName} ${emp.lastName}`
    }));
    
    // Sort suggestions by relevance (starts with > ends with > includes)
    const startsWith = [];
    const endsWith = [];
    const includes = [];
    
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    
    // Combine all matches with priority order
    setSuggestions([...startsWith, ...endsWith, ...includes].slice(0, 10)); // Limit to 10 suggestions
  }, [employeeName, employeeList]);

  // When the user selects dates via the calendar,
  // add new attendance records for dates not already selected.
  // New records are created without an id.
  useEffect(() => {
    const existingDates = attendanceRecords.map(record => record.date);
    const newDates = selectedDates.filter(date => !existingDates.includes(date));
    if (newDates.length > 0) {
      const newRecords = newDates.map(date => ({
        date,
        status: "Present", // Default status key
        employeeName: employeeName || ""
      }));
      setAttendanceRecords(prev => [...prev, ...newRecords]);
    }
  }, [selectedDates, employeeName, attendanceRecords]);

  // Format a date from yyyy-mm-dd to dd-mm-yyyy.
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Check existing attendance for a specific date and employee
  const checkExistingAttendance = async (empId, date) => {
    try {
      console.log(`Checking attendance for employee ID ${empId} on ${date}`);
      const response = await axios.get(`http://localhost:8081/api/employee/bulk/${empId}/${date}`);
      console.log('Existing attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking attendance:', error);
      return [];
    }
  };

  // Convert local date string to API format (YYYY-MM-DD)
  const formatDateForApi = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Open the status dropdown when a calendar cell is clicked.
  const handleTileClick = ({ date, view }, event) => {
    if (view === "month") {
      const clickedDate = new Date(date);
      clickedDate.setHours(12, 0, 0, 0);
      const dateStr = clickedDate.toISOString().split("T")[0];
      // Calculate dropdown position relative to the calendar.
      const rect = event.currentTarget.getBoundingClientRect();
      const calendarRect = event.currentTarget.closest(".react-calendar").getBoundingClientRect();
      setDropdownPosition({
        x: rect.left - calendarRect.left + rect.width / 2,
        y: rect.top - calendarRect.top + rect.height / 2
      });
      setSelectedDate(dateStr);
      setShowStatusDropdown(true);
    }
  };

  // Close the dropdown.
  const handleCloseDropdown = () => {
    setShowStatusDropdown(false);
  };

  // Handle status selection.
  const handleStatusSelect = async (status) => {
    // If status is 'Absent', 'Leave', or 'Paid Leave', show reason modal
    if (["Absent", "Leave", "Paid Leave"].includes(status)) {
      setPendingStatus(status);
      setPendingDate(selectedDate);
      setReasonInput("");
      setReasonError("");
      setShowStatusDropdown(false);
      setShowReasonModal(true);
      return;
    }
    // Otherwise, proceed as before
    await handleStatusWithReason(status, "");
  };


  // Handle time selection
  const handleTimeSelect = (timeType) => {
    if (!employeeName || employeeName.trim() === '' || !selectedEmpId) {
      toast.error(t('attendanceManagement.enterEmployeeNameFirst'), {
        duration: 3000,
        style: {
          background: '#FF5555',
          color: '#fff',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '10px',
        },
        icon: '🚫',
      });
      setShowStatusDropdown(false);
      return;
    }

    // Find existing record for this date
    const existingRecord = attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(12, 0, 0, 0);
      const clicked = new Date(selectedDate);
      clicked.setHours(12, 0, 0, 0);
      return recordDate.getTime() === clicked.getTime();
    });

    setCurrentTimeRecord(existingRecord);
    setTimeModalType(timeType);
    setSelectedTime("");
    setTimeError("");
    setShowStatusDropdown(false);
    setShowTimeModal(true);
  };

  // Handle time submission
  const handleTimeSubmit = async () => {
    if (!selectedTime || selectedTime.trim() === "") {
      setTimeError("Please select a time");
      return;
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(selectedTime)) {
      setTimeError("Please enter time in HH:mm format (24-hour)");
      return;
    }

    try {
      // Get the clicked date and convert to API format
      const clickedDate = new Date(selectedDate);
      clickedDate.setHours(12, 0, 0, 0);
      const apiFormattedDate = formatDateForApi(clickedDate);
      const formattedDateForDisplay = formatDate(clickedDate);

      // Get subadmin ID from localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const subAdminId = storedUser?.subAdminId || storedUser?.id || 2;

      // Check if attendance exists for this date
      const existingAttendance = await checkExistingAttendance(selectedEmpId, apiFormattedDate);

      // Prepare payload with time field
      const attendancePayload = [{
        date: apiFormattedDate,
        status: currentTimeRecord?.status || "Present",
        reason: currentTimeRecord?.reason || "",
        [timeModalType + "Time"]: selectedTime // e.g., punchInTime, punchOutTime
      }];

      // Include existing time fields to avoid overwriting them
      if (currentTimeRecord) {
        if (timeModalType !== 'punchIn' && currentTimeRecord.punchInTime) {
          attendancePayload[0].punchInTime = currentTimeRecord.punchInTime;
        }
        if (timeModalType !== 'punchOut' && currentTimeRecord.punchOutTime) {
          attendancePayload[0].punchOutTime = currentTimeRecord.punchOutTime;
        }
        if (timeModalType !== 'lunchIn' && currentTimeRecord.lunchInTime) {
          attendancePayload[0].lunchInTime = currentTimeRecord.lunchInTime;
        }
        if (timeModalType !== 'lunchOut' && currentTimeRecord.lunchOutTime) {
          attendancePayload[0].lunchOutTime = currentTimeRecord.lunchOutTime;
        }
      }

      let response;
      let updateUrl = `http://localhost:8081/api/employee/${subAdminId}/${selectedEmpId}/attendance/update/bulk`;
      let addUrl = `http://localhost:8081/api/employee/${subAdminId}/${selectedEmpId}/attendance/add/bulk`;

      if (existingAttendance && existingAttendance.length > 0) {
        // Attendance exists, use PUT to update
        attendancePayload[0].id = existingAttendance[0].id;

        response = await axios.put(
          updateUrl,
          attendancePayload,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        toast.success(`✅ Updated ${timeModalType?.replace(/([A-Z])/g, ' $1')?.toLowerCase() || 'time'} time to ${selectedTime} for ${formattedDateForDisplay}`, {
          duration: 3000,
          style: {
            background: '#2ecc71',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '10px',
          },
          icon: '⏰',
        });
      } else {
        // No attendance record exists, use POST to create
        response = await axios.post(
          addUrl,
          attendancePayload,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        toast.success(`✅ Created attendance with ${timeModalType?.replace(/([A-Z])/g, ' $1')?.toLowerCase() || 'time'} time ${selectedTime} for ${formattedDateForDisplay}`, {
          duration: 3000,
          style: {
            background: '#2ecc71',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '10px',
          },
          icon: '⏰',
        });
      }

      // Update local state
      const updatedRecord = response.data[0];
      setAttendanceRecords(prev => {
        const existingIndex = prev.findIndex(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(12, 0, 0, 0);
          const clicked = new Date(selectedDate);
          clicked.setHours(12, 0, 0, 0);
          return recordDate.getTime() === clicked.getTime();
        });

        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            [timeModalType + "Time"]: selectedTime,
            id: updatedRecord.id
          };
          return updated;
        } else {
          // Add new record
          setSelectedDates(prevDates => {
            if (prevDates.find(d => {
              const prevDate = new Date(d);
              prevDate.setHours(12, 0, 0, 0);
              const clicked = new Date(selectedDate);
              clicked.setHours(12, 0, 0, 0);
              return prevDate.getTime() === clicked.getTime();
            })) {
              return prevDates;
            }
            return [...prevDates, selectedDate];
          });

          return [...prev, {
            date: selectedDate,
            status: "Present",
            employeeName,
            id: updatedRecord.id,
            [timeModalType + "Time"]: selectedTime
          }];
        }
      });

      setShowTimeModal(false);
      setSelectedTime("");
      setTimeError("");
      setCurrentTimeRecord(null);
      setTimeModalType(null);

    } catch (error) {
      console.error('Error updating time:', error);
      const errorMessage = error.response?.data || error.message;
      toast.error(`Failed to update time: ${errorMessage}`);
      setTimeError("Failed to update time. Please try again.");
    }
  };

  // Handle status selection with reason (for both normal and modal)
  const handleStatusWithReason = async (status, reason) => {
    if (!employeeName || employeeName.trim() === '' || !selectedEmpId) {
      toast.error(t('attendanceManagement.enterEmployeeNameFirst'), {
        duration: 3000,
        style: {
          background: '#FF5555',
          color: '#fff',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '10px',
        },
        icon: '🚫',
      });
      setShowStatusDropdown(false);
      return;
    }
    
    // Get the clicked date and convert to API format
    const clickedDate = new Date(selectedDate);
    clickedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const apiFormattedDate = formatDateForApi(clickedDate);
    const formattedDateForDisplay = formatDate(clickedDate);
    
    try {
      // Get subadmin ID from localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const subAdminId = storedUser?.subAdminId || storedUser?.id || 2;
      console.log('User data:', storedUser);
      console.log('Using subAdmin ID:', subAdminId);
      
      console.log(`Employee ID: ${selectedEmpId}`);
      console.log(`Date: ${apiFormattedDate}`);
      
      // First check if attendance exists for this date
      const existingAttendance = await checkExistingAttendance(selectedEmpId, apiFormattedDate);
      
      // Find existing record to preserve time fields
      const existingRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(12, 0, 0, 0);
        const clicked = new Date(selectedDate);
        clicked.setHours(12, 0, 0, 0);
        return recordDate.getTime() === clicked.getTime();
      });

      // Prepare payload
      const attendancePayload = [{
        date: apiFormattedDate,
        status: status,
        reason: reason || ""
      }];

      // Include existing time fields if they exist
      if (existingRecord) {
        if (existingRecord.punchInTime) attendancePayload[0].punchInTime = existingRecord.punchInTime;
        if (existingRecord.punchOutTime) attendancePayload[0].punchOutTime = existingRecord.punchOutTime;
        if (existingRecord.lunchInTime) attendancePayload[0].lunchInTime = existingRecord.lunchInTime;
        if (existingRecord.lunchOutTime) attendancePayload[0].lunchOutTime = existingRecord.lunchOutTime;
      }
      
      console.log('Initial payload:', attendancePayload);
      
      let response;
      let existingStatus = '';
      let updateUrl = `http://localhost:8081/api/employee/${subAdminId}/${selectedEmpId}/attendance/update/bulk`;
      let addUrl = `http://localhost:8081/api/employee/${subAdminId}/${selectedEmpId}/attendance/add/bulk`;
      
      if (existingAttendance && existingAttendance.length > 0) {
        // Attendance exists, use PUT to update
        console.log('Found existing attendance:', existingAttendance);
        existingStatus = existingAttendance[0].status;
        
        // Include the id from existing attendance
        attendancePayload[0].id = existingAttendance[0].id;
        
        console.log('PUT URL:', updateUrl);
        console.log('PUT payload:', JSON.stringify(attendancePayload));
        
        response = await axios.put(
          updateUrl,
          attendancePayload,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        console.log('PUT response:', response);
        
        if (existingStatus === status) {
          toast(`Attendance for ${formattedDateForDisplay} is already marked as "${status}"`, {
            duration: 3000,
            style: {
              background: '#3498db',
              color: '#fff',
              padding: '16px',
              borderRadius: '10px',
            },
            icon: 'ℹ️',
          });
        } else {
          toast.success(`Updated attendance for ${formattedDateForDisplay} from "${existingStatus}" to "${status}"`, {
            duration: 3000,
            style: {
              background: '#2ecc71',
              color: '#fff',
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '10px',
            },
            icon: '✅',
          });
        }
        
        // Update the local state with the updated record
        const recordToUpdate = attendanceRecords.find(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(12, 0, 0, 0);
          const clicked = new Date(selectedDate);
          clicked.setHours(12, 0, 0, 0);
          return recordDate.getTime() === clicked.getTime();
        });
        
        if (recordToUpdate) {
          console.log('Found record to update in state:', recordToUpdate);
          setAttendanceRecords(prev =>
            prev.map(record => {
              const recordDate = new Date(record.date);
              recordDate.setHours(12, 0, 0, 0);
              const clicked = new Date(selectedDate);
              clicked.setHours(12, 0, 0, 0);

              if (recordDate.getTime() === clicked.getTime()) {
                console.log('Updating record state:', { ...record, status, reason: reason || record.reason });
                return {
                  ...record,
                  status,
                  reason: reason || record.reason,
                  // Preserve existing time fields
                  punchInTime: record.punchInTime,
                  punchOutTime: record.punchOutTime,
                  lunchInTime: record.lunchInTime,
                  lunchOutTime: record.lunchOutTime
                };
              }
              return record;
            })
          );
        } else {
          // If not found in state, add it
          console.log('Adding updated record to state');
          setSelectedDates(prev => {
            if (prev.find(d => {
              const prevDate = new Date(d);
              prevDate.setHours(12, 0, 0, 0);
              const clicked = new Date(selectedDate);
              clicked.setHours(12, 0, 0, 0);
              return prevDate.getTime() === clicked.getTime();
            })) {
              return prev;
            }
            return [...prev, selectedDate];
          });
          
          setAttendanceRecords(prev => [
            ...prev,
            {
              date: selectedDate,
              status,
              employeeName,
              id: existingAttendance[0].id
            }
          ]);
        }
      } else {
        // No attendance record exists, use POST to create
        console.log('No existing attendance found, creating with POST');
        console.log('POST URL:', addUrl);
        console.log('POST payload:', JSON.stringify(attendancePayload));
        
        response = await axios.post(
          addUrl,
          attendancePayload,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        console.log('POST response:', response);
        
        toast.success(`Marked new attendance as "${status}" for ${formattedDateForDisplay}`);
        
        // Add the new record to state
        if (response.data && response.data.length > 0) {
          const newRecord = response.data[0];
          console.log('Adding new record to state:', newRecord);
          
          setSelectedDates(prev => {
            if (prev.find(d => {
              const prevDate = new Date(d);
              prevDate.setHours(12, 0, 0, 0);
              const clicked = new Date(selectedDate);
              clicked.setHours(12, 0, 0, 0);
              return prevDate.getTime() === clicked.getTime();
            })) {
              return prev;
            }
            return [...prev, selectedDate];
          });
          
          setAttendanceRecords(prev => [
            ...prev,
            {
              date: selectedDate,
              status,
              employeeName,
              id: newRecord.id,
              reason: reason || "",
              // Include time fields from the response if they exist
              punchInTime: newRecord.punchInTime,
              punchOutTime: newRecord.punchOutTime,
              lunchInTime: newRecord.lunchInTime,
              lunchOutTime: newRecord.lunchOutTime
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error managing attendance:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error details:', error.message);
      }
      
      const errorMessage = error.response?.data || error.message;
      toast.error(`Failed to manage attendance: ${errorMessage}`);
    }
    
    setShowStatusDropdown(false);
  };

  // Remove a selected date.
  const handleRemoveDate = (dateToRemove) => {
    setSelectedDates(prev => prev.filter(date => date !== dateToRemove));
    setAttendanceRecords(prev => prev.filter(record => record.date !== dateToRemove));
  };

  // Clear all selected dates.
  const handleCancelAll = () => {
    setSelectedDates([]);
    setAttendanceRecords([]);
  };

  // Validate that employeeName and at least one date are provided.
  const validateForm = () => {
    if (!employeeName || employeeName.trim() === "") {
      setError(t('attendanceManagement.enterEmployeeFullName'));
      toast.error(t('attendanceManagement.enterEmployeeNameFirst'), {
        duration: 4000,
        style: {
          background: '#FF5555',
          color: '#fff',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '10px',
        },
        icon: '🚫',
      });
      return false;
    }
    if (selectedDates.length === 0) {
      setError(t('attendanceManagement.selectAtLeastOneDate'));
      toast.error(t('attendanceManagement.selectAtLeastOneDate'), {
        duration: 4000,
        style: {
          background: '#FF5555',
          color: '#fff',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '10px',
        },
        icon: '📅',
      });
      return false;
    }
    setError(null);
    return true;
  };

  // On form submission, split the attendanceRecords into new and update records.
  // Remove any accidental id from new records, then send them to the backend.
  const handleSubmit = async (e) => {
    // Ensure all Absent/Leave/Paid Leave records have a reason
    for (const rec of attendanceRecords) {
      if (["Absent", "Leave", "Paid Leave"].includes(rec.status) && (!rec.reason || rec.reason.trim() === "")) {
        setError(t('attendanceManagement.reasonRequired', { status: rec.status, date: formatDate(rec.date) }));
        toast.error(`Reason required for ${rec.status} on ${formatDate(rec.date)}`);
        return;
      }
    }
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Remove employeeName from records for backend payload
      const updatedRecords = attendanceRecords.map(({employeeName, ...rest}) => ({...rest}));

      // Retrieve user details.
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const subAdminId = storedUser?.subAdminId || 2;
      const empIdForSubmit = selectedEmpId; // capture before UI reset

      const config = {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
        // NOTE: withCredentials removed to avoid CORS conflict.
      };

      // Check if we have any records that need bulk processing
      // Records created via time selection already have IDs and are saved to database
      // Only process records that don't have IDs (new status-only records) or records with status changes

      // Separate records into new (without id) and updated (with id) records.
      let newRecords = updatedRecords.filter(record => record.id === undefined);
      let updateRecords = updatedRecords.filter(record => record.id !== undefined);

      // For update records, only include those that have meaningful changes beyond just time data
      updateRecords = updateRecords.filter(record => {
        // If record has a status other than "Present" or has a reason, it needs to be updated
        return record.status !== "Present" || (record.reason && record.reason.trim() !== "");
      });

      // Ensure newRecords do not have an id.
      newRecords = newRecords.map(({ id, ...rest }) => rest);

      console.log("Payload for add bulk:", newRecords);
      console.log("Payload for update bulk:", updateRecords);

      // Check if there are any records to process
      if (newRecords.length === 0 && updateRecords.length === 0) {
        // Clear immediately and focus back to employee name
        resetForm();
        toast.success("All attendance records are already saved!", {
          duration: 3000,
          style: {
            background: '#2ecc71',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '10px',
          },
          icon: '✅',
        });
        setSubmitting(false);
        return;
      }

      const promises = [];
      // Use full backend URL.
      if (newRecords.length > 0) {
        promises.push(
          axios
            .post(
              `http://localhost:8081/api/employee/${subAdminId}/${empIdForSubmit}/attendance/add/bulk`,
              newRecords,
              config
            )
            .then(response => ({
              type: "add",
              records: newRecords,
              response: response.data
            }))
        );
      }
      if (updateRecords.length > 0) {
        promises.push(
          axios
            .put(
              `http://localhost:8081/api/employee/${subAdminId}/${empIdForSubmit}/attendance/update/bulk`,
              updateRecords,
              config
            )
            .then(response => ({
              type: "update",
              records: updateRecords,
              response: response.data
            }))
        );
      }

      // Immediately clear the UI while processing in background
      const selectedCountForStorage = selectedDates.length;
      localStorage.setItem("submittedDatesCount", selectedCountForStorage.toString());
      resetForm({ keepSubmitting: true });

      const results = await Promise.allSettled(promises);
      let successCount = 0;
      let hasError = false;
      
      results.forEach(result => {
        if (result.status === "fulfilled") {
          const { type, records } = result.value;
          if (type === "add" || type === "update") {
            successCount += records.length;
            // Show individual toasts only if there are few records
            if (records.length <= 3) {
              records.forEach(rec => {
                toast.success(`${type === 'add' ? 'Added' : 'Updated'} attendance for ${formatDate(rec.date)}: ${rec.status}`);
              });
            }
          }
        } else {
          hasError = true;
          console.error('Attendance error:', result.reason);
          // Don't show error toast as we'll show success for partial completion
        }
      });
      
      // Show a summary toast if there are many records
      if (successCount > 0) {
        const message = hasError
          ? `Successfully marked ${successCount} attendance records. Some records may need review.`
          : `Successfully marked attendance for ${successCount} dates`;
        toast.success(message, {
          duration: 5000,
          style: {
            background: '#2ecc71',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '10px',
          },
          icon: '🎉',
        });
      }

      setShowSuccessModal(true);
      localStorage.setItem("submittedDatesCount", selectedDates.length.toString());
      // Reset UI to initial state and focus employee name
      resetForm();
    } catch (err) {
      setSubmitting(false);
      console.error("Error marking attendance:", err);
      if (err.response) {
        if (err.response.status === 403) {
          setError(t('attendanceManagement.accessDenied'));
        } else if (err.response.status === 401) {
          setError(t('attendanceManagement.unauthorized'));
        } else {
          setError(err.response.data || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError(t('attendanceManagement.networkError'));
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  // Define CSS classes for status coloring.
  const statusColors = {
    Present: "bg-green-900/30 border-green-700",
    Absent: "bg-red-900/30 border-red-700",
    "Half-Day": "bg-yellow-900/30 border-yellow-700",
    "Paid Leave": "bg-purple-900/30 border-purple-700",
    "Week Off": "bg-blue-900/30 border-blue-700",
    Holiday: "bg-pink-900/30 border-pink-700"
  };

  // Render attendance status on each calendar tile.
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const tileDate = new Date(date);
      tileDate.setHours(12, 0, 0, 0);
      const dateStr = tileDate.toISOString().split("T")[0];
      const record = attendanceRecords.find(r => r.date === dateStr);
      if (record) {
        const hasTimeData = record.punchInTime || record.punchOutTime || record.lunchInTime || record.lunchOutTime;
        return (
          <div className={`w-full h-full p-1 ${statusColors[record.status]} relative`}>
            <div className="text-xs font-bold">{record.status}</div>
            {hasTimeData && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" title="Has time data"></div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen animate-fadeIn`}>
      <Toaster position="top-right" toastOptions={{ className: 'react-hot-toast' }} />
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        <FaCalendarAlt className="inline-block mr-2" /> {t('navigation.markAttendance')}
      </h1>

      {/* Attendance Form */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-5 rounded-lg shadow-md border mb-8`}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">

            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                {t('employee.employeeName')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full p-2 border ${isDarkMode ? 'border-gray-700 bg-slate-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  placeholder={t('attendanceManagement.employeeNamePlaceholder')}
                  required
                  ref={employeeInputRef}
                />
                {suggestions.length > 0 && (
                  <ul className={`absolute z-10 w-full border mt-1 rounded-lg max-h-60 overflow-auto ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}>
                    {suggestions.map(item => (
                      <li
                        key={item.empId}
                        onClick={() => { 
                          setEmployeeName(item.fullName); 
                          setSelectedEmpId(item.empId);
                          setSuggestions([]); 
                        }}
                        className={`px-3 py-2 cursor-pointer ${isDarkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                      >
                        {item.fullName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="relative mt-4">
              <Calendar
                onClickDay={(value, event) => handleTileClick({ date: value, view: "month" }, event)}
                value={null}
                tileContent={tileContent}
                className={`${isDarkMode ? 'bg-slate-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-300'} rounded-lg w-full calendar-theme-${isDarkMode ? 'dark' : 'light'}`}
                showNeighboringMonth={false}
                tileClassName={({ date, view }) => {
                  if (view === 'month' && date.getDay() === 0) {
                    return 'sunday-cell';
                  }
                  return null;
                }}
              />

              {/* Status Dropdown */}
              {showStatusDropdown && (
                <div
                  className={`absolute z-50 ${isDarkMode ? 'bg-slate-700 border-gray-600' : 'bg-white border-gray-300'} rounded-lg shadow-xl border`}
                  style={{
                    top: `${dropdownPosition.y}px`,
                    left: `${dropdownPosition.x}px`,
                    transform: "translate(-50%, -50%)",
                    width: "220px"
                  }}
                >
                  <div className={`p-2 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} border-b text-center font-medium`}>
                    {formatDate(selectedDate)}
                  </div>

                  {/* Status Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {statusOptions.map(status => (
                      <button
                        key={status.key}
                        type="button"
                        className={`block w-full text-left px-4 py-2 ${isDarkMode ? 'hover:bg-slate-600 text-gray-100' : 'hover:bg-gray-100 text-gray-800'} ${
                          attendanceRecords.find(r => r.date === selectedDate)?.status === status.key
                            ? isDarkMode ? "bg-blue-600" : "bg-blue-500"
                            : ""
                        }`}
                        onClick={() => handleStatusSelect(status.key)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>

                  {/* Time Selection Section */}
                  <div className={`p-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-t`}>
                    <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Time Management
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => handleTimeSelect('punchIn')}
                        className={`text-xs py-1 px-2 rounded ${isDarkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-400 text-white'} transition`}
                      >
                        Punch In
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeSelect('punchOut')}
                        className={`text-xs py-1 px-2 rounded ${isDarkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-400 text-white'} transition`}
                      >
                        Punch Out
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeSelect('lunchOut')}
                        className={`text-xs py-1 px-2 rounded ${isDarkMode ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'} transition`}
                      >
                        Lunch Out
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeSelect('lunchIn')}
                        className={`text-xs py-1 px-2 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-400 text-white'} transition`}
                      >
                        Lunch In
                      </button>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div className={`p-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} border-t`}>
                    <button
                      type="button"
                      onClick={handleCloseDropdown}
                      className={`w-full py-1 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'} rounded transition flex items-center justify-center gap-1`}
                    >
                      <FaTimes className="text-xs" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Dates Summary - Moved to right side */}
          <div className="w-full md:w-1/3">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{t('attendance.selectedDates')}</h2>
            {selectedDates.length > 0 ? (
              <div className="space-y-4">
                <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('attendanceManagement.totalSelected')} {selectedDates.length}
                    </span>
                    <button
                      onClick={handleCancelAll}
                      className={`text-sm ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
                    >
                      {t('attendanceManagement.clearAll')}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.date}
                        className={`flex justify-between items-center p-2 rounded ${
                          isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-gray-50'
                        } shadow-sm`}
                      >
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {formatDate(record.date)}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {statusOptions.find(s => s.key === record.status)?.label || record.status}
                            {(["Absent", "Leave", "Paid Leave"].includes(record.status) && record.reason) && (
                              <span className="ml-2 italic text-yellow-600">{t('attendance.reason')}: {record.reason}</span>
                            )}
                          </div>
                          {/* Display time information */}
                          {(record.punchInTime || record.punchOutTime || record.lunchInTime || record.lunchOutTime) && (
                            <div className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              <div className="flex flex-wrap gap-2">
                                {record.punchInTime && (
                                  <span className={`px-1 rounded text-xs ${isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    In: {record.punchInTime}
                                  </span>
                                )}
                                {record.punchOutTime && (
                                  <span className={`px-1 rounded text-xs ${isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                    Out: {record.punchOutTime}
                                  </span>
                                )}
                                {record.lunchOutTime && (
                                  <span className={`px-1 rounded text-xs ${isDarkMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-100 text-orange-800'}`}>
                                    L-Out: {record.lunchOutTime}
                                  </span>
                                )}
                                {record.lunchInTime && (
                                  <span className={`px-1 rounded text-xs ${isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                    L-In: {record.lunchInTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveDate(record.date)}
                          className={`p-1 rounded-full ${
                            isDarkMode
                              ? 'hover:bg-slate-400 text-gray-300'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full py-2 px-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-400 text-white'
                  } transition duration-200 flex items-center justify-center gap-2`}
                >
                  {submitting ? (
                    <>{t('attendanceManagement.submitting')}</>
                  ) : (
                    <>
                      <FaCheckCircle /> {t('attendanceManagement.submitAttendance')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className={`text-center p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('attendanceManagement.noDateSelected')}
              </div>
            )}
          </div>
        </div>
      </div>
    {/* Reason Modal */}
    {showReasonModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
          <h2 className="text-lg font-bold mb-4">{t('attendanceManagement.enterReason')}</h2>
          <div className="mb-4">
            <label className="block mb-2 font-medium">{t('attendanceManagement.reasonFor')} {statusOptions.find(s => s.key === pendingStatus)?.label || pendingStatus}:</label>
            <textarea
              className={`w-full p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              rows={3}
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder={t('attendanceManagement.enterReasonPlaceholder')}
              autoFocus
            />
            {reasonError && <div className="text-red-500 text-sm mt-1">{reasonError}</div>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
              onClick={() => { setShowReasonModal(false); setPendingStatus(null); setPendingDate(null); setReasonInput(""); setReasonError(""); }}
            >
              {t('common.cancel')}
            </button>
            <button
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-400 text-white'}`}
              onClick={async () => {
                if (!reasonInput.trim()) {
                  setReasonError(t('attendanceManagement.reasonIsRequired'));
                  return;
                }
                setReasonError("");
                setShowReasonModal(false);
                // Call the real handler
                await handleStatusWithReason(pendingStatus, reasonInput.trim());
                // Update record in state with reason
                setAttendanceRecords(prev => prev.map(r => (r.date === pendingDate ? { ...r, status: pendingStatus, reason: reasonInput.trim() } : r)));
                setPendingStatus(null); setPendingDate(null); setReasonInput("");
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Time Selection Modal */}
    {showTimeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
          <h2 className="text-lg font-bold mb-4">
            Set {timeModalType === 'punchIn' ? 'Punch In' :
                 timeModalType === 'punchOut' ? 'Punch Out' :
                 timeModalType === 'lunchIn' ? 'Lunch In' : 'Lunch Out'} Time
          </h2>
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Select time for {formatDate(selectedDate)}:
            </label>
            <input
              type="time"
              className={`w-full p-3 rounded border text-lg ${isDarkMode ? 'bg-slate-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              autoFocus
              step="60" // Only allow minute precision
            />
            {timeError && <div className="text-red-500 text-sm mt-1">{timeError}</div>}

            {/* Show current times if they exist */}
            {currentTimeRecord && (
              <div className={`mt-3 p-3 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <div className="text-sm font-medium mb-2">Current Times:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {currentTimeRecord.punchInTime && (
                    <div>Punch In: <span className="font-mono">{currentTimeRecord.punchInTime}</span></div>
                  )}
                  {currentTimeRecord.punchOutTime && (
                    <div>Punch Out: <span className="font-mono">{currentTimeRecord.punchOutTime}</span></div>
                  )}
                  {currentTimeRecord.lunchOutTime && (
                    <div>Lunch Out: <span className="font-mono">{currentTimeRecord.lunchOutTime}</span></div>
                  )}
                  {currentTimeRecord.lunchInTime && (
                    <div>Lunch In: <span className="font-mono">{currentTimeRecord.lunchInTime}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
              onClick={() => {
                setShowTimeModal(false);
                setSelectedTime("");
                setTimeError("");
                setCurrentTimeRecord(null);
                setTimeModalType(null);
              }}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-400 text-white'}`}
              onClick={handleTimeSubmit}
            >
              Save Time
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}




