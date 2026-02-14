import React from 'react';
import { ClipboardList } from 'lucide-react';
import OrderStatusTracker from '../ui/OrderStatusTracker';

const VisaServicesView = () => (
    <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Visa Logistics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OrderStatusTracker label="Visa Files" total={500} done={450} booked={20} cancelled={30} />
            <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[3px] mb-8">Recent Applications</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400"><ClipboardList size={20} /></div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Passport Renewal - Group A</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Submitted 2 Days Ago</p>
                            </div>
                        </div>
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Processing</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default VisaServicesView;
