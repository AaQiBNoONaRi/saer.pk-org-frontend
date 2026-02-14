import React from 'react';

const InputGroup = ({ label, placeholder, icon, type = 'text', value, onChange, ...props }) => (
    <div className="flex-1">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block pl-2 tracking-widest">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">{icon}</div>}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all`}
                {...props}
            />
        </div>
    </div>
);

export default InputGroup;
