import React from 'react';
import { MapPin, Star, Building, Calendar, Settings } from 'lucide-react';

const HotelCard = ({ hotel, onEdit, onDelete, onManageRooms, onManageAvailability }) => {
    // Generate star icons based on rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={14}
                className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
            />
        ));
    };

    // Format distance for display
    const formatDistance = (meters) => {
        if (meters < 1000) return `${meters}m`;
        return `${(meters / 1000).toFixed(1)}km`;
    };

    // Get lowest price
    const getLowestPrice = () => {
        if (!hotel.prices || hotel.prices.length === 0) return null;
        // Prices have selling_price, not price
        return Math.min(...hotel.prices.map(p => p.selling_price || 0));
    };

    const lowestPrice = getLowestPrice();

    return (
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 hover:shadow-xl transition-all duration-300 hover:border-blue-100 flex flex-col h-full group">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-slate-900 line-clamp-1">{hotel.name}</h3>
                        {hotel.is_active && (
                            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Active" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                        {renderStars(hotel.star_rating)}
                    </div>
                </div>
            </div>

            {/* Location Badge */}
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="font-bold text-slate-700">{hotel.city}</span>
                <span className="text-slate-300">|</span>
                <span>{formatDistance(hotel.distance_from_haram)} to Haram</span>
            </div>

            {/* Pricing Summary */}
            <div className="mb-6 flex-1">
                {lowestPrice !== null ? (
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Starting from</p>
                        <p className="text-lg font-black text-blue-600">
                            SAR {lowestPrice} <span className="text-sm text-slate-400 font-normal">/ night</span>
                        </p>
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 italic">No pricing configured</div>
                )}
            </div>

            {/* Operations Actions */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                    onClick={() => onManageRooms(hotel)}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                    <Building size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rooms & Floors</span>
                </button>
                <button
                    onClick={() => onManageAvailability(hotel)}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                    <Calendar size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Availability</span>
                </button>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(hotel)}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Settings size={14} /> Edit Details
                </button>
                <button
                    onClick={() => onDelete(hotel)}
                    className="px-3 py-2 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default HotelCard;
