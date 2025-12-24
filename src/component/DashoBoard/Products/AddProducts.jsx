import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Upload, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useApp } from "../../../context/AppContext";
import { toast } from 'react-toastify';

const AddProducts = () => {
  const { isDarkMode } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // Form states
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    description: '',
    productImage: null
  });

  const [editFormData, setEditFormData] = useState({
    productName: '',
    price: '',
    description: '',
    productImage: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Get subadminId from user object in localStorage
  const getSubadminId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      return user.id || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const subadminId = getSubadminId();

  // If no subadminId, show error message
  if (!subadminId) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800"} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center`}>
            <h1 className="text-2xl font-bold text-red-800 mb-4">Access Error</h1>
            <p className="text-red-600 mb-4">
              Unable to access Product Management. Please log in again or contact your administrator.
            </p>
            <p className="text-sm text-gray-600">
              Required: Subadmin ID not found in user session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const API_BASE_URL = 'http://localhost:8081/api/products';

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${subadminId}`);
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      if (error.code !== 'ERR_NETWORK') {
        alert('Failed to fetch products: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, productImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, productImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!formData.productName || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('productName', formData.productName);
    formDataToSend.append('price', formData.price);
    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }
    if (formData.productImage) {
      formDataToSend.append('productImage', formData.productImage);
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/${subadminId}/add`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Product added successfully!');
        setFormData({ productName: '', price: '', description: '', productImage: null });
        setImagePreview(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error: Please check if the backend server is running on port 8081');
      } else {
        toast.error('Failed to add product: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      productName: product.productName,
      price: product.price,
      description: product.description || '',
      productImage: null
    });
    setEditImagePreview(product.productImage ? `http://localhost:8081${product.productImage}` : null);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    if (editFormData.productName) {
      formDataToSend.append('productName', editFormData.productName);
    }
    if (editFormData.price) {
      formDataToSend.append('price', editFormData.price);
    }
    if (editFormData.description) {
      formDataToSend.append('description', editFormData.description);
    }
    if (editFormData.productImage) {
      formDataToSend.append('productImage', editFormData.productImage);
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${subadminId}/${selectedProduct.id}/update`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        toast.success('Product updated successfully!');
        setShowEditModal(false);
        setSelectedProduct(null);
        setEditImagePreview(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error: Please check if the backend server is running on port 8081');
      } else {
        toast.error('Failed to update product: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/${subadminId}/${productToDelete.id}/delete`);

      if (response.data.success) {
        toast.success('Product deleted successfully!');
        setShowDeleteConfirm(false);
        setProductToDelete(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error: Please check if the backend server is running on port 8081');
      } else {
        toast.error('Failed to delete product: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-900 text-white" : "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800"} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? "text-blue-400" : "text-gray-800"}`}>Product Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition shadow-lg ${
                isDarkMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              <Plus className="mr-2" size={20} />
              Add Product
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg p-4 mb-6`}>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} size={20} />
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} rounded-lg shadow-lg overflow-hidden`}>
          <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`}>
            <h2 className="text-2xl font-semibold text-white">Products List</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDarkMode ? "border-blue-500" : "border-blue-600"}`}></div>
              <p className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {searchTerm ? 'No Products Found' : 'No Products Yet'}
              </h3>
              <p className={`text-gray-600 mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : 'Start building your product catalog by adding your first product above!'
                }
              </p>
              {!searchTerm && (
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <p>• Add products with images and descriptions</p>
                  <p>• Manage inventory and pricing</p>
                  <p>• Track sales and generate invoices</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? "bg-slate-700" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Sr No</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Product Image</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Product Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Price</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Description</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Action</th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? "bg-slate-800 divide-slate-700" : "bg-white divide-gray-200"} divide-y`}>
                  {paginatedProducts.map((product, index) => (
                    <tr key={product.id} className={`${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"} transition`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.productImage ? (
                          <img
                            src={`http://localhost:8081${product.productImage}`}
                            alt={product.productName}
                            className="h-16 w-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-slate-700" : "bg-gray-200"}`}>
                            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>No Image</span>
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{product.productName}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>₹{product.price.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-sm max-w-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{product.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(product)}
                          className={`text-blue-600 hover:text-blue-900 mr-4`}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className={`text-red-600 hover:text-red-900`}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className={`px-6 py-4 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"} border-t flex items-center justify-between`}>
              <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition ${
                    currentPage === 1
                      ? `${isDarkMode ? "bg-slate-600 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`
                      : `${isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className={`px-3 py-1 rounded-lg ${isDarkMode ? "bg-slate-600 text-gray-300" : "bg-white text-gray-700"} border`}>
                  {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition ${
                    currentPage === totalPages
                      ? `${isDarkMode ? "bg-slate-600 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`
                      : `${isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`
                  }`}
                  title="Next Page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-blue-500 to-indigo-600"} px-6 py-4 flex justify-between items-center`}>
              <h3 className="text-2xl font-semibold text-white">Edit Product</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  setEditImagePreview(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              {editImagePreview && (
                <div className="flex justify-center mb-4">
                  <img src={editImagePreview} alt="Product" className="h-32 w-32 object-cover rounded-lg border" />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Product Name</label>
                <input
                  type="text"
                  name="productName"
                  value={editFormData.productName}
                  onChange={handleEditInputChange}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Price</label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleEditInputChange}
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Change Product Image</label>
                <label className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition w-fit ${
                  isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } text-white`}>
                  <Upload className="mr-2" size={20} />
                  Choose New Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                      : "bg-green-500 hover:bg-green-600 disabled:bg-gray-400"
                  } text-white`}
                >
                  {loading ? 'Updating...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setEditImagePreview(null);
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  } text-white`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`${isDarkMode ? "bg-slate-700" : "bg-gradient-to-r from-green-500 to-green-600"} px-6 py-4 flex justify-between items-center`}>
              <h3 className="text-2xl font-semibold text-white">Add New Product</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ productName: '', price: '', description: '', productImage: null });
                  setImagePreview(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Product Image</label>
                <div className="flex items-center space-x-4">
                  <label className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition ${
                    isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                  } text-white`}>
                    <Upload className="mr-2" size={20} />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                  )}
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                      : "bg-green-500 hover:bg-green-600 disabled:bg-gray-400"
                  } text-white`}
                >
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ productName: '', price: '', description: '', productImage: null });
                    setImagePreview(null);
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  } text-white`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white"} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Confirm Delete</h3>
            <p className={`text-gray-600 mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Are you sure you want to delete <strong>{productToDelete?.productName}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
                    : "bg-red-500 hover:bg-red-600 disabled:bg-gray-400"
                } text-white`}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  isDarkMode
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProducts;
