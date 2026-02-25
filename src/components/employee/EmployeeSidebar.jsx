import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, ScanLine, LogOut, UserCircle,
    ChevronUp, Menu, X, Briefcase
} from 'lucide-react';

export default function EmployeeSidebar({ activeTab, setActiveTab, isSidebarOpen, setSidebarOpen, onLogoClick }) {
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('employee_data');
        if (data) {
            try { setEmployeeData(JSON.parse(data)); } catch { }
        }
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setSidebarOpen]);

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        if (isMobile) setSidebarOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('employee_data');
        window.location.reload();
    };

    const permissions = employeeData?.permissions || [];
    const hasCRM = permissions.includes('crm');
    const hasEmployees = permissions.includes('employees');

    const initials = employeeData?.name
        ? employeeData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'EM';

    return (
        <>
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-45 transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 lg:relative z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 overflow-hidden shadow-xl lg:shadow-none
                ${isSidebarOpen ? 'w-72 translate-x-0' : isMobile ? 'w-72 -translate-x-full' : 'w-20 translate-x-0'}`}
            >
                {/* Logo */}
                <div className="p-6 flex items-center justify-between shrink-0 h-20">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        {isSidebarOpen ? (
                            <div
                                className="flex flex-col animate-in fade-in zoom-in-95 duration-300 cursor-pointer"
                                onClick={onLogoClick}
                                title="My Profile"
                            >
                                <img src="/logo.png" alt="Saer.Pk" className="h-12 w-auto object-contain hover:opacity-80 transition-opacity" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">S</div>
                            </div>
                        )}
                    </div>
                    {isMobile && (
                        <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Employee Badge */}
                {isSidebarOpen && (
                    <div className="mx-4 mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-600 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Employee Portal</p>
                            <p className="text-[10px] font-bold text-blue-400 truncate">{employeeData?.role?.replace(/_/g, ' ') || 'Employee'}</p>
                        </div>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 scrollbar-hide">

                    {/* Dashboard - always visible */}
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={activeTab === 'Dashboard'}
                        onClick={() => handleNavClick('Dashboard')}
                        isOpen={isSidebarOpen}
                    />

                    {/* CRM Section */}
                    {hasCRM && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    CRM
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<Users size={20} />}
                                label="Customers"
                                active={activeTab === 'Customers'}
                                onClick={() => handleNavClick('Customers')}
                                isOpen={isSidebarOpen}
                            />
                        </>
                    )}

                    {/* Employees Section */}
                    {hasEmployees && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    HR
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<Users size={20} />}
                                label="Employees"
                                active={activeTab === 'Employees'}
                                onClick={() => handleNavClick('Employees')}
                                isOpen={isSidebarOpen}
                            />
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 shrink-0 relative">
                    {isUserMenuOpen && isSidebarOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-60">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 p-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}

                    <div
                        className={`flex items-center p-2 rounded-2xl transition-all cursor-pointer hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 ${!isSidebarOpen ? 'justify-center' : ''}`}
                        onClick={() => isSidebarOpen && setUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold shadow-lg shrink-0 uppercase text-sm">
                                {initials}
                            </div>
                            {isSidebarOpen && (
                                <div className="min-w-0 transition-opacity duration-200">
                                    <p className="text-xs font-black text-slate-800 uppercase truncate">{employeeData?.name || 'Employee'}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                        {employeeData?.entity_type || 'Portal'} Employee
                                    </p>
                                </div>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <ChevronUp size={16} className={`text-slate-300 transition-transform duration-300 ml-auto ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

const NavItem = ({ icon, label, active, onClick, isOpen }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full p-3 rounded-xl transition-all group overflow-hidden ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
            : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
            } ${!isOpen ? 'justify-center' : ''}`}
    >
        <div className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
            {icon}
        </div>
        {isOpen && (
            <span className="ml-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                {label}
            </span>
        )}
    </button>
);
