import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from "react-toastify";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

const Reminders = () => {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null); 
  const [newReminder, setNewReminder] = useState({       
    functionName: '',
    reminderDate: ''
  });    

  // Get subadmin ID from localStorage
  const getSubadminId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
  };

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      const subadminId = getSubadminId();
      if (!subadminId) return;

      const response = await axios.get(`http://localhost:8081/api/reminders/${subadminId}`);
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error(t('reminders.errors.failedToFetch'));
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  // Handle opening edit modal
  const handleEdit = (reminder) => {
    console.log('Editing reminder:', reminder); // Debug log
    setIsEditing(true);
    setSelectedReminder(reminder);
    setNewReminder({
      functionName: reminder.functionName,
      reminderDate: reminder.reminderDate
    });
    setShowAddModal(true);
  };

  // Add or update reminder
  const handleAddReminder = async () => {
    try {
      const subadminId = getSubadminId();   
      if (!subadminId) return;

      let reminderData = {
        functionName: newReminder.functionName,
        reminderDate: newReminder.reminderDate,
        subadminId: subadminId
      };

      if (isEditing && selectedReminder) {
        // Include the ID in the update data
        reminderData = {
          ...reminderData,
          id: selectedReminder.id
        };
        console.log('Updating reminder:', reminderData); // Debug log
        await axios.put(`http://localhost:8081/api/reminders/${selectedReminder.id}`, reminderData);
        toast.success(t('reminders.success.updated'));
      } else {
        console.log('Creating reminder:', reminderData); // Debug log
        await axios.post('http://localhost:8081/api/reminders', reminderData);
        toast.success(t('reminders.success.added'));
      }
      setIsEditing(false);
      setSelectedReminder(null);
      setShowAddModal(false);
      setNewReminder({ functionName: '', reminderDate: '' });
      fetchReminders();
    } catch (error) {
      console.error('Error with reminder:', error);
      toast.error(isEditing ? t('reminders.errors.failedToUpdate') : t('reminders.errors.failedToAdd'));
    }
  };

  // Delete reminder
  const handleDeleteReminder = async (reminderId) => {
    try {
      console.log('Deleting reminder with ID:', reminderId); // Debug log
      await axios.delete(`http://localhost:8081/api/reminders/${reminderId}`);
      toast.success(t('reminders.success.deleted'));
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error); // Debug log
      console.error('Error deleting reminder:', error);
      toast.error(t('reminders.errors.failedToDelete'));
    }
  };

  // Filter reminders based on search term
  const filteredReminders = reminders.filter(reminder =>
    reminder.functionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 mr-4">
            <input
              type="text"
              placeholder={t('reminders.searchPlaceholder')}
              className={`w-full px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-800 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaBell /> {t('reminders.addReminder')}
          </button>
        </div>

        {/* Upcoming Reminders List */}
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className={`p-4 text-lg font-semibold border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {t('reminders.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-6 py-3 text-left">{t('reminders.functionName')}</th>
                  <th className="px-6 py-3 text-left">{t('reminders.date')}</th>
                  <th className="px-6 py-3 text-left">{t('reminders.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.length > 0 ? (
                  filteredReminders.map((reminder) => (
                    <tr key={reminder._id} className={`border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className="px-6 py-4">{reminder.functionName}</td>
                      <td className="px-6 py-4">
                        {new Date(reminder.reminderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 space-x-4">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="text-blue-500 hover:text-blue-700 inline-block"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-red-500 hover:text-red-700 inline-block"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      {t('reminders.noRemindersFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative p-6 rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } max-w-md w-full mx-4`}>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              {isEditing ? t('reminders.updateReminder') : t('reminders.addReminder')}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('reminders.functionNamePlaceholder')}
                className={`w-full px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-800 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={newReminder.functionName}
                onChange={(e) => setNewReminder({...newReminder, functionName: e.target.value})}
              />
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="date"
                  className={`w-full px-4 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-800 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={newReminder.reminderDate}
                  onChange={(e) => setNewReminder({...newReminder, reminderDate: e.target.value})}
                />
              </div>
              <button
                onClick={handleAddReminder}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isEditing ? t('reminders.updateReminder') : t('reminders.addReminder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
