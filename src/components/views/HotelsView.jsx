import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Building2, BedDouble, List as ListIcon, X, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import HotelForm from './HotelForm';
import HotelCategoriesManagement from './HotelCategoriesManagement';
import BedTypesManagement from './BedTypesManagement';
import HotelRoomMap from './HotelRoomMap';
import HotelAvailability from './HotelAvailability';

const PhotoGallery = ({ photos, isOpen, onClose, hotelName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen || !photos || photos.length === 0) return null;

    const next = () => setCurrentIndex((currentIndex + 1) % photos.length);
    const prev = () => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors z-[70]"
            >
                <X size={32} />
            </button>

            <div className="relative max-w-5xl w-full flex flex-col items-center">
                <div className="text-white text-xl font-bold mb-4">{hotelName} - Gallery ({currentIndex + 1}/{photos.length})</div>

                <div className="relative group w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                    <img
                        src={photos[currentIndex]}
                        alt={`${hotelName} gallery`}
                        className="w-full h-full object-contain"
                    />

                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ArrowRight size={24} />
                            </button>
                        </>
                    )}
                </div>

                <div className="flex gap-2 mt-6 overflow-x-auto pb-2 w-full justify-center">
                    {photos.map((photo, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${i === currentIndex ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                        >
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HotelsView = () => {
    // View State
    const [viewMode, setViewMode] = useState('list'); // list, categories, bed-types, room-map, availability
    const [hotels, setHotels] = useState([]);
    const [bedTypes, setBedTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHotel, setSelectedHotel] = useState(null);

    // Gallery State
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [galleryHotelName, setGalleryHotelName] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('All');

    const API_URL = 'http://localhost:8000/api/hotels/';
    const BED_TYPES_URL = 'http://localhost:8000/api/bed-types/';

    useEffect(() => {
        fetchBedTypes();
    }, []);

    useEffect(() => {
        if (viewMode === 'list') {
            fetchHotels();
        }
    }, [viewMode]);

    const fetchBedTypes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(BED_TYPES_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBedTypes(response.data);
        } catch (error) {
            console.error('Error fetching bed types:', error);
        }
    };

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
            console.error('❌ Failed to fetch hotels');
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
                alert('Hotel not found. It may have been deleted. Refreshing list...');
                fetchHotels();
            } else {
                console.error('Error fetching hotel:', error);
                alert('Failed to load hotel details');
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
                console.log('✅ Hotel deleted successfully');
                fetchHotels();
            } catch (error) {
                console.error('Error deleting hotel:', error);
                alert('Failed to delete hotel');
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
                    console.log('✅ Hotel updated successfully');
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
                            console.log('✅ Hotel created successfully');
                            setSelectedHotel(null);
                            setViewMode('list');
                            fetchHotels();
                            return res.data;
                        } else {
                            alert('Update aborted: original hotel not found.');
                            setSelectedHotel(null);
                            setViewMode('list');
                            throw err;
                        }
                    }
                    throw err;
                }
            } else {
                const res = await axios.post(API_URL, formData, { headers });
                console.log('✅ Hotel created successfully');
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
                        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Hotel Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">City</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Address</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Contact</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Availability</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Distance (m)</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Walk Time (min)</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Walking Distance (m)</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Price Dates</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Room Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Sharing Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Quint Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Quad Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Triple Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Double Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Pictures</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredHotels.map(hotel => {
                                        const firstPrice = hotel.prices && hotel.prices.length > 0 ? hotel.prices[0] : null;

                                        // Map prices to named columns using bed type IDs (robust to typos)
                                        const mapPricesToColumns = (prices) => {
                                            const cols = { room: 'N/A', sharing: 'N/A', quint: 'N/A', quad: 'N/A', triple: 'N/A', double: 'N/A' };
                                            if (!prices || !Array.isArray(prices)) return cols;

                                            const bedById = {};
                                            bedTypes.forEach(bt => {
                                                if (bt && bt._id) bedById[bt._id] = bt;
                                            });

                                            for (const p of prices) {
                                                const bt = bedById[p.bed_type_id];
                                                const name = (bt?.name || '').toLowerCase();

                                                if (bt?.is_room_price) {
                                                    cols.room = p.selling_price;
                                                    continue;
                                                }

                                                if (name.includes('share') || name.includes('sherr')) cols.sharing = p.selling_price;
                                                else if (name.includes('doubl') || name.includes('doublr') || name.includes('double')) cols.double = p.selling_price;
                                                else if (name.includes('triple')) cols.triple = p.selling_price;
                                                else if (name.includes('quad')) cols.quad = p.selling_price;
                                                else if (name.includes('quint')) cols.quint = p.selling_price;
                                                else {
                                                    // fallback: if no match, and room not set, set room
                                                    if (cols.room === 'N/A') cols.room = p.selling_price;
                                                }
                                            }

                                            return cols;
                                        };
                                        const priceCols = mapPricesToColumns(hotel.prices);

                                        const formatDateRange = (from, to) => {
                                            if (!from || !to) return 'N/A';
                                            return `${from} — ${to}`;
                                        };

                                        return (
                                            <tr key={hotel._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 align-top font-medium text-gray-900">{hotel.name || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top">{hotel.city || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top max-w-xs truncate" title={hotel.address}>
                                                    {hotel.address || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 align-top">{hotel.category_name || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top">{hotel.contact_number || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {hotel.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap text-xs">
                                                    {formatDateRange(hotel.available_from, hotel.available_until)}
                                                </td>
                                                <td className="px-4 py-3 align-top">{hotel.distance_meters || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top">{hotel.walking_time_minutes || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top">{hotel.walking_distance_meters || 'N/A'}</td>
                                                <td className="px-4 py-3 align-top whitespace-nowrap text-xs">
                                                    {firstPrice ? formatDateRange(firstPrice.date_from, firstPrice.date_to) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 align-top font-medium text-blue-600">
                                                    {priceCols.room !== undefined && priceCols.room !== null ? priceCols.room : (firstPrice?.room_only_price !== undefined && firstPrice?.room_only_price !== null ? firstPrice.room_only_price : 'N/A')}
                                                </td>
                                                <td className="px-4 py-3 align-top">{priceCols.sharing}</td>
                                                <td className="px-4 py-3 align-top">{priceCols.quint}</td>
                                                <td className="px-4 py-3 align-top">{priceCols.quad}</td>
                                                <td className="px-4 py-3 align-top">{priceCols.triple}</td>
                                                <td className="px-4 py-3 align-top">{priceCols.double}</td>
                                                <td className="px-4 py-3 align-top">
                                                    {hotel.photos && hotel.photos.length > 0 ? (
                                                        <button
                                                            onClick={() => {
                                                                setGalleryPhotos(hotel.photos);
                                                                setGalleryHotelName(hotel.name);
                                                                setGalleryOpen(true);
                                                            }}
                                                            className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 hover:scale-105 transition-all shadow-sm"
                                                        >
                                                            <img
                                                                src={hotel.photos[0]}
                                                                alt={hotel.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                            <ImageIcon size={16} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {hotel.google_location_link ? (
                                                        <a href={hotel.google_location_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                                            Map
                                                        </a>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditHotel(hotel)}
                                                            className="text-xs text-blue-600 hover:underline font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHotel(hotel)}
                                                            className="text-xs text-red-600 hover:underline font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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

            {/* Photo Gallery Modal */}
            <PhotoGallery
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                photos={galleryPhotos}
                hotelName={galleryHotelName}
            />
        </div>
    );
};

export default HotelsView;
