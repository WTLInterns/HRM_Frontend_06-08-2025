import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TokenDebugger = () => {
  const [userData, setUserData] = useState(null);
  const [leaveData, setLeaveData] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

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

  const fetchLeaveData = async () => {
    if (!userData) return;
    
    try {
      const response = await fetch(`http://localhost:8282/api/leaveform/${userData.id}/all`);
      if (!response.ok) throw new Error('Failed to fetch leave data');
      const data = await response.json();
      setLeaveData(data);
      toast.success(`Fetched ${data.length} leave records`);
    } catch (error) {
      toast.error('Failed to fetch leave data: ' + error.message);
    }
  };

  const analyzeTokens = (leave) => {
    setSelectedLeave(leave);
    
    const analysis = {
      leaveId: leave.leaveId,
      employeeInfo: {
        empId: leave.employee?.empId,
        fullName: leave.employee?.fullName,
        fcmToken: leave.employee?.fcmToken,
        fcmTokenPreview: leave.employee?.fcmToken?.substring(0, 30) + '...',
        fcmTokenUpdatedAt: leave.employee?.fcmTokenUpdatedAt
      },
      subadminInfo: {
        id: leave.subadmin?.id,
        name: leave.subadmin?.name,
        fcmToken: leave.subadmin?.fcmToken,
        fcmTokenPreview: leave.subadmin?.fcmToken?.substring(0, 30) + '...',
        fcmTokenUpdatedAt: leave.subadmin?.fcmTokenUpdatedAt
      },
      apiUrl: `http://localhost:8282/api/leaveform/${leave.subadmin?.id}/${leave.employee?.empId}/${leave.leaveId}/${leave.employee?.fcmToken}/${leave.subadmin?.fcmToken}`,
      tokenValidation: {
        employeeTokenValid: !!(leave.employee?.fcmToken && leave.employee.fcmToken.length > 50),
        subadminTokenValid: !!(leave.subadmin?.fcmToken && leave.subadmin.fcmToken.length > 50),
        bothTokensValid: !!(leave.employee?.fcmToken && leave.subadmin?.fcmToken)
      }
    };
    
    setTokenInfo(analysis);
    console.log('🔍 Token Analysis:', analysis);
  };

  const testNotificationAPI = async () => {
    if (!selectedLeave || !tokenInfo) {
      toast.error('Please select a leave record first');
      return;
    }

    try {
      const testPayload = {
        ...selectedLeave,
        status: 'Approved' // Test with approval
      };

      const response = await fetch(tokenInfo.apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Test notification API call successful!');
        console.log('✅ API Response:', result);
      } else {
        const errorText = await response.text();
        toast.error('API call failed: ' + errorText);
        console.error('❌ API Error:', errorText);
      }
    } catch (error) {
      toast.error('Test failed: ' + error.message);
      console.error('❌ Test Error:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>FCM Token Debugger</h2>
      
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
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={fetchLeaveData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Fetch Leave Data
        </button>
        
        {selectedLeave && (
          <button
            onClick={testNotificationAPI}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Test Notification API
          </button>
        )}
      </div>

      {leaveData.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#4a5568' }}>Leave Records ({leaveData.length}):</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {leaveData.map((leave) => (
              <div
                key={leave.leaveId}
                onClick={() => analyzeTokens(leave)}
                style={{
                  padding: '1rem',
                  border: selectedLeave?.leaveId === leave.leaveId ? '2px solid #4299e1' : '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: selectedLeave?.leaveId === leave.leaveId ? '#ebf8ff' : '#fff'
                }}
              >
                <div><strong>Leave ID:</strong> {leave.leaveId}</div>
                <div><strong>Employee:</strong> {leave.employee?.fullName}</div>
                <div><strong>Status:</strong> {leave.status}</div>
                <div><strong>Dates:</strong> {leave.fromDate} to {leave.toDate}</div>
                <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                  Employee Token: {leave.employee?.fcmToken ? '✅ Available' : '❌ Missing'}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  Subadmin Token: {leave.subadmin?.fcmToken ? '✅ Available' : '❌ Missing'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tokenInfo && (
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#f7fafc', 
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#4a5568' }}>Token Analysis for Leave ID: {tokenInfo.leaveId}</h3>
          
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '1rem', backgroundColor: '#e6fffa', borderRadius: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#234e52' }}>Employee Info:</h4>
              <div><strong>ID:</strong> {tokenInfo.employeeInfo.empId}</div>
              <div><strong>Name:</strong> {tokenInfo.employeeInfo.fullName}</div>
              <div><strong>Token Valid:</strong> {tokenInfo.tokenValidation.employeeTokenValid ? '✅ Yes' : '❌ No'}</div>
              <div style={{ fontSize: '0.875rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                <strong>Token:</strong> {tokenInfo.employeeInfo.fcmTokenPreview}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                <strong>Updated:</strong> {tokenInfo.employeeInfo.fcmTokenUpdatedAt}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#fef5e7', borderRadius: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#744210' }}>Subadmin Info:</h4>
              <div><strong>ID:</strong> {tokenInfo.subadminInfo.id}</div>
              <div><strong>Name:</strong> {tokenInfo.subadminInfo.name}</div>
              <div><strong>Token Valid:</strong> {tokenInfo.tokenValidation.subadminTokenValid ? '✅ Yes' : '❌ No'}</div>
              <div style={{ fontSize: '0.875rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                <strong>Token:</strong> {tokenInfo.subadminInfo.fcmTokenPreview}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                <strong>Updated:</strong> {tokenInfo.subadminInfo.fcmTokenUpdatedAt}
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: tokenInfo.tokenValidation.bothTokensValid ? '#f0fff4' : '#fed7d7',
            borderRadius: '0.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>
              Overall Status: {tokenInfo.tokenValidation.bothTokensValid ? '✅ Ready for Notifications' : '❌ Missing Tokens'}
            </h4>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              <strong>API URL:</strong> {tokenInfo.apiUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
