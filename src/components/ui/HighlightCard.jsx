import React from 'react';

const HighlightCard = ({ label, title, sub, time, icon, color }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-lg ${color === 'blue' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-green-600 text-white shadow-green-100'}`}>{icon}</div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] truncate pr-4">{label}</span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest shrink-0">{time}</span>
            </div>
            <h4 className="text-xl font-black text-slate-900 truncate tracking-tight">{title}</h4>
            <p className="text-sm font-bold text-slate-500 mt-2 truncate">{sub}</p>
        </div>
        <div className={`absolute top-0 right-0 w-48 h-48 rotate-45 translate-x-24 -translate-y-24 rounded-[60px] opacity-10 ${color === 'blue' ? 'bg-blue-600' : 'bg-green-600'}`}></div>
    </div>
);

export default HighlightCard;
