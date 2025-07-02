import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebaseService from '../../services/firebaseService';

const FCMTest = () => {
  const [userData, setUserData] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testNotificationPermission = async () => {
    try {
      const permission = await firebaseService.requestPermission();
      if (permission) {
        addResult('Notification Permission', 'SUCCESS', 'Permission granted');
        toast.success('Notification permission granted!');
        return true;
      } else {
        addResult('Notification Permission', 'FAILED', 'Permission denied');
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      addResult('Notification Permission', 'ERROR', error.message);
      toast.error('Permission check failed: ' + error.message);
      return false;
    }
  };

  const testTokenGeneration = async () => {
    try {
      const token = await firebaseService.generateToken();
      if (token) {
        setFcmToken(token);
        addResult('Token Generation', 'SUCCESS', `Token: ${token.substring(0, 30)}...`);
        toast.success('FCM token generated successfully!');
        return token;
      } else {
        addResult('Token Generation', 'FAILED', 'No token returned');
        toast.error('Failed to generate FCM token');
        return null;
      }
    } catch (error) {
      addResult('Token Generation', 'ERROR', error.message);
      toast.error('Token generation failed: ' + error.message);
      return null;
    }
  };

  const testTokenRegistration = async () => {
    if (!userData) {
      addResult('Token Registration', 'FAILED', 'No user data available');
      toast.error('No user data available');
      return false;
    }

    try {
      const userType = userData.role === 'SUB_ADMIN' || userData.role === 'SUBADMIN' ? 'SUBADMIN' : 'EMPLOYEE';
      const success = await firebaseService.registerTokenWithBackend(userData.id, userType);
      
      if (success) {
        addResult('Token Registration', 'SUCCESS', `Registered for user ${userData.id} as ${userType}`);
        toast.success('FCM token registered with backend!');
        return true;
      } else {
        addResult('Token Registration', 'FAILED', 'Backend registration failed');
        toast.error('Failed to register token with backend');
        return false;
      }
    } catch (error) {
      addResult('Token Registration', 'ERROR', error.message);
      toast.error('Token registration failed: ' + error.message);
      return false;
    }
  };

  const testNotificationListener = () => {
    try {
      firebaseService.setupForegroundMessageListener();
      addResult('Notification Listener', 'SUCCESS', 'Listener setup complete');
      toast.success('Notification listener setup complete!');
      
      // Test with a mock notification
      setTimeout(() => {
        const mockPayload = {
          notification: {
            title: 'Test Notification',
            body: 'This is a test notification from FCM Test'
          },
          data: {
            type: 'TEST',
            message: 'FCM test successful'
          }
        };
        
        const event = new CustomEvent('firebaseNotification', { detail: mockPayload });
        window.dispatchEvent(event);
        
        addResult('Mock Notification', 'SUCCESS', 'Mock notification dispatched');
      }, 1000);
      
      return true;
    } catch (error) {
      addResult('Notification Listener', 'ERROR', error.message);
      toast.error('Listener setup failed: ' + error.message);
      return false;
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('FCM Test Suite', 'STARTED', 'Beginning comprehensive FCM test...');
    
    // Test 1: Permission
    const permissionOk = await testNotificationPermission();
    if (!permissionOk) {
      setIsLoading(false);
      return;
    }
    
    // Test 2: Token Generation
    const token = await testTokenGeneration();
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    // Test 3: Token Registration
    const registrationOk = await testTokenRegistration();
    if (!registrationOk) {
      setIsLoading(false);
      return;
    }
    
    // Test 4: Listener Setup
    testNotificationListener();
    
    addResult('FCM Test Suite', 'COMPLETED', 'All tests completed successfully!');
    toast.success('FCM test suite completed successfully!');
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setFcmToken(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>FCM Notification Test</h2>
      
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
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={runFullTest}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isLoading ? '#cbd5e0' : '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Running Tests...' : 'Run Full FCM Test'}
        </button>
        
        <button
          onClick={testNotificationPermission}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test Permission
        </button>
        
        <button
          onClick={testTokenGeneration}
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ed8936',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Generate Token
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

      {fcmToken && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#e6fffa', 
          borderRadius: '0.5rem',
          border: '1px solid #81e6d9'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#234e52' }}>Generated FCM Token:</h3>
          <p style={{ 
            wordBreak: 'break-all', 
            fontSize: '0.875rem', 
            fontFamily: 'monospace',
            backgroundColor: 'white',
            padding: '0.5rem',
            borderRadius: '0.25rem'
          }}>
            {fcmToken}
          </p>
        </div>
      )}

      <div style={{ 
        border: '1px solid #e2e8f0', 
        borderRadius: '0.5rem', 
        backgroundColor: '#fff',
        maxHeight: '500px',
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
            No tests run yet. Click "Run Full FCM Test" to begin.
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
                    result.status === 'ERROR' ? '#fed7d7' :
                    '#e6fffa',
                  border: `1px solid ${
                    result.status === 'SUCCESS' ? '#9ae6b4' :
                    result.status === 'FAILED' ? '#feb2b2' :
                    result.status === 'ERROR' ? '#feb2b2' :
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
                      result.status === 'ERROR' ? '#e53e3e' :
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

export default FCMTest;
