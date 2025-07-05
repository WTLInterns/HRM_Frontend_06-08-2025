import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';
import { toast } from "react-hot-toast";
import { FaExclamationTriangle, FaPaperPlane, FaUsers } from "react-icons/fa";
import { MdEmergency } from "react-icons/md";
import firebaseService from "../../services/firebaseService";

const API_URL = "http://localhost:8282/api";

const EmergencyMessage = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getSubadminId = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user?.id;
    }
    return null;
  };

  // Helper function to get FCM tokens
  const getFCMTokens = async () => {
    try {
      // Get current subadmin's FCM token
      const subadminToken = await firebaseService.generateToken();

      console.log('🔍 Subadmin FCM token for emergency message:', subadminToken?.substring(0, 20) + '...');
      console.log('📝 Note: Employee FCM tokens will be fetched from database by backend');

      // Backend will fetch all employee tokens from database using subadminId
      // We only need to provide subadminToken for validation/logging
      return { subadminToken };
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return { subadminToken: 'default_subadmin_token' };
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error(t('emergencyMessage.errors.emptyMessage'));
      return;
    }

    const subadminId = getSubadminId();
    if (!subadminId) {
      toast.error(t('emergencyMessage.errors.userNotFound'));
      return;
    }

    setLoading(true);
    try {
      console.log('🚨 Sending emergency message...');

      // Get FCM token for notification
      const { subadminToken } = await getFCMTokens();

      const apiUrl = `${API_URL}/emergency/${subadminId}/send/${subadminToken}`;
      console.log('📝 Emergency message API URL:', apiUrl);
      console.log('📝 Message:', message.trim());

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(t('emergencyMessage.success.messageSent', { count: result.employeeCount }));
        setMessage("");
      } else {
        const errorText = await response.text();
        toast.error(`${t('emergencyMessage.errors.sendFailedWithMessage')} ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending emergency message:', error);
      toast.error(t('emergencyMessage.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 rounded-lg shadow-lg mt-10 ${
      isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
          <MdEmergency className="text-2xl text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
            {t('emergencyMessage.title')}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('emergencyMessage.subtitle')}
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
              {t('emergencyMessage.importantNotice')}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {t('emergencyMessage.warningText')}
            </p>
          </div>
        </div>
      </div>

      {/* Message Form */}
      <form onSubmit={handleSendMessage} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('emergencyMessage.messageLabel')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('emergencyMessage.messagePlaceholder')}
            rows={6}
            className={`w-full p-4 rounded-lg border resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {message.length}/500 {t('emergencyMessage.characterCount')}
            </span>
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <FaUsers />
              <span>{t('emergencyMessage.willBeSentTo')}</span>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className={`flex items-center gap-3 px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !message.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('emergencyMessage.sending')}</span>
              </>
            ) : (
              <>
                <FaPaperPlane />
                <span>{t('emergencyMessage.sendButton')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Usage Guidelines */}
      <div className={`mt-8 p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">
          {t('emergencyMessage.usageGuidelines')}
        </h3>
        <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>{t('emergencyMessage.guidelines.emergencies')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>{t('emergencyMessage.guidelines.announcements')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">•</span>
            <span>{t('emergencyMessage.guidelines.clarity')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>{t('emergencyMessage.guidelines.avoid')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyMessage;
