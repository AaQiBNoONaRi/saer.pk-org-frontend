import React from 'react';
import { Building2, Truck, ShieldCheck, Plane, Utensils, DollarSign } from 'lucide-react';

const PackagesView = ({ onNavigate, onEdit }) => {
    const [packages, setPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/packages/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPackages(data);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPackages();
    }, []);

    const handleDelete = async (pkg) => {
        if (!window.confirm(`Are you sure you want to delete "${pkg.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/packages/${pkg.id || pkg._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Package deleted successfully!');
                fetchPackages(); // Refresh the list
            } else {
                const errorData = await response.json();
                alert('Failed to delete package: ' + (errorData.detail || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting package:', error);
            alert('Error deleting package: ' + error.message);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading packages...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Umrah Packages</h2>
                    {/* <p className="text-slate-500 font-medium">Create and distribute itinerary templates.</p> */}
                </div>
                <button onClick={() => onNavigate('Add Package')} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100">+ New Package</button>
            </div>

            <div className="space-y-6">
                {packages.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50 rounded-[40px] border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-medium">No packages found. Create your first package!</p>
                    </div>
                ) : (
                    packages.map(pkg => (
                        <UmrahPackageCard
                            key={pkg._id}
                            packageData={pkg}
                            onEdit={onEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const UmrahPackageCard = ({ packageData, onEdit, onDelete }) => {
    // Helper to format price
    const formatPrice = (price) => price ? price.toLocaleString() : 'N/A';

    // Debug: Log package data to see hotel structure
    console.log('Package Data:', packageData);
    console.log('Hotels:', packageData.hotels);

    // Get hotels for display
    const hotels = packageData.hotels || [];

    // Get prices for display
    const prices = packageData.package_prices || {};

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{packageData.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                        {packageData.flight && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Plane size={12} className="text-blue-600" /> <span className="hidden sm:inline">Flight Included</span><span className="sm:hidden">Flight</span>
                            </span>
                        )}
                        {packageData.visa_pricing && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <ShieldCheck size={12} className="text-blue-600" /> <span className="hidden sm:inline">Visa Included</span><span className="sm:hidden">Visa</span>
                            </span>
                        )}
                        {packageData.food && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Utensils size={12} className="text-blue-600" /> <span className="hidden sm:inline">Food Included</span><span className="sm:hidden">Food</span>
                            </span>
                        )}
                        {packageData.transport && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Truck size={12} className="text-blue-600" /> {packageData.transport.sector}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">{packageData.pax_capacity} Seats Capacity</span>
                    <div className="w-full sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-2/3"></div></div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-6 lg:mb-8">

                {/* Left Column: Services Details (7 cols) */}
                <div className="lg:col-span-7 space-y-4 lg:space-y-6">

                    {/* Hotels */}
                    {hotels.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {hotels.map((hotel, index) => (
                                <QuickInfo
                                    key={index}
                                    label={`${hotel.city} Hotel`}
                                    value={hotel.name || 'Not specified'}
                                    icon={<Building2 size={16} />}
                                />
                            ))}
                        </div>
                    )}

                    {/* Flight Details (Conditional) */}
                    {packageData.flight && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Plane size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Details</span>
                            </div>

                            <div className="space-y-4">
                                {/* Outbound */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Outbound</p>
                                        <p className="text-xs font-black text-slate-900">{packageData.flight.airline}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Route</p>
                                        <p className="text-xs font-black text-slate-900">
                                            {packageData.flight.departure_city} <span className="text-slate-400">→</span> {packageData.flight.arrival_city}
                                        </p>
                                    </div>
                                </div>

                                {/* Return (if available) */}
                                {packageData.flight.return_flight && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Return</p>
                                            <p className="text-xs font-black text-slate-900">{packageData.flight.return_flight.airline || packageData.flight.airline}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Route</p>
                                            <p className="text-xs font-black text-slate-900">
                                                {packageData.flight.return_flight.departure_city} <span className="text-slate-400">→</span> {packageData.flight.return_flight.arrival_city}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Pricing (5 cols) */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900 rounded-[32px] p-6 text-white h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <DollarSign size={18} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Package Pricing</span>
                        </div>

                        <div className="space-y-4">
                            {prices.sharing && (
                                <PriceRow label="Sharing" price={prices.sharing.selling} />
                            )}
                            {prices.quint && (
                                <PriceRow label="Quint" price={prices.quint.selling} />
                            )}
                            {prices.quad && (
                                <PriceRow label="Quad" price={prices.quad.selling} />
                            )}
                            {prices.triple && (
                                <PriceRow label="Triple" price={prices.triple.selling} />
                            )}
                            {prices.double && (
                                <PriceRow label="Double" price={prices.double.selling} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                    onClick={() => onDelete && onDelete(packageData)}
                    className="py-3 sm:py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all border-2 border-red-100 hover:border-red-200"
                >
                    Delete Package
                </button>
                <button
                    onClick={() => onEdit && onEdit(packageData)}
                    className="py-3 sm:py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    Edit Package
                </button>
            </div>
        </div>
    );
};

const QuickInfo = ({ label, value, icon }) => (
    <div className="min-w-0 bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-blue-600 shrink-0">{icon}</span>
            <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter" title={value}>{value}</span>
        </div>
    </div>
);

const PriceRow = ({ label, price }) => (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="text-right">
            <span className="text-[10px] text-emerald-400 font-bold mr-1">PKR</span>
            <span className="text-lg font-black tracking-tight">{price ? price.toLocaleString() : 'N/A'}</span>
        </div>
    </div>
);

export default PackagesView;
