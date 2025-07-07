import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebaseService from '../../services/firebaseService';

const NotificationTest = () => {
  const [userData, setUserData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser && rawUser !== 'null') {
        const user = JSON.parse(rawUser);
        setUserData(user);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }, []);

  const addTestResult = (test, status, message) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testFCMTokenGeneration = async () => {
    try {
      const token = await firebaseService.generateToken();
      if (token) {
        addTestResult('FCM Token Generation', 'SUCCESS', `Token generated: ${token.substring(0, 20)}...`);
        return token;
      } else {
        addTestResult('FCM Token Generation', 'FAILED', 'No token returned');
        return null;
      }
    } catch (error) {
      addTestResult('FCM Token Generation', 'FAILED', error.message);
      return null;
    }
  };

  const testNotificationListener = () => {
    return new Promise((resolve) => {
      const testPayload = {
        notification: {
          title: 'Test Notification',
          body: 'This is a test notification for leave system'
        },
        data: {
          type: 'LEAVE_APPLIED',
          leaveId: '999',
          employeeId: '123',
          employeeName: 'Test Employee'
        }
      };

      const handleTestNotification = (event) => {
        if (event.detail === testPayload) {
          addTestResult('Notification Listener', 'SUCCESS', 'Listener responded to test notification');
          window.removeEventListener('firebaseNotification', handleTestNotification);
          resolve(true);
        }
      };

      window.addEventListener('firebaseNotification', handleTestNotification);

      // Simulate notification
      setTimeout(() => {
        const event = new CustomEvent('firebaseNotification', { detail: testPayload });
        window.dispatchEvent(event);
      }, 1000);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('firebaseNotification', handleTestNotification);
        addTestResult('Notification Listener', 'TIMEOUT', 'Listener did not respond within 5 seconds');
        resolve(false);
      }, 5000);
    });
  };

  const testLeaveApplicationAPI = async () => {
    if (!userData) {
      addTestResult('Leave Application API', 'FAILED', 'No user data available');
      return false;
    }

    try {
      const userToken = await firebaseService.generateToken();
      const subadminToken = userData.subadmin?.fcmToken || userToken;

      const testLeaveData = {
        fromDate: '2025-07-15',
        toDate: '2025-07-16',
        reason: 'Test leave application for notification system',
        status: 'Pending'
      };

      const response = await fetch(
        `https://api.managifyhr.com/api/leaveform/${userData.subadmin?.id || userData.id}/${userData.empId || userData.id}/${userToken}/${subadminToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testLeaveData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        addTestResult('Leave Application API', 'SUCCESS', `Leave created with ID: ${result.leaveId}`);
        return result;
      } else {
        const errorText = await response.text();
        addTestResult('Leave Application API', 'FAILED', `HTTP ${response.status}: ${errorText}`);
        return false;
      }
    } catch (error) {
      addTestResult('Leave Application API', 'FAILED', error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addTestResult('Test Suite', 'STARTED', 'Beginning notification system tests...');

    // Test 1: FCM Token Generation
    const token = await testFCMTokenGeneration();
    
    // Test 2: Notification Listener
    await testNotificationListener();
    
    // Test 3: Leave Application API (if user data available)
    if (userData) {
      await testLeaveApplicationAPI();
    } else {
      addTestResult('Leave Application API', 'SKIPPED', 'No user data available');
    }

    addTestResult('Test Suite', 'COMPLETED', 'All tests completed');
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>Notification System Test</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isRunning ? '#cbd5e0' : '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={clearResults}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      {userData && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f7fafc', 
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>User Info:</h3>
          <p><strong>Name:</strong> {userData.fullName || userData.name}</p>
          <p><strong>Role:</strong> {userData.role}</p>
          <p><strong>ID:</strong> {userData.empId || userData.id}</p>
          <p><strong>Subadmin ID:</strong> {userData.subadmin?.id || userData.id}</p>
        </div>
      )}

      <div style={{ 
        border: '1px solid #e2e8f0', 
        borderRadius: '0.5rem', 
        backgroundColor: '#fff',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f7fafc',
          fontWeight: 'bold'
        }}>
          Test Results
        </div>
        
        {testResults.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
            No tests run yet. Click "Run All Tests" to begin.
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: 
                    result.status === 'SUCCESS' ? '#f0fff4' :
                    result.status === 'FAILED' ? '#fed7d7' :
                    result.status === 'TIMEOUT' ? '#fef5e7' :
                    result.status === 'SKIPPED' ? '#edf2f7' :
                    '#e6fffa',
                  border: `1px solid ${
                    result.status === 'SUCCESS' ? '#9ae6b4' :
                    result.status === 'FAILED' ? '#feb2b2' :
                    result.status === 'TIMEOUT' ? '#f6e05e' :
                    result.status === 'SKIPPED' ? '#cbd5e0' :
                    '#81e6d9'
                  }`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <strong>{result.test}</strong>
                  <span style={{ 
                    fontSize: '0.875rem',
                    color: '#718096'
                  }}>
                    {result.timestamp}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: 
                      result.status === 'SUCCESS' ? '#38a169' :
                      result.status === 'FAILED' ? '#e53e3e' :
                      result.status === 'TIMEOUT' ? '#d69e2e' :
                      result.status === 'SKIPPED' ? '#718096' :
                      '#319795',
                    color: 'white'
                  }}>
                    {result.status}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>
                    {result.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTest;
