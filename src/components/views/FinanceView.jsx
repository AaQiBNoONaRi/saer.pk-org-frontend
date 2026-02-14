import React from 'react';
import { Activity } from 'lucide-react';

const FinanceView = () => (
    <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Finance Command</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[3px] mb-8 border-b pb-6">Consolidated Balance Sheet</h3>
                <table className="w-full">
                    <tbody className="divide-y divide-slate-50">
                        <FinancialRow label="Cash in Hand" value="PKR 840,000" type="asset" />
                        <FinancialRow label="Bank Deposits" value="PKR 4,200,000" type="asset" />
                        <FinancialRow label="Customer Advances" value="PKR 2,100,000" type="liability" />
                    </tbody>
                </table>
            </div>
            <div className="bg-blue-600 p-12 rounded-[40px] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-sm font-bold opacity-70 uppercase tracking-[4px] mb-4">Total Net Profit</p>
                    <h4 className="text-6xl font-black tracking-tighter">PKR 1.25M</h4>
                </div>
                <Activity size={120} className="absolute -bottom-8 -right-8 opacity-10 rotate-12" />
            </div>
        </div>
    </div>
);

const FinancialRow = ({ label, value, type }) => (
    <tr>
        <td className="py-6 px-4 text-xs font-black text-slate-600 uppercase tracking-[2px]">{label}</td>
        <td className={`py-6 px-4 text-right text-sm font-black ${type === 'asset' ? 'text-green-600' : 'text-red-500'}`}>{value}</td>
    </tr>
);

export default FinanceView;
