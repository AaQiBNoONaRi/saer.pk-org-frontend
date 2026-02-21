import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/hotel-categories/';

const HotelCategoriesManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
    const [notification, setNotification] = useState(null); // { message, type: 'success'|'error' }

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                is_active: category.is_active
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (editingCategory) {
                await axios.put(`${API_URL}${editingCategory._id}`, formData, { headers });
                showToast('Category updated successfully', 'success');
            } else {
                await axios.post(API_URL, formData, { headers });
                showToast('Category created successfully', 'success');
            }
            fetchCategories();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving category:', error);
            showToast(error.response?.data?.detail || 'Failed to save category', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_URL}${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Category deleted successfully', 'success');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category', 'error');
        }
    };


    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Notification Banner */}
            {notification && (
                <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${notification.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {notification.type === 'success'
                        ? <CheckCircle size={16} />
                        : <AlertCircle size={16} />
                    }
                    {notification.message}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Hotel Categories</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Add Category
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {category.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(category)} className="text-blue-600 hover:text-blue-900 mr-3">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(category._id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No categories found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="e.g., 5 Star Luxury"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Active
                                </label>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelCategoriesManagement;
