import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';

const Resume = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const user = JSON.parse(localStorage.getItem("user"));
  
  useEffect(() => {
    const empId = userInfo?.empId || user?.id;
    if (empId) {
      fetchEmployees(empId);
    }
  }, []);

  const fetchEmployees = async (subadminId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8282/api/employee/${subadminId}/employee/all`);
      setEmployees(response.data);
    } catch (error) {
      toast.error("Error fetching employees: " + error.message);
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeResumes = async (empId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8282/api/resume/employee/${empId}`);
      setResumes(response.data || []);
    } catch (error) {
      toast.error("Error fetching resumes: " + error.message);
      console.error("Error fetching resumes:", error);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeResumes(employee.empId);
  };

  const handleDeleteClick = (resume) => {
    setResumeToDelete(resume);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:8282/api/resume/${resumeToDelete.resumeId}`);
      toast.success('Resume deleted successfully');
      setShowDeletePopup(false);
      setResumeToDelete(null);
      // Refresh the resumes list
      if (selectedEmployee) {
        fetchEmployeeResumes(selectedEmployee.empId);
      }
    } catch (error) {
      toast.error('Error deleting resume: ' + error.message);
      console.error('Error deleting resume:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
    setResumeToDelete(null);
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {t('navigation.resumeManagement')}
      </h2>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search employee by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Employee List */}
      <div className="max-w-3xl mx-auto mb-8">
        {selectedEmployee && (
          <button
            onClick={() => {
              setSelectedEmployee(null);
              setResumes([]);
            }}
            className="mb-4 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to All Employees
          </button>
        )}
        {loading && !selectedEmployee ? (
          <div className="text-center py-4">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">
            No employees found
          </div>
        ) : (
          <div className="space-y-3">
            {(selectedEmployee ? [selectedEmployee] : filteredEmployees).map((employee) => (
              <button
                key={employee.empId}
                onClick={() => handleEmployeeSelect(employee)}
                className={`w-full flex items-center justify-between p-4 rounded-lg ${
                  selectedEmployee?.empId === employee.empId
                    ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md'
                } transition-all duration-200`}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {employee.firstName} {employee.lastName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Employee ID: {employee.empId}
                    </p>
                  </div>
                </div>
                <div className="text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resume List */}
      {selectedEmployee && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Resumes - {selectedEmployee.firstName} {selectedEmployee.lastName}
          </h3>
          {loading ? (
            <div className="text-center py-4">Loading resumes...</div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
              No resumes uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.resumeId}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors duration-200"
                >
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Job Role:</span>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {resume.jobRole}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    File: {resume.resumeFileName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Uploaded: {new Date(resume.uploadDateTime).toLocaleDateString()}
                  </p>
                  <div className="flex justify-end space-x-2">
                    <a
                      href={`http://localhost:8282/uploads/resumes/${resume.resumeFileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
                    >
                      View Resume
                    </a>
                    <button
                      onClick={() => handleDeleteClick(resume)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this resume?
              <br />
              <span className="font-medium">
                {resumeToDelete?.resumeFileName}
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;
