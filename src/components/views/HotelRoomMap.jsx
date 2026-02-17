import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Plus, Trash2, Edit2, Check, X,
    BedDouble, ArrowLeft, Loader2
} from 'lucide-react';

const HotelRoomMap = ({ hotel, onBack }) => {
    // Data State
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bedTypes, setBedTypes] = useState([]);

    // UI State
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [loadingFloors, setLoadingFloors] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Modals
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [floorInput, setFloorInput] = useState({ floor_number: '', name: '' });

    const [showRoomModal, setShowRoomModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomInput, setRoomInput] = useState({
        room_number: '',
        bed_type_id: '',
        status: 'VACANT'
    });

    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Initial Fetch
    useEffect(() => {
        fetchFloors();
        fetchBedTypes();
    }, [hotel._id]);

    // Fetch Rooms when floor changes
    useEffect(() => {
        if (selectedFloor) {
            fetchRooms(selectedFloor._id);
        } else {
            setRooms([]);
        }
    }, [selectedFloor]);

    // --- API CALLS ---

    const fetchFloors = async () => {
        setLoadingFloors(true);
        try {
            const res = await fetch(`http://localhost:8000/api/hotel-floors/?hotel_id=${hotel._id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                const sorted = data.sort((a, b) => {
                    // Try to sort numerically if possible
                    const numA = parseInt(a.floor_number);
                    const numB = parseInt(b.floor_number);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return a.floor_number.localeCompare(b.floor_number);
                });
                setFloors(sorted);
                if (sorted.length > 0 && !selectedFloor) {
                    setSelectedFloor(sorted[0]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFloors(false);
        }
    };

    const fetchRooms = async (floorId) => {
        setLoadingRooms(true);
        try {
            const res = await fetch(`http://localhost:8000/api/hotel-rooms/?hotel_id=${hotel._id}&floor_id=${floorId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setRooms(data); // Backend should default sort by room_number if not, we can sort here
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRooms(false);
        }
    };

    const fetchBedTypes = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/bed-types/', { headers });
            if (res.ok) {
                const data = await res.json();
                setBedTypes(data.filter(b => b.is_active));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- ACTIONS ---

    const handleSaveFloor = async () => {
        if (!floorInput.floor_number) return alert("Floor number is required");

        try {
            const payload = {
                hotel_id: hotel._id,
                floor_number: floorInput.floor_number,
                name: floorInput.name,
                is_active: true
            };

            const res = await fetch('http://localhost:8000/api/hotel-floors/', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowFloorModal(false);
                setFloorInput({ floor_number: '', name: '' });
                fetchFloors();
            } else {
                const err = await res.json();
                alert('Error creating floor: ' + (err.detail || 'Unknown error'));
            }
        } catch (err) {
            alert('Error creating floor: ' + err.message);
        }
    };

    const handleDeleteFloor = async () => {
        if (!selectedFloor) return;
        if (!confirm(`Delete Floor ${selectedFloor.floor_number}? Checks will be made to ensure no rooms exist.`)) return;

        try {
            const res = await fetch(`http://localhost:8000/api/hotel-floors/${selectedFloor._id}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                alert('Floor deleted');
                setSelectedFloor(null);
                fetchFloors();
            } else {
                const err = await res.json();
                alert('Failed to delete: ' + (err.detail || 'Unknown'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleSaveRoom = async () => {
        if (!selectedFloor) return;
        if (!roomInput.room_number || !roomInput.bed_type_id) return alert("Room Number and Bed Type are required");

        const payload = {
            hotel_id: hotel._id,
            floor_id: selectedFloor._id,
            room_number: roomInput.room_number,
            bed_type_id: roomInput.bed_type_id,
            status: roomInput.status,
            is_active: true
        };

        try {
            let res;
            if (editingRoom) {
                res = await fetch(`http://localhost:8000/api/hotel-rooms/${editingRoom._id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('http://localhost:8000/api/hotel-rooms/', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                setShowRoomModal(false);
                setEditingRoom(null);
                setRoomInput({ room_number: '', bed_type_id: '', status: 'VACANT' });
                fetchRooms(selectedFloor._id);
            } else {
                const err = await res.json();
                alert('Failed to save room: ' + (err.detail || 'Unknown error'));
            }
        } catch (err) {
            alert('Error saving room: ' + err.message);
        }
    };

    const handleDeleteRoom = async (room) => {
        if (!confirm(`Delete Room ${room.room_number}?`)) return;
        try {
            const res = await fetch(`http://localhost:8000/api/hotel-rooms/${room._id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                fetchRooms(selectedFloor._id);
            } else {
                alert('Failed to delete room');
            }
        } catch (err) {
            alert('Error deleting room');
        }
    };

    const openRoomModal = (room = null) => {
        setEditingRoom(room);
        if (room) {
            setRoomInput({
                room_number: room.room_number,
                bed_type_id: room.bed_type_id,
                status: room.status
            });
        } else {
            setRoomInput({
                room_number: '',
                bed_type_id: '',
                status: 'VACANT'
            });
        }
        setShowRoomModal(true);
    };

    const getBedTypeName = (id) => bedTypes.find(b => b._id === id)?.name || 'Unknown';

    return (
        <div className="fixed inset-0 bg-white z-[55] flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Room Map : {hotel.name}</h2>
                        <p className="text-xs text-slate-500">Manage floors and room configuration</p>
                    </div>
                </div>
                {selectedFloor && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDeleteFloor}
                            className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            Delete Floor
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Floors */}
                <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Floors</h3>
                        <button
                            onClick={() => setShowFloorModal(true)}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Plus size={16} /> Add Floor
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loadingFloors ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" /></div>
                        ) : floors.length === 0 ? (
                            <p className="text-xs text-center text-slate-400 py-4">No floors added yet.</p>
                        ) : (
                            floors.map(floor => (
                                <button
                                    key={floor._id}
                                    onClick={() => setSelectedFloor(floor)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${selectedFloor?._id === floor._id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>Floor {floor.floor_number}</span>
                                    {floor.name && <span className="text-[10px] font-normal opacity-70">{floor.name}</span>}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Area - Rooms */}
                <div className="flex-1 bg-slate-100/50 p-8 overflow-y-auto">
                    {!selectedFloor ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <LayoutGrid size={48} className="mb-4 text-slate-300" />
                            <p>Select a floor to manage rooms</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900">
                                    Floor {selectedFloor.floor_number}
                                    <span className="text-lg font-normal text-slate-400 ml-2">({rooms.length} rooms)</span>
                                </h3>
                                <button
                                    onClick={() => openRoomModal()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                                >
                                    <Plus size={20} /> Add Room
                                </button>
                            </div>

                            {loadingRooms ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                            ) : rooms.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
                                    <p className="text-slate-400 font-medium">No rooms on this floor yet.</p>
                                    <button onClick={() => openRoomModal()} className="mt-4 text-blue-600 font-bold hover:underline">Create your first room</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {rooms.map(room => (
                                        <div
                                            key={room._id}
                                            className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all group relative cursor-pointer"
                                            onClick={() => openRoomModal(room)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-lg font-black text-slate-800">{room.room_number}</span>
                                                <div className={`w-2 h-2 rounded-full ${room.status === 'VACANT' ? 'bg-green-500' :
                                                    room.status === 'BOOKED' ? 'bg-red-500' :
                                                        'bg-yellow-500' // Cleaning
                                                    }`} title={room.status} />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-1">
                                                <BedDouble size={14} />
                                                {getBedTypeName(room.bed_type_id)}
                                            </div>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE FLOOR MODAL */}
            {showFloorModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Add New Floor</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floor Number *</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                                    placeholder="e.g. 1"
                                    value={floorInput.floor_number}
                                    onChange={(e) => setFloorInput(p => ({ ...p, floor_number: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floor Name (Optional)</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                                    placeholder="e.g. Executive Floor"
                                    value={floorInput.name}
                                    onChange={(e) => setFloorInput(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowFloorModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                                <button onClick={handleSaveFloor} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Add Floor</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT ROOM MODAL */}
            {showRoomModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-black text-slate-900 mb-4">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Number *</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                                    placeholder="e.g. 101"
                                    value={roomInput.room_number}
                                    onChange={(e) => setRoomInput(p => ({ ...p, room_number: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bed Type *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                                    value={roomInput.bed_type_id}
                                    onChange={(e) => setRoomInput(p => ({ ...p, bed_type_id: e.target.value }))}
                                >
                                    <option value="">Select Bed Type...</option>
                                    {bedTypes
                                        .filter(b => hotel.prices?.some(p => p.bed_type_id === b._id))
                                        .map(b => <option key={b._id} value={b._id}>{b.name}</option>)
                                    }
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Only showing bed types configured in <strong>Pricing</strong> tab.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                                    value={roomInput.status}
                                    onChange={(e) => setRoomInput(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="VACANT">Vacant (Available)</option>
                                    <option value="BOOKED">Booked (Occupied)</option>
                                    <option value="CLEANING">Cleaning (Blocked)</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowRoomModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                                <button onClick={handleSaveRoom} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Room</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelRoomMap;
