import React, { useState } from 'react';
import {
    Users, MapPin, Plane, RefreshCw,
    CheckCircle2, Clock, Search, Filter, ChevronDown
} from 'lucide-react';

// --- Custom Stat Card ---
const StatCard = ({ label, value, icon: Icon, colorTheme }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    slate: "bg-slate-100 text-slate-500 border-slate-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  const themeClass = themes[colorTheme] || themes.slate;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100/60 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl border ${themeClass} transition-transform group-hover:scale-110`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
  );
};

export default function PaxMovementView() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');

    const handleRefresh = () => {
        // This will call API to refresh data
        console.log('Refreshing data...');
    };

    return (
        <div className="space-y-6">
            
            {/* Page Title & Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <Plane size={24} className="text-blue-600" />
                  Pax Movement & Intimation
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Track passenger entry/exit and verify KSA movements</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <RefreshCw size={16} />
                Refresh Data
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <StatCard label="Total Passengers" value="0" icon={Users} colorTheme="blue" />
              <StatCard label="In Pakistan 🇵🇰" value="0" icon={MapPin} colorTheme="slate" />
              <StatCard label="In Flight ✈️" value="0" icon={Plane} colorTheme="cyan" />
              <StatCard label="In Makkah 🕋" value="0" icon={MapPin} colorTheme="emerald" />
              <StatCard label="In Madina 🕌" value="0" icon={MapPin} colorTheme="emerald" />
              <StatCard label="Exit Pending ⏳" value="0" icon={Clock} colorTheme="amber" />
              <StatCard label="Exited KSA ✅" value="0" icon={CheckCircle2} colorTheme="emerald" />
            </div>

            {/* Filter and List Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100/50 min-h-[500px] flex flex-col overflow-hidden">
              
              {/* Filter Bar */}
              <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-center gap-4">
                
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name, passport, pax ID, or agent..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hidden sm:flex shadow-sm">
                    <Filter size={18} />
                  </div>
                  
                  <div className="relative w-full sm:w-44">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pakistan">In Pakistan</option>
                      <option value="flight">In Flight</option>
                      <option value="ksa">In KSA</option>
                      <option value="exited">Exited KSA</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>

                  <div className="relative w-full sm:w-44">
                    <select 
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="all">All Cities</option>
                      <option value="makkah">Makkah</option>
                      <option value="madina">Madina</option>
                      <option value="jeddah">Jeddah</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

              </div>

              {/* Data Table / Empty State */}
              <div className="flex-1 bg-slate-50/30">
                <div className="overflow-x-auto h-full">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-100 bg-white">
                           {['Pax ID', 'Name & Passport', 'Agent', 'Current Location', 'Status', 'Last Updated', 'Actions'].map((header, i) => (
                              <th key={i} className={`px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>
                                 {header}
                              </th>
                           ))}
                        </tr>
                     </thead>
                     <tbody>
                        {/* Empty State UI */}
                        <tr>
                           <td colSpan={7} className="px-6 py-32 text-center">
                              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                 <div className="w-20 h-20 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mb-5">
                                    <Users size={32} className="text-slate-400" />
                                 </div>
                                 <h3 className="text-lg font-black text-slate-800 mb-2">No passengers found</h3>
                                 <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                    We couldn't find any passenger records matching your search or filter criteria. Try adjusting your filters.
                                 </p>
                              </div>
                           </td>
                        </tr>
                     </tbody>
                  </table>
                </div>
              </div>

            </div>

        </div>
    );
}
