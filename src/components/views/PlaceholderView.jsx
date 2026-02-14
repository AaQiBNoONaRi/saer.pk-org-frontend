import React from 'react';
import { Landmark, GitBranch, Building } from 'lucide-react';

const PlaceholderView = ({ type }) => {
    const icons = {
        'Organization': <Landmark size={48} />,
        'Branch': <GitBranch size={48} />,
        'Agencies': <Building size={48} />
    };

    return (
        <div className="bg-white rounded-[40px] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 mb-8 shadow-2xl shadow-blue-100/50">
                {icons[type]}
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{type} Manager</h3>
            <p className="text-slate-500 max-w-sm mt-4 text-lg font-medium leading-relaxed">
                Configuring the {type} enterprise structure for Saer.Pk's multi-branch environment.
            </p>
            <button className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all">
                Configure Now
            </button>
        </div>
    );
};

export default PlaceholderView;
