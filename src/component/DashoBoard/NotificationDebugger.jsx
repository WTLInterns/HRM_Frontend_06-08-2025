import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import firebaseService from '../../services/firebaseService';

const NotificationDebugger = () => {
  const [userData, setUserData] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isListening, setIsListening] = useState(false);

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

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testFCMTokenGeneration = async () => {
    try {
      addTestResult('🔄 Testing FCM token generation...', 'info');
      const token = await firebaseService.generateToken();
      setFcmToken(token);
      addTestResult(`✅ FCM token generated: ${token.substring(0, 30)}...`, 'success');
    } catch (error) {
      addTestResult(`❌ FCM token generation failed: ${error.message}`, 'error');
    }
  };

  const testTokenRegistration = async () => {
    if (!userData || !fcmToken) {
      addTestResult('❌ Need user data and FCM token first', 'error');
      return;
    }

    try {
      addTestResult('🔄 Testing token registration with backend...', 'info');
      const userType = userData.role === 'SUB_ADMIN' ? 'SUBADMIN' : 'EMPLOYEE';
      await firebaseService.registerTokenWithBackend(userData.id || userData.empId, userType);
      addTestResult('✅ Token registered successfully with backend', 'success');
    } catch (error) {
      addTestResult(`❌ Token registration failed: ${error.message}`, 'error');
    }
  };

  const testNotificationListener = () => {
    if (isListening) {
      addTestResult('⚠️ Already listening for notifications', 'warning');
      return;
    }

    addTestResult('🔄 Setting up notification listener...', 'info');
    
    const handleTestNotification = (event) => {
      const payload = event.detail;
      addTestResult(`📱 Notification received: ${JSON.stringify(payload)}`, 'success');
      
      if (payload.notification) {
        addTestResult(`📢 Title: ${payload.notification.title}`, 'info');
        addTestResult(`📢 Body: ${payload.notification.body}`, 'info');
      }
      
      if (payload.data) {
        addTestResult(`📊 Data: ${JSON.stringify(payload.data)}`, 'info');
      }
    };

    window.addEventListener('firebaseNotification', handleTestNotification);
    firebaseService.setupForegroundMessageListener();
    setIsListening(true);
    addTestResult('✅ Notification listener active', 'success');
  };

  const testManualNotification = () => {
    addTestResult('🔄 Triggering manual test notification...', 'info');
    
    // Simulate a notification event
    const testPayload = {
      notification: {
        title: '📄 Test Resume Notification',
        body: 'Test User submitted a resume for Test Role position'
      },
      data: {
        type: 'RESUME_SUBMITTED',
        resumeId: '999',
        employeeId: '123',
        employeeName: 'Test User',
        jobRole: 'Test Role'
      }
    };

    const event = new CustomEvent('firebaseNotification', {
      detail: testPayload
    });
    window.dispatchEvent(event);
    addTestResult('✅ Manual notification dispatched', 'success');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runFullTest = async () => {
    clearResults();
    addTestResult('🚀 Starting full FCM notification test...', 'info');
    
    await testFCMTokenGeneration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTokenRegistration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testNotificationListener();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testManualNotification();
    
    addTestResult('🎉 Full test completed!', 'success');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>FCM Notification Debugger</h2>
      
      {userData && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f7fafc', 
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>Current User:</h3>
          <p><strong>Name:</strong> {userData.fullName || userData.name}</p>
          <p><strong>Role:</strong> {userData.role}</p>
          <p><strong>ID:</strong> {userData.empId || userData.id}</p>
          {fcmToken && (
            <p><strong>FCM Token:</strong> {fcmToken.substring(0, 50)}...</p>
          )}
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={testFCMTokenGeneration}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test FCM Token
        </button>
        
        <button
          onClick={testTokenRegistration}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test Registration
        </button>
        
        <button
          onClick={testNotificationListener}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ed8936',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test Listener
        </button>
        
        <button
          onClick={testManualNotification}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#9f7aea',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test Manual Notification
        </button>
        
        <button
          onClick={runFullTest}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#38b2ac',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Run Full Test
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

      <div style={{ 
        backgroundColor: '#1a202c', 
        color: '#e2e8f0', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.875rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#cbd5e0' }}>Test Results:</h3>
        {testResults.length === 0 ? (
          <p style={{ color: '#a0aec0' }}>No test results yet. Run a test to see output.</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '0.5rem',
              color: result.type === 'error' ? '#fc8181' : 
                     result.type === 'success' ? '#68d391' : 
                     result.type === 'warning' ? '#f6e05e' : '#e2e8f0'
            }}>
              <span style={{ color: '#a0aec0' }}>[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDebugger;
