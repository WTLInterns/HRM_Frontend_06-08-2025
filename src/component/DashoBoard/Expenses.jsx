import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

const style = (isDarkMode) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: isDarkMode ? "#1e293b" : "background.paper",
  color: isDarkMode ? "#fff" : "#111",
  border: `2px solid ${isDarkMode ? '#38bdf8' : '#1976d2'}`,
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
});

const API_BASE = `http://localhost:8282/api/expenses`;

const initialForm = {
  expenseId: "",
  date: "",
  billNo: "",
  amount: "",
  reason: "",
  transactionId: "",
  billImage: "",
  billImageFile: null,
};

export default function Expenses() {
  const { isDarkMode } = useApp();
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const subadminId = user?.id;
      const res = await axios.get(`${API_BASE}/${subadminId}/getAll`);
      setExpenses(res.data || []);
    } catch (err) {
      setExpenses([]);
    }
    setLoading(false);
  };

  const handleOpen = (data = null) => {
    if (data) {
      setForm({
        expenseId: data.expenseId,
        date: data.date,
        billNo: data.billNo,
        amount: data.amount,
        reason: data.reason,
        transactionId: data.transactionId,
        billImage: data.billImage,
        billImageFile: null,
      });
      setEditId(data.expenseId);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setForm(initialForm);
    setEditId(null);
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "billImageFile") {
      setForm((prev) => ({ ...prev, billImageFile: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("expenseId", form.expenseId);
      formData.append("date", form.date);
      formData.append("billNo", form.billNo);
      formData.append("amount", form.amount);
      formData.append("reason", form.reason);
      formData.append("transactionId", form.transactionId);
      if (form.billImageFile) {
        formData.append("billImageFile", form.billImageFile);
      }
      try {
        if (editId) {
          const user = JSON.parse(localStorage.getItem("user"));
          const subadminId = user?.id;
          await axios.put(
            `${API_BASE}/${subadminId}/update-expenses/${editId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          toast.success("Expense updated successfully");
        } else {
          const user = JSON.parse(localStorage.getItem("user"));
          const subadminId = user?.id;
          await axios.post(`${API_BASE}/${subadminId}/postData`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          toast.success("Expense added successfully");
        }
        fetchExpenses();
        handleClose();
      } catch (err) {
        toast.error("Failed to save expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Open confirmation dialog
  const handleOpenDeleteDialog = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  // Close dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const subadminId = user?.id;
      const res = await axios.delete(`${API_BASE}/${subadminId}/delete-expenses/${expenseToDelete.expenseId}`);
      toast.success(res.data || "Expense record deleted successfully");
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to delete expense");
    }
    handleCloseDeleteDialog();
  };

  const filteredExpenses = expenses.filter((exp) =>
    [exp.billNo, exp.amount, exp.transactionId, exp.reason, exp.date]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const paginatedExpenses = filteredExpenses.slice((page - 1) * 5, page * 5);

  return (
    <>
      
      {/* Delete Confirmation Dialog */}
      <Modal open={deleteDialogOpen} onClose={handleCloseDeleteDialog} aria-labelledby="delete-expense-title" aria-describedby="delete-expense-description">
        <Box sx={style(isDarkMode)}>
          <Typography id="delete-expense-title" variant="h6" component="h2" sx={{ mb: 2, color: isDarkMode ? '#38bdf8' : '#1976d2' }}>
            {t('common.confirmDeletion')}
          </Typography>
          <Typography id="delete-expense-description" sx={{ mb: 3 }}>
            {t('common.confirmDelete')}
            <br />
            <span style={{ fontWeight: 'bold', color: isDarkMode ? '#f87171' : '#dc2626' }}>
              {expenseToDelete && `${t('expenses.billNo')}: ${expenseToDelete.billNo}, ${t('expenses.amount')}: ₹${expenseToDelete.amount}`}
            </span>
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleCloseDeleteDialog} variant="outlined" color="primary">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              {t('common.delete')}
            </Button>
          </Box>
        </Box>
      </Modal>
      <div className={`p-2 sm:p-4 md:p-8 ${isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-100 text-gray-800'} min-h-screen`}>
        <h1 className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t('navigation.expenses')}</h1>
        <div className={`mb-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-2 sm:p-4 rounded-lg shadow-md border`}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('placeholders.searchExpenses')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`block w-full sm:w-72 pl-10 pr-3 py-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400`}
              />
            </div>
            <button
              className={`w-full sm:w-auto px-4 py-2 rounded-md font-semibold shadow-md focus:outline-none transition-colors ${isDarkMode ? 'bg-blue-400 text-slate-900 hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              onClick={() => handleOpen()}
            >
              {t('expenses.addExpense')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className={`w-full border-collapse border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} shadow-md`}>
            <thead>
              <tr className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} text-left`}>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('common.date')}</th>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('expenses.billNo')}</th>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('expenses.amount')}</th>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('expenses.transactionId')}</th>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('expenses.reason')}</th>
                <th className={`border ${isDarkMode ? 'border-slate-600 text-blue-400' : 'border-gray-200 text-blue-600'} px-4 py-2`}>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.map((exp) => (
                <tr key={exp.expenseId} className={`${isDarkMode ? 'bg-slate-900 hover:bg-slate-700' : 'bg-white hover:bg-gray-100'}`}>
                  <td className="border px-4 py-2">{exp.date}</td>
                  <td className="border px-4 py-2">{exp.billNo}</td>
                  <td className="border px-4 py-2">{exp.amount}</td>
                  <td className="border px-4 py-2">{exp.transactionId}</td>
                  <td className="border px-4 py-2">{exp.reason}</td>
                  <td className="border px-4 py-2">
                    <button onClick={() => handleOpen(exp)} className={`mr-2 p-2 rounded ${isDarkMode ? 'bg-slate-700 text-blue-300 hover:bg-slate-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}><EditIcon /></button>
                    <button onClick={() => handleOpenDeleteDialog(exp)} className={`p-2 rounded ${isDarkMode ? 'bg-slate-700 text-red-400 hover:bg-slate-600' : 'bg-gray-100 text-red-600 hover:bg-gray-200'}`}><DeleteIcon /></button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-4">{loading ? t('common.loading') : t('expenses.noExpensesFound')}</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-3 mt-4">
            {/* Prev Button */}
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous Page"
              tabIndex={0}
              className={`min-w-10 min-h-10 flex items-center justify-center rounded-lg border transition-all
                ${page === 1 ? 'bg-[#202b40] text-[#6e7ca0] border-[#202b40] cursor-not-allowed' : 'bg-[#202b40] text-[#bfc9db] border-[#202b40] hover:bg-[#223054]'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#bfc9db" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            {/* Page Numbers */}
            {Array.from({ length: Math.ceil(filteredExpenses.length / 5) }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                aria-label={`Page ${i + 1}`}
                tabIndex={0}
                onClick={() => setPage(i + 1)}
                className={`min-w-10 min-h-10 flex items-center justify-center rounded-lg border text-lg font-medium transition-all
                  ${page === i + 1
                    ? 'bg-[#2563eb] text-white border-white shadow focus:outline-none'
                    : 'bg-[#202b40] text-[#bfc9db] border-[#202b40] hover:bg-[#223054]'}
                `}
              >
                {i + 1}
              </button>
            ))}
            {/* Next Button */}
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === Math.ceil(filteredExpenses.length / 5)}
              aria-label="Next Page"
              tabIndex={0}
              className={`min-w-10 min-h-10 flex items-center justify-center rounded-lg border transition-all
                ${page === Math.ceil(filteredExpenses.length / 5) ? 'bg-[#202b40] text-[#6e7ca0] border-[#202b40] cursor-not-allowed' : 'bg-[#202b40] text-[#bfc9db] border-[#202b40] hover:bg-[#223054]'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#bfc9db" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center ${open ? 'block' : 'hidden'}`}
      >
        <div className={`bg-[#17233e] text-[#bfc9db] p-2 sm:p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl relative max-h-[90vh] overflow-y-auto`}>
          <button
            type="button"
            aria-label="Close"
            tabIndex={0}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#223054] focus:outline-none transition z-10"
            onClick={handleClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#bfc9db" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-8 text-[#3fa9f5]">{editId ? t('expenses.editExpense') : t('expenses.addExpense')}</h2>
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="date">{t('common.date')}</label>
                <input type="date" id="date" name="date" value={form.date} onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
              </div>
              <div>
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="billNo">{t('expenses.billNo')}</label>
                <input type="text" id="billNo" name="billNo" value={form.billNo} onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
              </div>
              <div>
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="amount">{t('expenses.amount')}</label>
                <input type="number" id="amount" name="amount" value={form.amount} onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
              </div>
              <div>
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="transactionId">{t('expenses.transactionId')}</label>
                <input type="text" id="transactionId" name="transactionId" value={form.transactionId} onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="reason">{t('expenses.reason')}</label>
                <textarea id="reason" name="reason" value={form.reason} onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#bfc9db] font-semibold text-sm uppercase tracking-wide mb-1" htmlFor="billImageFile">{t('expenses.billImage')}</label>
                <input type="file" id="billImageFile" name="billImageFile" onChange={handleChange} className="bg-[#223054] border-[#223054] text-[#bfc9db] placeholder:text-[#6e7ca0] rounded-lg px-4 py-2 w-full border" />
                {editId && form.billImage && !form.billImageFile && (
                  <div className="mt-3">
                    <div className="text-[#bfc9db] text-xs mb-1">Actual Bill Image:</div>
                    <a href={`http://localhost:8282/images/profile/${form.billImage}`} target="_blank" rel="noopener noreferrer">
                      <img
                        src={`http://localhost:8282/images/profile/${form.billImage}`}
                        alt="Bill"
                        className="border border-[#223054] rounded-lg max-h-32 bg-[#17233e] cursor-pointer hover:opacity-80 transition"
                        style={{ marginTop: 10 }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-6 mt-6 w-full">
              <button type="button" className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md focus:outline-none transition-colors bg-[#223054] text-[#bfc9db] hover:bg-[#2a3a5e]" onClick={handleClose}>Cancel</button>
              <button type="button" className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md focus:outline-none transition-colors bg-[#3fa9f5] text-[#17233e] hover:bg-[#60b8fa]" onClick={handleSave}>Save</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
