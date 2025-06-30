import * as XLSX from 'xlsx';

export function exportAttendanceToExcel(attendanceData, employeeObj) {
  // Helper to format date as DD-MM-YYYY
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Sort attendanceData by date (ascending)
  const sortedAttendance = [...attendanceData].sort((a, b) => new Date(a.date) - new Date(b.date));
  // Prepare the data for Excel (only marked attendance)
  const formattedData = sortedAttendance.map((rec) => ({
    'Employee ID': rec.employee?.empId || employeeObj?.empId || '',
    'Employee Name': rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : (employeeObj ? `${employeeObj.firstName} ${employeeObj.lastName}` : ''),
    'Date': formatDate(rec.date),
    'Status': rec.status || '',
    'Reason': rec.reason || '',
    'Working Hours': rec.workingHours || '',
    'Break Duration': rec.breakDuration || '',
    'Punch In Time': rec.punchInTime || '',
    'Punch Out Time': rec.punchOutTime || '',
    'Lunch In Time': rec.lunchInTime || '',
    'Lunch Out Time': rec.lunchOutTime || '',
    'Work Type': rec.workType || '',
  }));

  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Style the header row: bold and black
  const headerNames = [
    'Employee ID',
    'Employee Name',
    'Date',
    'Status',
    'Reason',
    'Working Hours',
    'Break Duration',
    'Punch In Time',
    'Punch Out Time',
    'Lunch In Time',
    'Lunch Out Time',
    'Work Type',
  ];
  for (let c = 0; c < headerNames.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true, color: { rgb: "000000" } },
      };
    }
  }

  // Style only the cell value inside Status as red (not bold) for specified statuses
  const redStatuses = ['Paid Leave', 'Leave', 'Absent', 'Week Off', 'Holiday'];
  const statusCol = 3; // 'Status' is the 4th column (0-based index)
  for (let i = 0; i < attendanceData.length; i++) {
    const rec = attendanceData[i];
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: statusCol }); // +1 for header row
    if (!worksheet[cellRef]) continue;
    if (redStatuses.includes(rec.status)) {
      worksheet[cellRef].s = {
        font: { color: { rgb: "FF0000" }, bold: false }, // Red, NOT bold
      };
    } else {
      worksheet[cellRef].s = {
        font: { color: { rgb: "000000" }, bold: false }, // Default black, NOT bold
      };
    }
  }


  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 14 },  // Employee ID
    { wch: 24 },  // Employee Name
    { wch: 15 },  // Date
    { wch: 18 },  // Status
    { wch: 30 },  // Reason
    { wch: 16 },  // Working Hours
    { wch: 16 },  // Break Duration
    { wch: 16 },  // Punch In Time
    { wch: 16 },  // Punch Out Time
    { wch: 16 },  // Lunch In Time
    { wch: 16 },  // Lunch Out Time
    { wch: 14 },  // Work Type
  ];

  // Create a workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  // Generate Excel file and trigger download
  const fileName = `Attendance_${employeeObj?.firstName || 'Employee'}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

