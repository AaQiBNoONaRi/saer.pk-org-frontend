import React from 'react';
import { UsersRound, UserPlus, Wallet, Ticket, PackageCheck } from 'lucide-react';
import KpiCard from '../ui/KpiCard';
import OrderStatusTracker from '../ui/OrderStatusTracker';
import HighlightCard from '../ui/HighlightCard';
import { Landmark } from 'lucide-react';

const DashboardView = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <KpiCard label="Working Agents" value="1,200" trend="+2.98%" trendUp icon={<UsersRound className="text-blue-600" size={24} />} />
            <KpiCard label="New Agents" value="2,845" trend="-1.45%" trendUp={false} icon={<UserPlus className="text-blue-400" size={24} />} />
            <KpiCard label="Recovery Pending" value="Rs. 12,890" subtext="See Payment" icon={<Wallet className="text-orange-500" size={24} />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OrderStatusTracker label="Tickets" total={1200} done={800} booked={300} cancelled={100} />
            <OrderStatusTracker label="Hotels" total={1200} done={600} booked={500} cancelled={100} />
            <OrderStatusTracker label="Visa" total={1200} done={950} booked={200} cancelled={50} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HighlightCard label="Last Booking" title="Umrah Packages - Salman" sub="Rs. 150,000 • 5D/5N" time="JUST NOW" icon={<Ticket size={24} />} color="blue" />
            <HighlightCard label="Last Delivery" title="Visa File - ORD-9912" sub="Delivered to Lahore Office" time="12 MINS AGO" icon={<PackageCheck size={24} />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Bookings</h3>
                    <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all">View All Bookings</button>
                </div>
                <div className="overflow-x-auto w-full scrollbar-hide">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-50/50">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                <th className="px-8 py-5">Traveler</th>
                                <th className="px-8 py-5">Package Name</th>
                                <th className="px-8 py-5">Payment</th>
                                <th className="px-8 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <BookingRow name="Salman Khan" pkg="Premium Umrah Feb" price="Rs.150,000" status="CONFIRMED" />
                            <BookingRow name="Raphael Goodman" pkg="Family Star Group" price="Rs.210,000" status="PENDING" />
                            <BookingRow name="James Dunn" pkg="Economy Express" price="Rs.85,000" status="CONFIRMED" />
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 text-center">February 2026</h4>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={`h-${i}`} className="text-[10px] font-black text-slate-300 uppercase">{d}</span>)}
                        {[...Array(28)].map((_, i) => (
                            <div key={`d-${i}`} className={`text-[10px] font-bold py-3 rounded-2xl transition-all cursor-pointer ${i + 1 === 5 ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-slate-50 text-slate-600'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-4">Top Recoveries</h4>
                    <RecoveryItem name="TravelEase Multan" amount="Rs.12,890" />
                    <RecoveryItem name="Al-Khair Agency" amount="Rs.45,500" />
                </div>
            </div>
        </div>
    </div>
);

const BookingRow = ({ name, pkg, price, status }) => (
    <tr className="hover:bg-blue-50/20 transition-all group cursor-pointer">
        <td className="px-8 py-6 text-xs font-black text-slate-900 uppercase tracking-tighter">{name}</td>
        <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{pkg}</td>
        <td className="px-8 py-6 text-sm font-black text-blue-600 tracking-tighter">{price}</td>
        <td className="px-8 py-6">
            <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-2 tracking-widest ${status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{status}</span>
        </td>
    </tr>
);

const RecoveryItem = ({ name, amount }) => (
    <div className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all cursor-pointer group shadow-sm">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:shadow-md transition-all"><Landmark size={18} /></div>
            <div>
                <p className="text-[11px] font-black text-slate-900 leading-none uppercase tracking-tighter">{name}</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase mt-2 tracking-widest">View Ledger</p>
            </div>
        </div>
        <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{amount}</span>
    </div>
);

export default DashboardView;
