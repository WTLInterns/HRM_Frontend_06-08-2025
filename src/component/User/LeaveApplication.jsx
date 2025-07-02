import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebaseService from '../../services/firebaseService';
import './LeaveApplication.css';

const LeaveApplication = () => {
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

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

  const validateForm = () => {
    if (!formData.fromDate) {
      toast.error('Please select start date');
      return false;
    }
    if (!formData.toDate) {
      toast.error('Please select end date');
      return false;
    }
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for leave');
      return false;
    }
    
    // Check if end date is after start date
    const startDate = new Date(formData.fromDate);
    const endDate = new Date(formData.toDate);
    if (endDate < startDate) {
      toast.error('End date cannot be before start date');
      return false;
    }

    return true;
  };

  const getFCMTokens = async () => {
    try {
      // Get current user's FCM token (for usertoken)
      const userToken = await firebaseService.generateToken();
      console.log('🔍 Employee generating FCM token:', userToken?.substring(0, 20) + '...');

      // Get subadmin's FCM token from userData
      let subadminToken = userData?.subadmin?.fcmToken;
      console.log('🔍 Subadmin FCM token from userData:', subadminToken?.substring(0, 20) + '...');

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

      const leaveRequest = {
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason,
        status: 'Pending'
      };

      const apiUrl = `http://localhost:8282/api/leaveform/${userData.subadmin?.id}/${userData.empId}/${userToken}/${subadminToken}`;
      console.log('🚀 Submitting leave application to:', apiUrl);
      console.log('📝 Leave request data:', leaveRequest);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaveRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to submit leave application');
      }

      const result = await response.json();
      console.log('Leave application submitted:', result);
      
      toast.success('Leave application submitted successfully! Admin will be notified.');
      
      // Reset form
      setFormData({
        fromDate: '',
        toDate: '',
        reason: ''
      });

    } catch (error) {
      console.error('Error submitting leave application:', error);
      toast.error(error.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="leave-application-container">
        <div className="loading-message">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="leave-application-container">
      <div className="leave-application-card">
        <h2 className="leave-application-title">Apply for Leave</h2>
        
        <form onSubmit={handleSubmit} className="leave-application-form">
          <div className="form-group">
            <label htmlFor="fromDate" className="form-label">
              Start Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              className="form-input"
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

          <div className="form-group">
            <label htmlFor="toDate" className="form-label">
              End Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              className="form-input"
              required
              min={formData.fromDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason" className="form-label">
              Reason for Leave <span className="required">*</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Please provide the reason for your leave request..."
              rows="4"
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </div>
        </form>

        <div className="leave-info">
          <h3>Leave Application Guidelines:</h3>
          <ul>
            <li>Submit your leave application at least 2 days in advance</li>
            <li>Provide a clear reason for your leave request</li>
            <li>You will receive a notification once your request is reviewed</li>
            <li>Contact your supervisor for urgent leave requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;
