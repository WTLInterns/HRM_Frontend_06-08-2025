import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebaseService from '../../services/firebaseService';
import './ResumeUpload.css';

const ResumeUpload = () => {
  const [formData, setFormData] = useState({
    jobRole: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [jobRoles] = useState([
    "Java Full Stack",
    "Java Developer", 
    "MERN Developer",
    "MERN Full Stack",
    "Python Full Stack",
    "Python Developer",
    "Frontend Developer",
    "Backend Developer",
    "Flutter Developer",
    "React Native Developer",
    "Android Developer",
    "iOS Developer",
    "DevOps Engineer",
    "QA Engineer",
    "UI/UX Designer",
    "HR Executive",
    "Sales Executive",
    "Accountant",
    "Marketing",
    "Project Manager",
    "Business Analyst",
    "Data Scientist",
    "Data Analyst",
    "Product Manager"
  ]);

  // Get user data on component mount
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser && rawUser !== 'null') {
        const user = JSON.parse(rawUser);
        setUserData(user);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      toast.error('Please login again');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const validateForm = () => {
    if (!formData.jobRole.trim()) {
      toast.error('Please select a job role');
      return false;
    }
    if (!formData.file) {
      toast.error('Please select a resume file');
      return false;
    }
    return true;
  };

  const getFCMTokens = async () => {
    try {
      // Get current user's FCM token (employee)
      const userToken = await firebaseService.generateToken();
      
      // Get subadmin's FCM token from userData
      let subadminToken = userData?.subadmin?.fcmToken;
      if (!subadminToken) {
        console.log('⚠️ Subadmin FCM token not found, generating new one');
        subadminToken = await firebaseService.generateToken();
      }
      
      console.log('✅ Using Employee Token:', userToken?.substring(0, 20) + '...');
      console.log('✅ Using Subadmin Token:', subadminToken?.substring(0, 20) + '...');
      
      return { userToken, subadminToken };
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return { userToken: 'default_user_token', subadminToken: 'default_subadmin_token' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !userData) {
      return;
    }

    setLoading(true);
    
    try {
      const { userToken, subadminToken } = await getFCMTokens();
      
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('jobRole', formData.jobRole);

      const apiUrl = `http://localhost:8282/api/resume/upload/${userData.empId}/${userToken}/${subadminToken}`;
      console.log('🚀 Uploading resume to:', apiUrl);
      console.log('📝 Job role:', formData.jobRole);
      console.log('📄 File:', formData.file.name);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload resume');
      }

      const result = await response.json();
      console.log('Resume uploaded successfully:', result);
      
      toast.success('Resume uploaded successfully! Admin will be notified.');
      
      // Reset form
      setFormData({
        jobRole: '',
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('resume-file');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="resume-upload-container">
        <div className="loading-message">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="resume-upload-container">
      <div className="resume-upload-card">
        <h2 className="resume-upload-title">Upload Resume</h2>
        
        <form onSubmit={handleSubmit} className="resume-upload-form">
          <div className="form-group">
            <label htmlFor="jobRole" className="form-label">
              Job Role <span className="required">*</span>
            </label>
            <select
              id="jobRole"
              name="jobRole"
              value={formData.jobRole}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="">Select a job role</option>
              {jobRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="resume-file" className="form-label">
              Resume File <span className="required">*</span>
            </label>
            <input
              type="file"
              id="resume-file"
              name="file"
              onChange={handleFileChange}
              className="form-file-input"
              accept=".pdf,.doc,.docx"
              required
            />
            <div className="file-info">
              {formData.file ? (
                <div className="selected-file">
                  <span className="file-name">📄 {formData.file.name}</span>
                  <span className="file-size">({(formData.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div className="file-hint">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </form>

        <div className="upload-info">
          <h3>Resume Upload Guidelines:</h3>
          <ul>
            <li>Upload your latest resume in PDF or Word format</li>
            <li>File size should not exceed 10MB</li>
            <li>Select the appropriate job role you're applying for</li>
            <li>Admin will be notified once your resume is uploaded</li>
            <li>You can upload multiple resumes for different roles</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
