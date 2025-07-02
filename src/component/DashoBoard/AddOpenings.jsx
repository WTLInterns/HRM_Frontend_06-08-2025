import React, { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "react-toastify";
import firebaseService from "../../services/firebaseService";

const ROLE_OPTIONS = [
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
];
const SITE_MODE_OPTIONS = ["Work from Office", "Work From Home", "Hybrid"];
const EXPERIENCE_OPTIONS = ["Fresher", "0-3 years", "3-5 years", "5+ years"];
const JOB_TYPE_OPTIONS = ["Intern", "Full-time"];

const AddOpenings = () => {
  const { isDarkMode } = useApp();
  const location = useLocation();
  const [openings, setOpenings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    role: "",
    location: "",
    siteMode: SITE_MODE_OPTIONS[0],
    positions: 1,
    exprience: EXPERIENCE_OPTIONS[0],
    description: "",
    workType: JOB_TYPE_OPTIONS[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [subadminId, setSubadminId] = useState(null);
  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    // Only set subadminId from user
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) setSubadminId(user.id);
  }, []);

  useEffect(() => {
    if (subadminId) fetchOpenings();
    // eslint-disable-next-line
  }, [subadminId]);

  const fetchOpenings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8282/api/openings/${subadminId}`);
      setOpenings(res.data || []);
    } catch {
      setOpenings([]);
    }
    setLoading(false);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Helper function to get FCM tokens
  const getFCMTokens = async () => {
    try {
      // Get current subadmin's FCM token
      const subadminToken = await firebaseService.generateToken();

      console.log('🔍 Subadmin FCM token for job opening:', subadminToken?.substring(0, 20) + '...');
      console.log('📝 Note: Employee FCM tokens will be fetched from database by backend');

      // Backend will fetch all employee tokens from database using subadminId
      // We only need to provide subadminToken for validation/logging
      return { subadminToken };
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return { subadminToken: 'default_subadmin_token' };
    }
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`http://localhost:8282/api/openings/${subadminId}/${editingId}`, form);
        toast.success("Opening updated successfully!");
      } else {
        console.log('🚀 Creating new job opening...');

        // Get FCM token for notification
        const { subadminToken } = await getFCMTokens();

        const apiUrl = `http://localhost:8282/api/openings/${subadminId}/${subadminToken}`;
        console.log('📝 Job opening API URL:', apiUrl);
        console.log('📝 Form data:', form);

        await axios.post(apiUrl, form);
        toast.success("Opening added successfully! All employees will be notified.");
      }
      setShowModal(false);
      setForm({
        role: "",
        location: "",
        siteMode: SITE_MODE_OPTIONS[0],
        positions: 1,
        exprience: EXPERIENCE_OPTIONS[0],  // Note: matches entity field name (with typo)
        description: "",
        workType: JOB_TYPE_OPTIONS[0]
      });
      setEditingId(null);
      fetchOpenings();
    } catch (error) {
      console.error('Error saving opening:', error);
      toast.error("Error occurred while saving opening. Please try again.");
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setForm({
      role: item.role || "",
      location: item.location || "",
      siteMode: item.siteMode || SITE_MODE_OPTIONS[0],
      positions: item.positions || 1,
      exprience: item.exprience || EXPERIENCE_OPTIONS[0],
      description: item.description || "",
      workType: item.workType || JOB_TYPE_OPTIONS[0]
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  // Trigger confirmation dialog
  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
    // The ConfirmDialog will show, and only if the user confirms, confirmDelete will be called
  };


  // Confirm and perform deletion
  const confirmDelete = async () => {
    setConfirmOpen(false);
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8282/api/openings/${subadminId}/${deleteTargetId}`);
      toast.success("Opening deleted successfully!");
      fetchOpenings();
    } catch (error) {
      toast.error("Error deleting opening. Please try again.");
    }
    setLoading(false);
    setDeleteTargetId(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTargetId(null);
  };

  // Filter openings by search
  const filteredOpenings = openings.filter(
    o => o.role && o.role.toLowerCase().includes((search || "").toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOpenings.length / ITEMS_PER_PAGE) || 1;
  const paginatedOpenings = filteredOpenings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className={`w-full max-w-4xl mx-auto mt-10 p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}
      style={{ boxSizing: 'border-box' }}>
      {/* Search and Add Button */}
      <div className="flex items-center gap-4 mb-6">
        <input type="text" placeholder="Search openings..." value={search} onChange={e => setSearch(e.target.value)}
          className={`flex-1 p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} />
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" onClick={() => { setShowModal(true); setEditingId(null); }}>Add Openings</button>
      </div>
      {/* Openings Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full shadow-lg rounded-xl border-separate border-spacing-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} text-sm mb-6`}
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr className={isDarkMode ? "bg-slate-800" : "bg-blue-100"}>
              <th className="px-2 py-2 font-semibold text-base text-center rounded-tl-xl border-b-2 border-blue-400">Role</th>
              <th className="px-2 py-2 font-semibold text-base text-center border-b-2 border-blue-400">Positions</th>
              <th className="px-2 py-2 font-semibold text-base text-center border-b-2 border-blue-400">Location</th>
              <th className="px-2 py-2 font-semibold text-base text-center border-b-2 border-blue-400">Experience</th>
              <th className="px-2 py-2 font-semibold text-base text-center rounded-tr-xl border-b-2 border-blue-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOpenings.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400 font-semibold bg-transparent">No openings found.</td>
              </tr>
            )}
            {paginatedOpenings.map((o, idx) => (
              <tr
                key={o.id}
                className={
                  `${isDarkMode
                    ? (idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900')
                    : (idx % 2 === 0 ? 'bg-white' : 'bg-blue-50')}
                  hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-150`}
              >
                <td className="px-2 py-1 text-center align-middle font-normal text-base border-b border-blue-100 dark:border-slate-700">{o.role || 'N/A'}</td>
                <td className="px-2 py-1 text-center align-middle font-normal text-base border-b border-blue-100 dark:border-slate-700">{o.positions || 0}</td>
                <td className="px-2 py-1 text-center align-middle font-normal text-base border-b border-blue-100 dark:border-slate-700">{o.location || 'N/A'}</td>
                <td className="px-2 py-1 text-center align-middle font-normal text-base border-b border-blue-100 dark:border-slate-700">{o.exprience || 'N/A'}</td>
                <td className="px-2 py-1 text-center align-middle border-b border-blue-100 dark:border-slate-700">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      title="Edit"
                      onClick={() => handleEdit(o)}
                      className="text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                      style={{ fontSize: 16 }}
                    >
                      ✏️
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(o.id)}
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                      style={{ fontSize: 16 }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 gap-4">
        <button
          className={`px-2 py-1 rounded-lg font-semibold shadow transition-colors ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="font-semibold text-base text-gray-700 dark:text-gray-200">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className={`px-2 py-1 rounded-lg font-semibold shadow transition-colors ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-lg p-0 w-full max-w-lg relative ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            style={{ maxHeight: '90vh', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
            <button className="absolute top-2 right-3 text-2xl" onClick={() => setShowModal(false)}>
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 px-8 pt-8">{editingId ? "Edit Opening" : "Add Opening"}</h3>
            <div className="flex-1 overflow-y-auto overflow-x-auto px-8 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              <form onSubmit={handleAddOrEdit} className="space-y-4 min-w-[350px] md:min-w-0" style={{ minWidth: '350px' }}>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Role</label>
                  <select name="role" value={form.role} onChange={handleInput} required className="w-full p-2 rounded border">
                    <option value="">Select Role</option>
                    {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Location</label>
                  <input name="location" value={form.location} onChange={handleInput} required className="w-full p-2 rounded border" />
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Site Mode</label>
                  <select name="siteMode" value={form.siteMode} onChange={handleInput} className="w-full p-2 rounded border">
                    {SITE_MODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">No. of Positions</label>
                  <input type="number" name="positions" value={form.positions} min={1} onChange={handleInput} required className="w-full p-2 rounded border" />
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Experience</label>
                  <select name="exprience" value={form.exprience} onChange={handleInput} className="w-full p-2 rounded border">
                    {EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Job Description</label>
                  <input name="description" value={form.description} onChange={handleInput} required placeholder="Enter small description" className="w-full p-2 rounded border" />
                </div>
                <div className="min-w-[250px]">
                  <label className="block mb-1">Job Type</label>
                  <select name="workType" value={form.workType} onChange={handleInput} className="w-full p-2 rounded border">
                    {JOB_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Opening"
        message="Are you sure you want to delete this opening? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {/* Toast notifications handled by react-toastify */}
    </div>
  );
};

export default AddOpenings;
