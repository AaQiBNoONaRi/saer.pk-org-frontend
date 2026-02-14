import React from 'react';

const HotelsView = () => (
    <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Floor Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-3">
                {[5, 4, 3, 2, 1].map(f => (
                    <div key={f} className={`p-6 rounded-[24px] border ${f === 3 ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 border-blue-600' : 'bg-white border-slate-100 hover:border-blue-100'} transition-all cursor-pointer font-black text-sm uppercase tracking-widest`}>
                        Floor {f}
                    </div>
                ))}
            </div>
            <div className="lg:col-span-3 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[301, 302, 303, 304, 305, 306, 307, 308].map(room => (
                    <div key={room} className={`h-32 rounded-3xl border-2 p-6 flex flex-col justify-between ${room % 3 === 0 ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-blue-100'} cursor-pointer transition-all`}>
                        <span className="text-2xl font-black text-slate-900">{room}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${room % 3 === 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                            {room % 3 === 0 ? 'Booked' : 'Vacant'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default HotelsView;
