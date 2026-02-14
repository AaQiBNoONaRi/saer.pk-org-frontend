import React from 'react';
import {
    ArrowLeft, Calendar, MapPin, Building2, Plane, Star,
    Utensils, CheckCircle2, ShieldCheck, Bus, Map, Info,
    Edit, DollarSign, Users, Baby
} from 'lucide-react';

const PackageDetailView = ({ packageData, onBack, onEdit }) => {
    if (!packageData) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    // Helper to format currency
    const formatPrice = (price) => {
        return price ? `Rs. ${price.toLocaleString()}` : 'N/A';
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold">Back to Packages</span>
                </button>
                <div className="flex gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(packageData)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                        >
                            <Edit size={16} />
                            <span>Edit Package</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 lg:p-10">
                    <div className="flex flex-collg:flex-row justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Umrah Package
                                </span>
                                {packageData.pax_capacity && (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Users size={12} /> {packageData.pax_capacity} Pax
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
                                {packageData.title}
                            </h1>
                            <p className="text-slate-500 max-w-2xl leading-relaxed">
                                {packageData.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Highlights Summary */}
                        <div className="flex flex-wrap gap-4 lg:justify-end items-start">
                            {packageData.hotels?.length > 0 && (
                                <div className="text-center p-4 bg-slate-50 rounded-2xl min-w-[100px]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                    <p className="text-xl font-black text-slate-900">
                                        {packageData.hotels.reduce((acc, h) => acc + (parseInt(h.nights) || 0), 0)} Nights
                                    </p>
                                </div>
                            )}
                            <div className="text-center p-4 bg-emerald-50 rounded-2xl min-w-[100px]">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Starting From</p>
                                <p className="text-xl font-black text-emerald-700">
                                    {formatPrice(packageData.package_prices?.sharing?.selling || packageData.package_prices?.quint?.selling || packageData.package_prices?.quad?.selling)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Itinerary Details (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Flight Details */}
                    {packageData.flight && (
                        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                                <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Plane size={16} />
                                </span>
                                Flight Details
                            </h3>

                            <div className="space-y-4">
                                {/* Outbound */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-1 rounded">Outbound</span>
                                        <span className="text-xs font-bold text-slate-700">{packageData.flight.airline}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-black text-slate-900 text-lg">{packageData.flight.departure_trip?.departure_city}</p>
                                            <p className="text-xs text-slate-500">{formatDate(packageData.flight.departure_trip?.departure_datetime)}</p>
                                        </div>
                                        <div className="flex-1 px-4 flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400">Direct</span>
                                            <div className="w-full h-px bg-slate-300 relative my-2">
                                                <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-lg">{packageData.flight.departure_trip?.arrival_city}</p>
                                            <p className="text-xs text-slate-500">{formatDate(packageData.flight.departure_trip?.arrival_datetime)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Return */}
                                {packageData.flight.return_trip && (
                                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded">Return</span>
                                            <span className="text-xs font-bold text-slate-700">{packageData.flight.return_trip.airline || packageData.flight.airline}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-black text-slate-900 text-lg">{packageData.flight.return_trip.departure_city}</p>
                                                <p className="text-xs text-slate-500">{formatDate(packageData.flight.return_trip.departure_datetime)}</p>
                                            </div>
                                            <div className="flex-1 px-4 flex flex-col items-center">
                                                <span className="text-[10px] text-slate-400">Direct</span>
                                                <div className="w-full h-px bg-slate-300 relative my-2">
                                                    <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 -rotate-90" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-lg">{packageData.flight.return_trip.arrival_city}</p>
                                                <p className="text-xs text-slate-500">{formatDate(packageData.flight.return_trip.arrival_datetime)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Accommodation */}
                    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                            <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <Building2 size={16} />
                            </span>
                            Accommodation
                        </h3>
                        <div className="space-y-4">
                            {packageData.hotels?.map((hotel, index) => (
                                <div key={index} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{hotel.city}</span>
                                            <div className="flex gap-0.5 text-amber-400">
                                                <Star size={10} fill="currentColor" />
                                                <Star size={10} fill="currentColor" />
                                                <Star size={10} fill="currentColor" />
                                                <Star size={10} fill="currentColor" />
                                                <Star size={10} fill="currentColor" />
                                            </div>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg mb-1">{hotel.name}</h4>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {formatDate(hotel.check_in)} — {formatDate(hotel.check_out)} • <span className="text-slate-900 font-bold">{hotel.nights} Nights</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inclusions */}
                    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                            <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <CheckCircle2 size={16} />
                            </span>
                            Included Services
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {packageData.visa_pricing && (
                                <ServiceCard icon={<ShieldCheck size={18} />} title="Visa Processing" subtitle="Included in package" color="emerald" />
                            )}
                            {packageData.transport && (
                                <ServiceCard icon={<Bus size={18} />} title={packageData.transport.title} subtitle={packageData.transport.sector} color="blue" />
                            )}
                            {packageData.food && (
                                <ServiceCard icon={<Utensils size={18} />} title={packageData.food.title} subtitle="Full Board" color="orange" />
                            )}
                            {packageData.ziyarat && (
                                <ServiceCard icon={<Map size={18} />} title={packageData.ziyarat.title} subtitle="Guided Tours" color="purple" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Pricing & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-[32px] p-6 text-white sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <DollarSign size={18} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Package Pricing</span>
                        </div>

                        <div className="space-y-4 mb-8">
                            {packageData.package_prices?.sharing && (
                                <PriceRow label="Sharing" price={packageData.package_prices.sharing.selling} highlight />
                            )}
                            {packageData.package_prices?.quint && (
                                <PriceRow label="Quint Occupancy" price={packageData.package_prices.quint.selling} />
                            )}
                            {packageData.package_prices?.quad && (
                                <PriceRow label="Quad Occupancy" price={packageData.package_prices.quad.selling} />
                            )}
                            {packageData.package_prices?.triple && (
                                <PriceRow label="Triple Occupancy" price={packageData.package_prices.triple.selling} />
                            )}
                            {packageData.package_prices?.double && (
                                <PriceRow label="Double Occupancy" price={packageData.package_prices.double.selling} />
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-700/50">
                            <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-emerald-500/20">
                                Book This Package
                            </button>
                            <p className="text-[10px] text-slate-400 text-center mt-3">
                                Detailed quote available upon request
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServiceCard = ({ icon, title, subtitle, color = "blue" }) => {
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
};

const PriceRow = ({ label, price, highlight }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-white/10 border border-white/10' : ''}`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`font-black ${highlight ? 'text-emerald-400 text-lg' : 'text-white'}`}>
            Rs. {price?.toLocaleString()}
        </span>
    </div>
);

export default PackageDetailView;
