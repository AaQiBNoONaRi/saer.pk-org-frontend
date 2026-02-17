import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Building2, BedDouble, List as ListIcon } from 'lucide-react';
import HotelCard from './HotelCard';
import HotelForm from './HotelForm';
import HotelCategoriesManagement from './HotelCategoriesManagement';
import BedTypesManagement from './BedTypesManagement';
import HotelRoomMap from './HotelRoomMap';
import HotelAvailability from './HotelAvailability';

const HotelsView = () => {
    // View State
    const [viewMode, setViewMode] = useState('list'); // list, categories, bed-types, room-map, availability
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHotel, setSelectedHotel] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('All');

    const API_URL = 'http://localhost:8000/api/hotels/';

    useEffect(() => {
        if (viewMode === 'list') {
            fetchHotels();
        }
    }, [viewMode]);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Fetched hotels count:', response.data.length);
            console.log('Hotels IDs:', response.data.map(h => ({ id: h._id, name: h.name })));
            setHotels(response.data);
        } catch (error) {
            console.error('Error fetching hotels:', error);
            toast.error('Failed to fetch hotels');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHotel = () => {
        setSelectedHotel(null);
        setViewMode('form');
    };

    const handleEditHotel = async (hotel) => {
        console.log('🔍 Edit clicked for hotel:', { id: hotel._id, name: hotel.name, type: typeof hotel._id });
        console.log('🔍 Full hotel object:', hotel);
        try {
            // Verify hotel still exists in database before editing
            const token = localStorage.getItem('access_token');
            const url = `${API_URL}${hotel._id}`;
            console.log('🌐 Making GET request to:', url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Hotel found in database, opening form');
            setSelectedHotel(response.data);
            setViewMode('form');
        } catch (error) {
            console.error('❌ Error in handleEditHotel:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Request URL was:', `${API_URL}${hotel._id}`);
            if (error.response && error.response.status === 404) {
                toast.error('Hotel not found. It may have been deleted. Refreshing list...');
                fetchHotels();
            } else {
                console.error('Error fetching hotel:', error);
                toast.error('Failed to load hotel details');
            }
        }
    };

    const handleDeleteHotel = async (hotel) => {
        if (window.confirm(`Are you sure you want to delete ${hotel.name}?`)) {
            try {
                const token = localStorage.getItem('access_token');
                await axios.delete(`${API_URL}${hotel._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Hotel deleted successfully');
                fetchHotels();
            } catch (error) {
                console.error('Error deleting hotel:', error);
                toast.error('Failed to delete hotel');
            }
        }
    };

    const handleSaveHotel = async (formData) => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (selectedHotel) {
                console.log('Attempting to update hotel with ID:', selectedHotel._id);
                try {
                    const res = await axios.put(`${API_URL}${selectedHotel._id}`, formData, { headers });
                    toast.success('Hotel updated successfully');
                    // Clear selection and refresh list
                    setSelectedHotel(null);
                    setViewMode('list');
                    fetchHotels();
                    return res.data;
                } catch (err) {
                    // If PUT returns 404, ask user whether to create instead (hotel may have been deleted)
                    if (err.response && err.response.status === 404) {
                        const create = window.confirm('Hotel not found on server. Do you want to create a new hotel with this data?');
                        if (create) {
                            const res = await axios.post(API_URL, formData, { headers });
                            toast.success('Hotel created successfully');
                            setSelectedHotel(null);
                            setViewMode('list');
                            fetchHotels();
                            return res.data;
                        } else {
                            toast.error('Update aborted: original hotel not found.');
                            setSelectedHotel(null);
                            setViewMode('list');
                            throw err;
                        }
                    }
                    throw err;
                }
            } else {
                const res = await axios.post(API_URL, formData, { headers });
                toast.success('Hotel created successfully');
                setSelectedHotel(null);
                setViewMode('list');
                fetchHotels();
                return res.data;
            }
        } catch (error) {
            console.error('Error saving hotel:', error);
            // If server provided details, include them
            if (error.response) {
                console.error('Server response:', error.response.data);
            }
            throw error; // Re-throw to be handled by form
        }
    };

    // --- New Navigation Handlers ---

    const handleManageRooms = (hotel) => {
        setSelectedHotel(hotel);
        setViewMode('room-map');
    };

    const handleManageAvailability = (hotel) => {
        setSelectedHotel(hotel);
        setViewMode('availability');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedHotel(null);
    };

    // Filter Logic
    const filteredHotels = hotels.filter(hotel => {
        const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hotel.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = cityFilter === 'All' || hotel.city === cityFilter;
        return matchesSearch && matchesCity;
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header & Tabs - Only show when NOT in sub-views like Map/Availability */}
            {['list', 'categories', 'bed-types'].includes(viewMode) && (
                <div className="flex flex-col gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">Hotel Management</h1>
                        <p className="text-slate-500 font-medium">Manage properties, inventory, and configurations.</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ListIcon size={18} /> Hotel List
                        </button>
                        <button
                            onClick={() => setViewMode('categories')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'categories'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Building2 size={18} /> Categories
                        </button>
                        <button
                            onClick={() => setViewMode('bed-types')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'bed-types'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <BedDouble size={18} /> Bed Types
                        </button>
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <div className="flex items-center gap-3 w-full md:w-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                            <Search className="text-slate-400 ml-2" size={20} />
                            <input
                                type="text"
                                placeholder="Search hotels..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 w-64"
                            />
                            <div className="h-6 w-px bg-slate-200 mx-2"></div>
                            <select
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-slate-700 text-sm font-bold cursor-pointer"
                            >
                                <option value="All">All Cities</option>
                                <option value="Makkah">Makkah</option>
                                <option value="Madinah">Madinah</option>
                                <option value="Jeddah">Jeddah</option>
                                <option value="Riyadh">Riyadh</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreateHotel}
                            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            <Plus size={20} />
                            Add Property
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">
                            Loading properties...
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 size={32} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No hotels found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredHotels.map(hotel => (
                                <HotelCard
                                    key={hotel._id}
                                    hotel={hotel}
                                    onEdit={handleEditHotel}
                                    onDelete={handleDeleteHotel}
                                    onManageRooms={handleManageRooms}
                                    onManageAvailability={handleManageAvailability}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Management Views */}
            {viewMode === 'categories' && <HotelCategoriesManagement />}
            {viewMode === 'bed-types' && <BedTypesManagement />}

            {/* Functional Views (Full Screen-ish) */}
            {viewMode === 'room-map' && selectedHotel && (
                <HotelRoomMap hotel={selectedHotel} onBack={handleBackToList} />
            )}
            {viewMode === 'availability' && selectedHotel && (
                <HotelAvailability hotel={selectedHotel} onBack={handleBackToList} />
            )}
            {viewMode === 'form' && (
                <HotelForm
                    hotel={selectedHotel}
                    onSave={handleSaveHotel}
                    onCancel={() => {
                        setSelectedHotel(null);
                        setViewMode('list');
                    }}
                />
            )}
        </div>
    );
};

export default HotelsView;
