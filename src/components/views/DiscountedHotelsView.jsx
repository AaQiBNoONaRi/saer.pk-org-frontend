import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function DiscountedHotelsView({ permissions = null }) {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/discounted-hotels/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHotels(data);
            } else {
                console.error('Failed to fetch discounted hotels', res.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = hotels.filter(h =>
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) || h.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center text-slate-500">Loading discounted hotels...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase">Discounted Hotels</h2>
                    <p className="text-sm text-slate-500">Showing hotels for your organization only</p>
                </div>
                <div className="w-80">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search hotels or city..." className="w-full pl-10 pr-3 py-2 rounded-xl border" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full p-8 bg-slate-50 rounded-xl text-center text-slate-400">No discounted hotels found</div>
                ) : (
                    filtered.map(h => (
                        <div key={h._id} className="bg-white p-4 rounded-xl border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-slate-900">{h.name}</h3>
                                    <p className="text-xs text-slate-500">{h.city}</p>
                                </div>
                                <div className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString()}</div>
                            </div>
                            <div className="mt-3 text-sm text-slate-600">
                                <div><strong>Discount:</strong> {h.discount?.type === 'percentage' ? `${h.discount.amount}%` : h.discount?.amount ? `PKR ${h.discount.amount}` : '—'}</div>
                                <div className="text-xs text-slate-500 mt-1">Created by: {h.created_by_employee_id || 'System'}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
