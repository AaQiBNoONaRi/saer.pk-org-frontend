import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const SearchableSelect = ({ label, options = [], value, onChange, placeholder = 'Search and select...' }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const filtered = options.filter(opt => {
        const labelText = (typeof opt === 'object' && opt !== null) ? opt.label : String(opt || '');
        return labelText.toLowerCase().includes(query.toLowerCase());
    });

    return (
        <div className="space-y-2" ref={ref}>
            {label && <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1 tracking-widest">{label}</label>}
            <div className="relative">
                <div
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus-within:ring-4 ring-blue-50 focus-within:bg-white transition-all cursor-pointer flex items-center gap-2"
                    onClick={() => {
                        setOpen(prev => !prev);
                        if (!open) setQuery('');
                    }}
                >
                    {open ? (
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-700 placeholder-slate-400 min-w-0"
                            placeholder="Type to search..."
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`flex-1 text-xs font-bold truncate ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                            {(typeof value === 'object' && value !== null) ? value.label : (value || placeholder)}
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>

                {open && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="max-h-56 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="px-5 py-3 text-xs text-slate-400 font-bold">No results found</div>
                            ) : (
                                filtered.map((opt, i) => {
                                    const val = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
                                    const lab = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
                                    const currentVal = (typeof value === 'object' && value !== null) ? value.value : value;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                onChange(opt);
                                                setQuery('');
                                                setOpen(false);
                                            }}
                                            className={`px-5 py-3 text-xs font-bold cursor-pointer transition-colors hover:bg-blue-50 hover:text-blue-700 ${val === currentVal ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                                                }`}
                                        >
                                            {lab}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;
