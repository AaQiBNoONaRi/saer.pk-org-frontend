import React from 'react';
import { Settings } from 'lucide-react';

const GenericView = ({ tabName }) => (
    <div className="bg-white rounded-[40px] p-20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Settings size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{tabName}</h3>
        <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
            The {tabName} system is currently being mapped to your agency's operational data.
        </p>
    </div>
);

export default GenericView;
