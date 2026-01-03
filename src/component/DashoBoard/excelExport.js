import ExcelJS from 'exceljs';

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

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');

  // Add headers
  const headers = [
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
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF000000' } };
  });

  // Add data rows
  formattedData.forEach((rec, index) => {
    const row = worksheet.addRow(Object.values(rec));
    
    // Style the Status column (4th column, index 4 in 1-based index)
    const statusCell = row.getCell(4); // Status column
    const redStatuses = ['Paid Leave', 'Leave', 'Absent', 'Week Off', 'Holiday'];
    
    if (redStatuses.includes(rec.Status)) {
      statusCell.font = { color: { argb: 'FFFF0000' }, bold: false }; // Red, NOT bold
    } else {
      statusCell.font = { color: { argb: 'FF000000' }, bold: false }; // Default black, NOT bold
    }
  });

  // Set column widths for better readability
  worksheet.columns = [
    { width: 14 },  // Employee ID
    { width: 24 },  // Employee Name
    { width: 15 },  // Date
    { width: 18 },  // Status
    { width: 30 },  // Reason
    { width: 16 },  // Working Hours
    { width: 16 },  // Break Duration
    { width: 16 },  // Punch In Time
    { width: 16 },  // Punch Out Time
    { width: 16 },  // Lunch In Time
    { width: 16 },  // Lunch Out Time
    { width: 14 },  // Work Type
  ];

  // Generate Excel file and trigger download
  const fileName = `Attendance_${employeeObj?.firstName || 'Employee'}.xlsx`;
  
  // Generate buffer and create download
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  });
}

