import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Box, Users, UsersRound, ScanLine,
    ShieldCheck, Truck, ClipboardList, LogOut, UserCircle,
    ChevronUp, ChevronDown, CreditCard, Landmark, Menu, X
} from 'lucide-react';



export default function Sidebar({ activeTab, setActiveTab, isSidebarOpen, setSidebarOpen, setIsLoggedIn }) {
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isPartnersOpen, setPartnersOpen] = useState(false);
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Sync mobile state
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

    return (
        <>
            {/* 1. Backdrop Overlay for Mobile */}
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 2. Main Sidebar Container */}
            <aside
                className={`fixed inset-y-0 left-0 lg:relative z-[50] flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 overflow-hidden shadow-xl lg:shadow-none
                ${isSidebarOpen ? 'w-72 translate-x-0' : isMobile ? 'w-72 -translate-x-full' : 'w-20 translate-x-0'}`}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between shrink-0 h-20">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        {isSidebarOpen ? (
                            <div className="flex flex-col animate-in fade-in zoom-in-95 duration-300">
                                <img
                                    src="/logo.png"
                                    alt="Saer.Pk"
                                    className="h-12 w-auto object-contain"
                                />
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

                {/* Scrollable Navigation Area */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 scrollbar-hide">
                    <NavGroup title="Core Business" isOpen={isSidebarOpen}>
                        <NavItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dashboard"
                            active={activeTab === 'Dashboard'}
                            onClick={() => handleNavClick('Dashboard')}
                            isOpen={isSidebarOpen}
                        />

                        <NavDropdown
                            icon={<Box size={20} />}
                            label="Inventory"
                            isOpen={isSidebarOpen}
                            isExpanded={isInventoryOpen}
                            onClick={() => setInventoryOpen(!isInventoryOpen)}
                            active={['Packages', 'Hotels', 'Tickets', 'Flights', 'Visa & Other'].includes(activeTab)}
                        >
                            <DropdownItem label="Packages" active={activeTab === 'Packages'} onClick={() => handleNavClick('Packages')} />
                            <DropdownItem label="Hotels" active={activeTab === 'Hotels'} onClick={() => handleNavClick('Hotels')} />
                            <DropdownItem label="Tickets" active={activeTab === 'Tickets'} onClick={() => handleNavClick('Tickets')} />
                            <DropdownItem label="Flights" active={activeTab === 'Flights'} onClick={() => handleNavClick('Flights')} />
                            <DropdownItem label="Others" active={activeTab === 'Others'} onClick={() => handleNavClick('Other')} />
                        </NavDropdown>
                    </NavGroup>

                    <NavGroup title="Financials" isOpen={isSidebarOpen}>
                        <NavItem icon={<Landmark size={20} />} label="Finance Hub" active={activeTab === 'Finance Hub'} onClick={() => handleNavClick('Finance Hub')} isOpen={isSidebarOpen} />
                        <NavItem icon={<CreditCard size={20} />} label="Payments" active={activeTab === 'Payments'} onClick={() => handleNavClick('Payments')} isOpen={isSidebarOpen} />
                    </NavGroup>

                    <NavGroup title="CRM & Partners" isOpen={isSidebarOpen}>
                        <NavItem
                            icon={<Users size={20} />}
                            label="Customers"
                            active={activeTab === 'Customer Database'}
                            onClick={() => handleNavClick('Customer Database')}
                            isOpen={isSidebarOpen}
                        />
                        <NavItem
                            icon={<ScanLine size={20} />}
                            label="Leads"
                            active={activeTab === 'Lead Management'}
                            onClick={() => handleNavClick('Lead Management')}
                            isOpen={isSidebarOpen}
                        />

                        <NavDropdown
                            icon={<UsersRound size={20} />}
                            label="Entities"
                            isOpen={isSidebarOpen}
                            isExpanded={isPartnersOpen}
                            onClick={() => setPartnersOpen(!isPartnersOpen)}
                            active={['Organization', 'Branch', 'Agencies', 'Employees'].includes(activeTab)}
                        >
                            <DropdownItem label="Organization" active={activeTab === 'Organization'} onClick={() => handleNavClick('Organization')} />
                            <DropdownItem label="Branch" active={activeTab === 'Branch'} onClick={() => handleNavClick('Branch')} />
                            <DropdownItem label="Agencies" active={activeTab === 'Agencies'} onClick={() => handleNavClick('Agencies')} />
                            <DropdownItem label="Employees" active={activeTab === 'Employees'} onClick={() => handleNavClick('Employees')} />
                        </NavDropdown>
                    </NavGroup>

                    <NavGroup title="Operations" isOpen={isSidebarOpen}>
                        <NavItem icon={<ShieldCheck size={20} />} label="Visa Services" active={activeTab === 'Visa Services'} onClick={() => handleNavClick('Visa Services')} isOpen={isSidebarOpen} />
                        <NavItem icon={<Truck size={20} />} label="Pax Movement" active={activeTab === 'Pax Movement'} onClick={() => handleNavClick('Pax Movement')} isOpen={isSidebarOpen} />
                        <NavItem icon={<ClipboardList size={20} />} label="Order Delivery" active={activeTab === 'Order Delivery'} onClick={() => handleNavClick('Order Delivery')} isOpen={isSidebarOpen} />
                    </NavGroup>
                </nav>

                {/* Footer Profile Section */}
                <div className="p-4 border-t bg-slate-50 shrink-0 relative">
                    {isUserMenuOpen && isSidebarOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-[60]">
                            <button onClick={() => { handleNavClick('Profile'); setUserMenuOpen(false); }} className="w-full flex items-center space-x-3 p-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left">
                                <UserCircle size={18} className="text-slate-400" />
                                <span>Profile Setup</span>
                            </button>
                            <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center space-x-3 p-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold shadow-lg shrink-0 uppercase">HA</div>
                            {isSidebarOpen && (
                                <div className="min-w-0 transition-opacity duration-200">
                                    <p className="text-xs font-black text-slate-800 uppercase truncate">Hassan Ali</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">General Manager</p>
                                </div>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <ChevronUp size={16} className={`text-slate-300 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

// --- HELPER COMPONENTS ---

const NavGroup = ({ title, children, isOpen }) => (
    <div className="mb-2 shrink-0">
        {isOpen ? (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 pl-4 whitespace-nowrap animate-in fade-in duration-300">
                {title}
            </p>
        ) : (
            <div className="h-4" />
        )}
        <div className="space-y-1">{children}</div>
    </div>
);

const NavDropdown = ({ icon, label, children, isOpen, isExpanded, onClick, active }) => (
    <div className="overflow-hidden">
        <button
            onClick={onClick}
            className={`flex items-center justify-between w-full p-3 rounded-xl transition-all group ${active
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                } ${!isOpen ? 'justify-center' : ''}`}
        >
            <div className="flex items-center">
                <div className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>{icon}</div>
                {isOpen && (
                    <span className="ml-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
                )}
            </div>
            {isOpen && (
                <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : 'text-slate-300'}`} />
            )}
        </button>
        <div className={`space-y-1 transition-all duration-300 ease-in-out ${isExpanded && isOpen ? 'max-h-96 opacity-100 mt-2 pb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className={`pl-4 space-y-1 ${!isOpen && 'hidden'}`}>
                <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

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

const DropdownItem = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-[1.5px] transition-all whitespace-nowrap ${active ? 'text-blue-600 bg-blue-50/50 font-black' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
    >
        {label}
    </button>
);
