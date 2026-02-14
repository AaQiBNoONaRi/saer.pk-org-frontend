import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const KpiCard = ({ label, value, trend, trendUp, icon, subtext }) => (
    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-500">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{label}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
                {subtext && <p className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline uppercase mt-1 tracking-widest">{subtext}</p>}
            </div>
        </div>
        {trend && (
            <div className={`flex items-center text-[10px] font-black px-3 py-1.5 rounded-xl ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />} {trend}
            </div>
        )}
    </div>
);

export default KpiCard;
