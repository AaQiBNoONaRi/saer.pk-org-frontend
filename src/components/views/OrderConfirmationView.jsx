import React, { useState } from 'react';
import {
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    FileText,
    Check,
    Calendar,
    ChevronDown,
    Search,
    Users,
    Building2,
    Bus,
    Plane,
    Plus,
    Trash2
} from 'lucide-react';
import TicketPrintView from './TicketPrintView';

// --- Custom Components ---
const StatusRow = ({ label, value }) => (
    <div className="flex items-center justify-end gap-3 mb-2.5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}:</span>
        <span className="text-xs font-bold text-white bg-blue-400 px-4 py-1.5 rounded-lg min-w-[80px] text-center shadow-sm">{value}</span>
    </div>
);

const TopFilterButton = ({ label }) => (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
        {label}
        <ChevronDown size={14} />
    </button>
);

const InnerTab = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
    px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
    ${active
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm'}
  `}>
        {label}
    </button>
);

const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-4">
        {Icon && <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600"><Icon size={18} /></div>}
        <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
);

// Form Inputs
const Label = ({ children }) => (
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">{children}</label>
);

const TextInput = ({ placeholder, defaultValue, icon: Icon }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
        <input
            type="text"
            placeholder={placeholder}
            defaultValue={defaultValue}
            className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm`}
        />
    </div>
);

const SelectInput = ({ options, defaultValue }) => (
    <div className="relative">
        <select
            defaultValue={defaultValue}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm"
        >
            {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </div>
);

const Checkbox = ({ label }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div className="w-4 h-4 rounded border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 transition-colors">
            <input type="checkbox" className="hidden peer" />
            <Check size={12} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={4} />
            <div className="absolute w-4 h-4 rounded bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none -z-10"></div>
        </div>
        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
    </label>
);

const Stepper = ({ steps, activeStepIndex }) => (
    <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto my-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full -z-10 transition-all" style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}></div>

        {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isPast = index < activeStepIndex;
            return (
                <div key={index} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-4 transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-100 ring-4 ring-blue-50' :
                        isPast ? 'bg-blue-500 border-blue-500' : 'bg-slate-100 border-white'
                        }`}>
                        {isPast && <Check size={14} className="text-white" strokeWidth={3} />}
                        {isActive && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`absolute mt-10 text-[10px] font-black uppercase tracking-wider w-32 text-center ${isActive ? 'text-blue-700' : isPast ? 'text-slate-700' : 'text-slate-400'
                        }`}>{step}</span>
                </div>
            );
        })}
    </div>
);

export default function OrderConfirmationView({ onBack, orderId }) {
    const [selectedPassengers, setSelectedPassengers] = useState([2]); // Pre-select passenger 2 as in image
    const [activeTab, setActiveTab] = useState('Visa');

    const togglePassenger = (id) => {
        setSelectedPassengers(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const passengers = [
        { id: 1, type: 'Adult', bed: 'Yes', name: 'Ali RAZa', passport: '123AK098', expiry: 'Sun 16/2023', status: 'Approved', actionLabel: 'Download Passport', isActionDestructive: false },
        { id: 2, type: 'Adult', bed: 'Yes', name: 'Hamza Butt', passport: '123AK442', expiry: 'Sun 16/2023', status: 'Approved', actionLabel: 'Download Passport', isActionDestructive: false },
        { id: 3, type: 'Adult', bed: 'Yes', name: 'Umar Jutt', passport: '123AK668', expiry: 'Sun 16/2023', status: 'Rejected', actionLabel: 'Not Included', isActionDestructive: true },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FD] font-sans text-slate-800 selection:bg-blue-100">
            <div className="p-4 md:px-8 md:pb-8 space-y-4">

                {/* Secondary Search & Date Filter (Right Aligned) */}
                <div className="hidden md:flex justify-end gap-3 mb-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search name, package, etc" className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm" />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        Today
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>
                </div>

                {/* Top Navigation Bar / Filters */}
               

                {/* Main Content Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 overflow-hidden">

                    <div className="p-8">
                        {/* 1. Header Grid */}
                        <div className="flex flex-col xl:flex-row justify-between gap-8 mb-8 border-b border-slate-100 pb-8">

                            {/* Left Side: Order Info & Actions */}
                            <div className="flex-1 space-y-6">

                                {/* Title & Tabs */}
                                <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                                    <div
                                        className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-fit group"
                                        onClick={onBack}
                                    >
                                        <div className="p-2 bg-slate-50 rounded-full group-hover:bg-slate-100 transition-colors">
                                            <ArrowLeft size={18} className="text-slate-600" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800">Order Number <span className="text-slate-400 font-medium text-lg">({orderId || 'sjdns'})</span></h2>
                                    </div>

                                    {/* Inner Tabs */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <InnerTab label="Visa" active={activeTab === 'Visa'} onClick={() => setActiveTab('Visa')} />
                                        <InnerTab label="Hotel Voucher" active={activeTab === 'Hotel Voucher'} onClick={() => setActiveTab('Hotel Voucher')} />
                                        <InnerTab label="Tickets" active={activeTab === 'Tickets'} onClick={() => setActiveTab('Tickets')} />
                                    </div>
                                </div>

                                {/* Action Buttons & Details */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 w-full lg:w-auto order-2 lg:order-1">
                                        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                            <Printer size={16} /> Print
                                        </button>
                                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-sm font-bold hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                                            <Download size={16} /> Download
                                        </button>
                                        <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                            <FileText size={16} /> see invoice
                                        </button>
                                    </div>

                                    {/* Agent Info */}
                                    <div className="flex flex-wrap gap-x-12 gap-y-4 order-1 lg:order-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Name:</p>
                                            <p className="text-sm font-bold text-slate-800">Reman Rafique</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agency Name:</p>
                                            <p className="text-sm font-bold text-slate-800">92 World travel</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact:</p>
                                            <p className="text-sm font-bold text-slate-800">+923631569595</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Status Pills */}
                            <div className="w-full xl:w-64 flex flex-col justify-start bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <StatusRow label="Visa" value="N/A" />
                                <StatusRow label="Hotel Voucher" value="N/A" />
                                <StatusRow label="Transport" value="N/A" />
                                <StatusRow label="Tickets" value="N/A" />
                            </div>
                        </div>

                        {/* 2. Summary Table */}
                        <div className="mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-transparent">
                                            <th className="pb-3 pr-6">Order No</th>
                                            <th className="pb-3 px-6 text-center">Agency Code</th>
                                            <th className="pb-3 px-6 text-center">Agreement Status</th>
                                            <th className="pb-3 px-6 text-center">Package No</th>
                                            <th className="pb-3 px-6 text-center">Total Pax</th>
                                            <th className="pb-3 px-6">Balance</th>
                                            <th className="pb-3 pl-6 text-center bg-slate-50/50 rounded-t-xl">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="text-sm font-bold text-slate-800">
                                            <td className="py-4 pr-6">sjdns</td>
                                            <td className="py-4 px-6 text-center">222463</td>
                                            <td className="py-4 px-6 text-center">Active</td>
                                            <td className="py-4 px-6 text-center">23336</td>
                                            <td className="py-4 px-6 text-center text-blue-600">3</td>
                                            <td className="py-4 px-6 text-rose-600">PKR 1,000</td>
                                            <td className="py-4 pl-6 text-center bg-blue-50/30 rounded-b-xl border border-t-0 border-slate-50">
                                                <span className="text-blue-500 font-bold">N/A</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- VISA FORM START --- */}
                        {activeTab === 'Visa' && (
                            <>
                                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Passengers Details For Umrah Package</h3>

                                    <div className="space-y-1.5 w-full md:w-64">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Umrah Visa Shirka</label>
                                        <div className="relative">
                                            <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm">
                                                <option>Rushd al Majd</option>
                                                <option>Other Shirka Option</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Passenger Cards List */}
                                <div className="space-y-3">
                                    {passengers.map((pax) => {
                                        const isSelected = selectedPassengers.includes(pax.id);
                                        return (
                                            <div
                                                key={pax.id}
                                                onClick={() => togglePassenger(pax.id)}
                                                className={`
                                  flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer
                                  ${isSelected ? 'bg-blue-50/30 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50/50'}
                               `}
                                            >
                                                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">

                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'}`}>
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </div>

                                                    {/* Pex Number */}
                                                    <div className="flex items-baseline gap-1 min-w-[70px]">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pex No.</span>
                                                        <span className="text-xl font-black text-slate-800">{pax.id}</span>
                                                    </div>

                                                    <div className="w-[1px] h-8 bg-slate-200 shrink-0 hidden sm:block"></div>

                                                    {/* Type & Bed */}
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 min-w-[120px]">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                                                            <p className="text-sm font-bold text-slate-800">{pax.type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bed</p>
                                                            <p className="text-sm font-bold text-slate-800">{pax.bed}</p>
                                                        </div>
                                                    </div>

                                                    {/* Passenger Info */}
                                                    <div className="min-w-[180px]">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passenger Name</p>
                                                        <p className="text-sm font-black text-slate-800">{pax.name}</p>
                                                    </div>

                                                    {/* Passport Details */}
                                                    <div className="grid grid-cols-2 gap-x-8 min-w-[240px]">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passport Number</p>
                                                            <p className="text-sm font-bold font-mono text-slate-800">{pax.passport}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passport Expiry</p>
                                                            <p className="text-xs font-bold text-slate-600">{pax.expiry}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="min-w-[100px]">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                                                        <span className={`text-xs font-bold ${pax.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {pax.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Link */}
                                                <div className="lg:pl-6 lg:border-l border-slate-200 shrink-0 text-right w-full lg:w-auto mt-2 lg:mt-0">
                                                    <button
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click
                                                        className={`text-xs font-bold transition-colors ${pax.isActionDestructive ? 'text-rose-500 hover:text-rose-600' : 'text-blue-600 hover:text-blue-700'}`}
                                                    >
                                                        {pax.actionLabel}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="flex flex-wrap gap-4 mt-10">
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                                        Visa Applied
                                    </button>
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                                        Send to Embassy
                                    </button>
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                                        Visa approved
                                    </button>
                                    <button disabled className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200">
                                        Application Reject
                                    </button>
                                </div>
                            </>
                        )}
                        {/* --- VISA FORM END --- */}


                        {/* --- VOUCHER FORM START --- */}
                        {activeTab === 'Hotel Voucher' && (
                            <div className="space-y-10 pt-8 border-t border-slate-100">

                                {/* Passengers Details For Hotel Booking */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                    <SectionHeader title="Passengers Details For Hotel Booking" icon={Users} />

                                    <div className="flex gap-4 mb-6 mt-4">
                                        <div className="w-48">
                                            <Label>Order no</Label>
                                            <SelectInput options={['h175ig']} defaultValue="h175ig" />
                                        </div>
                                        <div className="flex-1 max-w-sm">
                                            <Label>Voucher No.</Label>
                                            <TextInput defaultValue="Ali RAZa" />
                                        </div>
                                    </div>

                                    {/* Passenger Rows */}
                                    <div className="space-y-4">
                                        {/* Row 1 */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="md:col-span-1">
                                                <Label>Title</Label>
                                                <SelectInput options={['Mr.', 'Ms.', 'Mrs.']} defaultValue="Mr." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>First Name</Label>
                                                <TextInput defaultValue="Ali RAZa" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Last Name</Label>
                                                <TextInput defaultValue="Ali RAZa" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Enter Passport Number</Label>
                                                <TextInput defaultValue="123AK098" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Pnr</Label>
                                                <TextInput defaultValue="123AK098" />
                                            </div>
                                            <div className="md:col-span-1 flex flex-col gap-2 pb-3">
                                                <Checkbox label="Bed" />
                                                <Checkbox label="VISA" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Family Head</Label>
                                                <SelectInput options={['Jamal Khan', 'Ali RAZa']} defaultValue="Jamal Khan" />
                                            </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                            <div className="md:col-span-1">
                                                <Label>Title</Label>
                                                <SelectInput options={['Mr.', 'Ms.', 'Mrs.']} defaultValue="Mr." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>First Name</Label>
                                                <TextInput defaultValue="Ali RAZa" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Last Name</Label>
                                                <TextInput defaultValue="Ali RAZa" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Enter Passport Number</Label>
                                                <TextInput defaultValue="123AK098" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Pnr</Label>
                                                <TextInput defaultValue="123AK098" />
                                            </div>
                                            <div className="md:col-span-1 flex flex-col gap-2 pb-3">
                                                <Checkbox label="Bed" />
                                                <Checkbox label="VISA" />
                                            </div>
                                            {/* Invisible placeholder to align with row 1 */}
                                            <div className="md:col-span-2"></div>

                                            {/* Remove Button (Hover to see clearly or static) */}
                                            <button className="absolute -right-3 -top-3 w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                                            <Plus size={16} /> Add Passenger
                                        </button>
                                        <button className="px-5 py-2.5 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all">
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Hotel Details 1 */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                    <SectionHeader title="Hotel Details 1" icon={Building2} />
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div>
                                            <Label>Hotel Name</Label>
                                            <SelectInput options={['Rushd al Majd', 'Hilton']} defaultValue="Rushd al Majd" />
                                        </div>
                                        <div>
                                            <Label>Room Type</Label>
                                            <SelectInput options={['shared or quad', 'Double']} defaultValue="shared or quad" />
                                        </div>
                                        <div>
                                            <Label>Sharing Type</Label>
                                            <SelectInput options={['Gender or Family', 'Private']} defaultValue="Gender or Family" />
                                        </div>
                                        <div>
                                            <Label>Check In</Label>
                                            <TextInput defaultValue="Sun 16/2023" icon={Calendar} />
                                        </div>
                                        <div>
                                            <Label>No. of Nights</Label>
                                            <TextInput defaultValue="2" />
                                        </div>

                                        <div>
                                            <Label>Check out</Label>
                                            <TextInput defaultValue="Sun 16/2023" icon={Calendar} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Special request</Label>
                                            <TextInput defaultValue="Haram View" />
                                        </div>
                                        <div>
                                            <Label>Voucher Number</Label>
                                            <TextInput defaultValue="156320a" />
                                        </div>
                                        <div className="flex items-end pb-0.5">
                                            <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                                                Add Hotel
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Transport Details */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                    <SectionHeader title="Transport Details" icon={Bus} />
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <Label>Transport Type</Label>
                                            <SelectInput options={['Company Shared Bus']} defaultValue="Company Shared Bus" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Transport Sector</Label>
                                            <SelectInput options={['Jed(A)-Mak(H)-Mad(H)-Mak(H)-Jed(A)']} defaultValue="Jed(A)-Mak(H)-Mad(H)-Mak(H)-Jed(A)" />
                                        </div>
                                        <div>
                                            <Label>Voucher Number</Label>
                                            <TextInput defaultValue="156320a" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all whitespace-nowrap">
                                                Add Route
                                            </button>
                                            <Checkbox label="Self" />
                                        </div>
                                    </div>
                                </div>

                                {/* Flight Details (Departure Flight) */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                    <SectionHeader title="Flight Details (Departure Flight)" icon={Plane} />
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label>Airline Name or Code</Label>
                                            <SelectInput options={['Saudia(SV)']} defaultValue="Saudia(SV)" />
                                        </div>
                                        <div>
                                            <Label>Flight Number</Label>
                                            <SelectInput options={['Saudia(SV)']} defaultValue="Saudia(SV)" />
                                        </div>
                                        <div>
                                            <Label>From Sector</Label>
                                            <SelectInput options={['Lhe']} defaultValue="Lhe" />
                                        </div>
                                        <div>
                                            <Label>To Sector</Label>
                                            <SelectInput options={['Jed']} defaultValue="Jed" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Travel Date And Time</Label>
                                            <TextInput defaultValue="12-06-2024 / 15:30" icon={Calendar} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Return Date And Time</Label>
                                            <TextInput defaultValue="02-07-2024 / 14:30" icon={Calendar} />
                                        </div>
                                    </div>
                                </div>

                                {/* Flight Details (Return Flight) */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                    <SectionHeader title="Flight Details (Return Flight)" icon={Plane} />
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label>Airline Name or Code</Label>
                                            <SelectInput options={['Saudia(SV)']} defaultValue="Saudia(SV)" />
                                        </div>
                                        <div>
                                            <Label>Flight Number</Label>
                                            <SelectInput options={['Saudia(SV)']} defaultValue="Saudia(SV)" />
                                        </div>
                                        <div>
                                            <Label>From Sector</Label>
                                            <SelectInput options={['Jed']} defaultValue="Jed" />
                                        </div>
                                        <div>
                                            <Label>To Sector</Label>
                                            <SelectInput options={['Lhe']} defaultValue="Lhe" />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label>Travel Date And Time</Label>
                                            <TextInput defaultValue="12-07-2024 / 12:00" icon={Calendar} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label>Return Date And Time</Label>
                                            <TextInput defaultValue="02-07-2024 / 14:30" icon={Calendar} />
                                        </div>
                                        <div className="md:col-span-2 flex items-center gap-4 pt-5">
                                            <span className="text-sm font-bold text-slate-400">or</span>
                                            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                                                Select Flight
                                            </button>
                                            <span className="text-sm font-bold text-slate-400">or</span>
                                            <Checkbox label="Update Flight Detail Later" />
                                        </div>
                                    </div>
                                </div>

                                {/* Checkboxes Area */}
                                <div className="flex flex-wrap gap-x-8 gap-y-4 py-4 border-y border-slate-100">
                                    <Checkbox label="Add visa price" />
                                    <Checkbox label="Long term Visa" />
                                    <Checkbox label="with one side transport" />
                                    <Checkbox label="with full transport" />
                                    <Checkbox label="Only Visa" />
                                    <Checkbox label="FOOD" />
                                    <Checkbox label="Mecca Ziarat" />
                                    <Checkbox label="Medina Ziarat" />
                                    <Checkbox label="APPROVE" />
                                    <Checkbox label="DRAFT" />
                                </div>

                                {/* Notes and Shirka */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                                    <div>
                                        <Label>Add Notes</Label>
                                        <textarea
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-sm h-32"
                                            defaultValue="Saudia(SV)"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <div className="w-full md:w-64">
                                            <Label>Select Umrah Visa Shirka</Label>
                                            <SelectInput options={['Rushd al Majd']} defaultValue="Rushd al Majd" />
                                        </div>
                                    </div>
                                </div>

                                {/* Stepper */}
                                <Stepper
                                    steps={['Submission Pending', 'DRAFT READY', 'Share With Customer']}
                                    activeStepIndex={0}
                                />

                                {/* Bottom Actions */}
                                <div className="flex flex-wrap items-center gap-4 pt-16">
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 min-w-[120px]">
                                        Save
                                    </button>
                                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 min-w-[140px]">
                                        Save & Close
                                    </button>
                                    <button className="px-8 py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm font-bold cursor-not-allowed min-w-[120px]">
                                        Close Only
                                    </button>
                                </div>

                            </div>
                        )}
                        {/* --- VOUCHER FORM END --- */}

                        {/* --- TICKETS CONTENT START --- */}
                        {activeTab === 'Tickets' && (
                            <div className="pt-8 border-t border-slate-100">
                                <TicketPrintView />
                            </div>
                        )}
                        {/* --- TICKETS CONTENT END --- */}

                    </div>
                </div>

            </div>
        </div>
    );
}
