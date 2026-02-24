import React, { useState, useEffect } from 'react';
import { 
  BedDouble,
  MapPin,
  Bus,
  Plane,
  Coffee,
  User,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/daily-operations';

// --- Custom Components ---
const TabButton = ({ label, icon: Icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 pb-4 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap relative top-[1px]
      ${active 
        ? 'text-blue-600 border-blue-600' 
        : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'}
    `}
  >
    {Icon && <Icon size={16} strokeWidth={active ? 2.5 : 2} />}
    {label}
  </button>
);

const HotelStatCard = ({ title, count, date }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-black text-blue-600">{count}</h3>
      <p className="text-xs font-medium text-slate-400 mt-1">{date}</p>
    </div>
    <div className="w-10 h-10 rounded-full bg-blue-600 shadow-md shadow-blue-600/30 flex items-center justify-center shrink-0">
      <BedDouble size={20} className="text-white" />
    </div>
  </div>
);

const SectionHeading = ({ title, icon: Icon }) => (
  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
    {Icon && <Icon className="text-slate-500" size={20} />}
    {title}
  </h3>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: Clock },
    checked_in: { color: 'bg-green-100 text-green-700', label: 'Checked In', icon: CheckCircle },
    checked_out: { color: 'bg-blue-100 text-blue-700', label: 'Checked Out', icon: CheckCircle },
    departed: { color: 'bg-purple-100 text-purple-700', label: 'Departed', icon: CheckCircle },
    arrived: { color: 'bg-green-100 text-green-700', label: 'Arrived', icon: CheckCircle },
    served: { color: 'bg-green-100 text-green-700', label: 'Served', icon: CheckCircle },
    started: { color: 'bg-blue-100 text-blue-700', label: 'Started', icon: CheckCircle },
    completed: { color: 'bg-green-100 text-green-700', label: 'Completed', icon: CheckCircle },
    not_picked: { color: 'bg-red-100 text-red-700', label: 'Not Picked', icon: XCircle },
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', label: status, icon: AlertCircle };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// --- Main Component ---
export default function DailyOperationsView() {
  const [activeTab, setActiveTab] = useState('Hotel Check-in/Check-out');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Stats for hotel operations
  const [stats, setStats] = useState({
    today_checkins: 0,
    tomorrow_checkins: 0,
    today_checkouts: 0
  });

  // Operations data
  const [operations, setOperations] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');

  // Fetch stats (for hotel dashboard)
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/stats?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch operations based on active tab
  const fetchOperations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ date: selectedDate });

      // Add operation type filter based on active tab
      if (activeTab === 'Hotel Check-in/Check-out') params.append('operation_type', 'hotel');
      if (activeTab === 'Transport') params.append('operation_type', 'transport');
      if (activeTab === 'Airport') params.append('operation_type', 'airport');
      if (activeTab === 'Food') params.append('operation_type', 'food');
      if (activeTab === 'Ziyarat') params.append('operation_type', 'ziyarat');

      const response = await fetch(`${API_BASE_URL}/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch operations');
      
      const data = await response.json();
      
      // Extract the correct operations array based on active tab
      let operationsArray = [];
      if (activeTab === 'Hotel Check-in/Check-out') {
        operationsArray = data.hotel_operations || [];
      } else if (activeTab === 'Transport') {
        operationsArray = data.transport_operations || [];
      } else if (activeTab === 'Airport') {
        operationsArray = data.airport_operations || [];
      } else if (activeTab === 'Food') {
        operationsArray = data.food_operations || [];
      } else if (activeTab === 'Ziyarat') {
        operationsArray = data.ziyarat_operations || [];
      } else if (activeTab === 'Pax Details') {
        // Combine all operations for Pax Details tab
        operationsArray = [
          ...(data.hotel_operations || []),
          ...(data.transport_operations || []),
          ...(data.airport_operations || []),
          ...(data.food_operations || []),
          ...(data.ziyarat_operations || [])
        ];
      }
      
      setOperations(operationsArray);
    } catch (error) {
      console.error('Error fetching operations:', error);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms (for hotel operations)
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch rooms');
      
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  // Determine operation type from operation_id prefix
  const getOperationType = (operationId) => {
    if (operationId.startsWith('HOP-')) return 'hotel';
    if (operationId.startsWith('TOP-')) return 'transport';
    if (operationId.startsWith('FOP-')) return 'food';
    if (operationId.startsWith('AOP-')) return 'airport';
    if (operationId.startsWith('ZOP-')) return 'ziyarat';
    return 'hotel'; // default
  };

  // Update operation status
  const updateStatus = async (operationId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      const operationType = getOperationType(operationId);
      
      const response = await fetch(`${API_BASE_URL}/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation_id: operationId,
          operation_type: operationType,
          new_status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update status');
      }
      
      // Refresh operations after update
      await fetchOperations();
      if (activeTab === 'Hotel Check-in/Check-out') {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOperations();
    if (activeTab === 'Hotel Check-in/Check-out') {
      fetchStats();
      fetchRooms();
    }
  }, [selectedDate, activeTab]);

  // Filter operations based on search query
  const filteredOperations = operations.filter(op => {
    const query = searchQuery.toLowerCase();
    return (
      op.booking_id?.toLowerCase().includes(query) ||
      op.pax_name?.toLowerCase().includes(query) ||
      op.hotel_name?.toLowerCase().includes(query) ||
      op.hotel_city?.toLowerCase().includes(query) ||
      op.location?.toLowerCase().includes(query) ||
      op.route?.toLowerCase().includes(query) ||
      op.vehicle_number?.toLowerCase().includes(query) ||
      op.meal_type?.toLowerCase().includes(query) ||
      op.transfer_type?.toLowerCase().includes(query) ||
      op.flight_number?.toLowerCase().includes(query)
    );
  });

  // Renders the Hotel Tab View
  const renderHotelTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HotelStatCard 
          title="Today's Check-ins" 
          count={stats.today_checkins || 0} 
          date={selectedDate} 
        />
        <HotelStatCard 
          title="Tomorrow's Check-ins" 
          count={stats.tomorrow_checkins || 0} 
          date={new Date(new Date(selectedDate).getTime() + 86400000).toISOString().split('T')[0]} 
        />
        <HotelStatCard 
          title="Today's Check-outs" 
          count={stats.today_checkouts || 0} 
          date={selectedDate} 
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check-In Date</label>
            <input 
              type="date" 
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check-Out Date</label>
            <input 
              type="date" 
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hotel</label>
            <div className="relative">
              <select 
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              >
                <option value="">All hotels</option>
                {[...new Set(operations.map(op => op.hotel_name).filter(Boolean))].map((hotel, idx) => (
                  <option key={idx} value={hotel}>{hotel}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search by booking id, hotel, city, pax name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
          <button 
            onClick={() => {
              fetchOperations();
              fetchStats();
            }}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Hotel', 'City', 'Check In', 'Check Out', 'Status', 'Pax', 'Actions'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 7 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-24 text-center">
                  <p className="text-sm font-bold text-slate-500">Loading...</p>
                </td>
              </tr>
            ) : filteredOperations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-24 text-center">
                  <p className="text-sm font-bold text-slate-500">No records found for selected date.</p>
                </td>
              </tr>
            ) : (
              filteredOperations
                .filter(op => !selectedHotel || op.hotel_name === selectedHotel)
                .filter(op => !checkInDate || op.check_in_date === checkInDate)
                .filter(op => !checkOutDate || op.check_out_date === checkOutDate)
                .map((operation, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-700">{operation.booking_id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-600">{operation.hotel_name || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-500">{operation.hotel_city || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-500">{operation.check_in_date || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-500">{operation.check_out_date || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={operation.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-600">{operation.pax_name || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {operation.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(operation.operation_id, 'checked_in')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {operation.status === 'checked_in' && (
                          <button
                            onClick={() => updateStatus(operation.operation_id, 'checked_out')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renders standard filter row used in other tabs
  const renderStandardFilters = (placeholderText) => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-1 shadow-sm shrink-0">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</span>
         <input 
           type="date" 
           value={selectedDate} 
           onChange={(e) => setSelectedDate(e.target.value)}
           className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none py-1.5" 
         />
      </div>
      <input 
        type="text" 
        placeholder={placeholderText} 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
      />
      <button 
        onClick={fetchOperations}
        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap shrink-0"
      >
        Refresh
      </button>
    </div>
  );

  // Renders the Ziyarat Tab
  const renderZiyaratTab = () => (
    <div className="animate-in fade-in duration-300">
      <SectionHeading title="Ziyarat (Delivered Bookings)" icon={MapPin} />
      {renderStandardFilters("Search by booking id, location, pax...")}
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Location', 'City', 'Date', 'Status', 'Pax', 'Actions'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">Loading...</td></tr>
            ) : filteredOperations.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">No records found.</td></tr>
            ) : (
              filteredOperations.map((operation, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-bold text-slate-700">{operation.booking_id}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.location || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.city || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.visit_date || 'N/A'}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={operation.status} /></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.passenger_count ? `${operation.passenger_count} Pax` : 'N/A'}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {operation.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(operation.operation_id, 'started')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {operation.status === 'started' && (
                        <button
                          onClick={() => updateStatus(operation.operation_id, 'completed')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renders the Transport Tab
  const renderTransportTab = () => (
    <div className="animate-in fade-in duration-300">
      <SectionHeading title="Transport (Delivered Bookings)" icon={Bus} />
      {renderStandardFilters("Search by booking id, vehicle...")}
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Vehicle', 'Route', 'Pickup Time', 'Status', 'Pax', 'Actions'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">Loading...</td></tr>
            ) : filteredOperations.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">No records found.</td></tr>
            ) : (
              filteredOperations.map((operation, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-bold text-slate-700">{operation.booking_id}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.vehicle_number || operation.route || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.route || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.pickup_time || 'N/A'}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={operation.status} /></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.passenger_count ? `${operation.passenger_count} Pax` : 'N/A'}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {operation.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(operation.operation_id, 'departed')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Departed
                        </button>
                      )}
                      {operation.status === 'departed' && (
                        <button
                          onClick={() => updateStatus(operation.operation_id, 'arrived')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Arrived
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renders the Airport Tab
  const renderAirportTab = () => (
    <div className="animate-in fade-in duration-300">
      <SectionHeading title="Airport / Flights (Delivered Bookings)" icon={Plane} />
      {renderStandardFilters("Search by booking id, flight...")}
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Transfer Type', 'Flight No', 'Date', 'Status', 'Pax', 'Actions'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">Loading...</td></tr>
            ) : filteredOperations.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-slate-500">No records found.</td></tr>
            ) : (
              filteredOperations.map((operation, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-bold text-slate-700">{operation.booking_id}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.transfer_type || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.flight_number || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.transfer_date || 'N/A'}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={operation.status} /></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.passenger_count ? `${operation.passenger_count} Pax` : 'N/A'}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {operation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(operation.operation_id, 'arrived')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Arrived
                          </button>
                          <button
                            onClick={() => updateStatus(operation.operation_id, 'not_picked')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Not Picked
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renders the Food Tab
  const renderFoodTab = () => (
    <div className="animate-in fade-in duration-300">
      <SectionHeading title="Food / Meals (Delivered Bookings)" icon={Coffee} />
      {renderStandardFilters("Search by booking id, meal type...")}
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Meal Type', 'Date', 'Status', 'Pax', 'Actions'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 5 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-slate-500">Loading...</td></tr>
            ) : filteredOperations.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-slate-500">No records found.</td></tr>
            ) : (
              filteredOperations.map((operation, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-bold text-slate-700">{operation.booking_id}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.meal_type || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.service_date || 'N/A'}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={operation.status} /></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.passenger_count ? `${operation.passenger_count} Pax` : 'N/A'}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {operation.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(operation.operation_id, 'served')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Mark Served
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renders the Pax Details Tab
  const renderPaxTab = () => (
    <div className="animate-in fade-in duration-300">
      <SectionHeading title="Passenger Details (Delivered Bookings)" icon={User} />
      {renderStandardFilters("Search by name, passport, booking ID...")}
      <div className="mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Passengers: <span className="text-slate-800 font-black">{filteredOperations.length}</span></span>
      </div>
      <div className="overflow-x-auto bg-slate-50/50 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Booking ID', 'Name', 'Operation Type', 'Date', 'Status', 'Details'].map((h, i) => (
                <th key={i} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 5 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-slate-500">Loading...</td></tr>
            ) : filteredOperations.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-slate-500">No passengers found.</td></tr>
            ) : (
              filteredOperations.map((operation, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                  <td className="px-5 py-4"><span className="text-sm font-bold text-slate-700">{operation.booking_id}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-slate-600">{operation.pax_name || 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500 capitalize">{operation.operation_id?.substring(0, 3) === 'HOP' ? 'Hotel' : operation.operation_id?.substring(0, 3) === 'TOP' ? 'Transport' : operation.operation_id?.substring(0, 3) === 'AOP' ? 'Airport' : operation.operation_id?.substring(0, 3) === 'FOP' ? 'Food' : operation.operation_id?.substring(0, 3) === 'ZOP' ? 'Ziyarat' : 'N/A'}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-500">{operation.check_in_date || operation.transport_date || operation.service_date || operation.transfer_date || operation.visit_date || 'N/A'}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={operation.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Main Layout Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 min-h-[600px] flex flex-col p-8">
        
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-6">Daily Operations</h2>

        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
          <TabButton 
            label="Hotel Check-in/Check-out" 
            icon={BedDouble}
            active={activeTab === 'Hotel Check-in/Check-out'} 
            onClick={() => setActiveTab('Hotel Check-in/Check-out')} 
          />
          <TabButton 
            label="Ziyarat" 
            icon={MapPin}
            active={activeTab === 'Ziyarat'} 
            onClick={() => setActiveTab('Ziyarat')} 
          />
          <TabButton 
            label="Transport" 
            icon={Bus}
            active={activeTab === 'Transport'} 
            onClick={() => setActiveTab('Transport')} 
          />
          <TabButton 
            label="Airport" 
            icon={Plane}
            active={activeTab === 'Airport'} 
            onClick={() => setActiveTab('Airport')} 
          />
          <TabButton 
            label="Food" 
            icon={Coffee}
            active={activeTab === 'Food'} 
            onClick={() => setActiveTab('Food')} 
          />
          <TabButton 
            label="Pax Details" 
            icon={User}
            active={activeTab === 'Pax Details'} 
            onClick={() => setActiveTab('Pax Details')} 
          />
        </div>

        {/* Tab Content Renderer */}
        <div className="flex-1">
          {activeTab === 'Hotel Check-in/Check-out' && renderHotelTab()}
          {activeTab === 'Ziyarat' && renderZiyaratTab()}
          {activeTab === 'Transport' && renderTransportTab()}
          {activeTab === 'Airport' && renderAirportTab()}
          {activeTab === 'Food' && renderFoodTab()}
          {activeTab === 'Pax Details' && renderPaxTab()}
        </div>

      </div>
    </div>
  );
}
