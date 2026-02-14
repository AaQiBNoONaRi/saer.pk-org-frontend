import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

const Header = ({ activeTab, onToggleSidebar }) => (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-40">
        <div className="flex items-center space-x-3">
            <button onClick={onToggleSidebar} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                <Menu size={22} />
            </button>
            <h2 className="font-bold text-slate-900 uppercase tracking-widest text-xs md:text-sm truncate ml-2">{activeTab}</h2>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6">
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-5 py-2 border border-slate-200 focus-within:bg-white focus-within:ring-2 ring-blue-50 transition-all">
                <Search size={14} className="text-slate-400 mr-3" />
                <input type="text" placeholder="Global Search..." className="bg-transparent border-none text-xs font-medium outline-none w-32 md:w-48 lg:w-64" />
            </div>
            <button className="relative p-2.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl border border-slate-100">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>
        </div>
    </header>
);

export default Header;
