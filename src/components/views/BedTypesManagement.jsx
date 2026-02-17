import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Lock } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/bed-types/';

const BedTypesManagement = () => {
    const [bedTypes, setBedTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: '', is_room_price: false, is_active: true });

    useEffect(() => {
        fetchBedTypes();
    }, []);

    const fetchBedTypes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Sort so "Room Price" is always first
            const sorted = response.data.sort((a, b) => (b.is_room_price === true) - (a.is_room_price === true));
            setBedTypes(sorted);
        } catch (error) {
            console.error('Error fetching bed types:', error);
            toast.error('Failed to load bed types');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type = null) => {
        if (type) {
            // Prevent editing name of Locked types (Room Price)
            if (type.is_room_price) {
                // We'll still allow editing status, but disable name input in form
            }
            setEditingType(type);
            setFormData({
                name: type.name,
                is_room_price: type.is_room_price,
                is_active: type.is_active
            });
        } else {
            setEditingType(null);
            setFormData({ name: '', is_room_price: false, is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (editingType) {
                await axios.put(`${API_URL}${editingType._id}`, formData, { headers });
                toast.success('Bed type updated successfully');
            } else {
                await axios.post(API_URL, formData, { headers });
                toast.success('Bed type created successfully');
            }
            fetchBedTypes();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving bed type:', error);
            toast.error(error.response?.data?.detail || 'Failed to save bed type');
        }
    };

    const handleDelete = async (type) => {
        if (type.is_room_price) {
            toast.error("Cannot delete the default 'Room Price' type.");
            return;
        }
        if (!window.confirm('Are you sure you want to delete this bed type?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_URL}${type._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Bed type deleted successfully');
            fetchBedTypes();
        } catch (error) {
            console.error('Error deleting bed type:', error);
            toast.error('Failed to delete bed type');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Bed Types</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Add Bed Type
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bedTypes.map((type) => (
                                <tr key={type._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {type.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {type.is_room_price ? (
                                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
                                                <Lock size={12} /> Protected (Room Price)
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">Standard Bed</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {type.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(type)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type)}
                                            className={`text-red-600 hover:text-red-900 ${type.is_room_price ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={type.is_room_price}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {bedTypes.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No bed types found.
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
                                {editingType ? 'Edit Bed Type' : 'New Bed Type'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name * {formData.is_room_price && <span className="text-xs text-red-500">(Locked for Room Price)</span>}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={formData.is_room_price} // Lock name editing if it's room price
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${formData.is_room_price ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="e.g., Double Bed"
                                />
                            </div>

                            {/* Removed Is Room Price checkbox from creation form per UX change. */}

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

export default BedTypesManagement;
