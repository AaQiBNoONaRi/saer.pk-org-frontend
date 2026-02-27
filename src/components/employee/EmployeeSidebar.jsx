import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, ScanLine, LogOut, UserCircle,
    ChevronUp, Menu, X, Briefcase, Package, Hotel, Plane, Ticket,
    Box, DollarSign, Receipt, TrendingUp, FileText, Building2,
    ClipboardList
} from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

export default function EmployeeSidebar({ activeTab, setActiveTab, isSidebarOpen, setSidebarOpen, onLogoClick }) {
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(true);
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('employee_data');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setEmployeeData(parsed);
                console.log('🔐 Employee Permissions:', parsed?.permissions);
            } catch (err) {
                console.error('Failed to parse employee_data', err);
            }
        }

        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Permission-derived flags
    const hasFlag = (permObj) => Object.values(permObj || {}).some(Boolean);

    const pkgPerms = getModulePermissions('inventory.packages');
    const hotelsPerms = getModulePermissions('inventory.hotels');
    const ticketsPerms = getModulePermissions('inventory.tickets');
    const flightsPerms = getModulePermissions('inventory.flights');
    const othersPerms = getModulePermissions('inventory.others');
    const sharePerms = getModulePermissions('inventory.share');

    const hasInventoryPackages = hasFlag(pkgPerms);
    const hasInventoryHotels = hasFlag(hotelsPerms);
    const hasInventoryTickets = hasFlag(ticketsPerms);
    const hasInventoryFlights = hasFlag(flightsPerms);
    const hasInventoryOthers = hasFlag(othersPerms);
    const hasInventoryShare = hasFlag(sharePerms);

    const hasAnyInventory = hasInventoryPackages || hasInventoryHotels || hasInventoryTickets || hasInventoryFlights || hasInventoryOthers || hasInventoryShare;

    // Pricing
    const discountsPerms = getModulePermissions('pricing.discounts');
    const commissionsPerms = getModulePermissions('pricing.commissions');
    const serviceChargesPerms = getModulePermissions('pricing.service_charges');
    const hasPricingDiscounts = hasFlag(discountsPerms);
    const hasPricingCommissions = hasFlag(commissionsPerms);
    const hasPricingServiceCharges = hasFlag(serviceChargesPerms);
    const hasAnyPricing = hasPricingDiscounts || hasPricingCommissions || hasPricingServiceCharges;

    // Finance / Payments
    const financePerms = getModulePermissions('finance');
    const paymentsPerms = getModulePermissions('payments');
    const hasFinance = hasFlag(financePerms);
    const hasPayments = hasFlag(paymentsPerms);

    // CRM / Customers
    const customersPerms = getModulePermissions('customers');
    const hasCRM = hasFlag(customersPerms);
    const hasCustomers = hasCRM;

    // HR / Employees
    const employeesPerms = getModulePermissions('hr.employees');
    const attendancePerms = getModulePermissions('hr.attendance');
    const movementsPerms = getModulePermissions('hr.movements');
    const hrCommissionsPerms = getModulePermissions('hr.commissions');
    const punctualityPerms = getModulePermissions('hr.punctuality');
    const approvalsPerms = getModulePermissions('hr.approvals');

    const hasEmployees = hasFlag(employeesPerms);
    const hasAttendance = hasFlag(attendancePerms);
    const hasMovements = hasFlag(movementsPerms);
    const hasHRCommissions = hasFlag(hrCommissionsPerms);
    const hasPunctuality = hasFlag(punctualityPerms);
    const hasApprovals = hasFlag(approvalsPerms);

    // Show HR section if user has any HR-related permission
    const hasHR = hasEmployees || hasAttendance || hasMovements || hasHRCommissions || hasPunctuality || hasApprovals;

    // Entities & Content
    const entitiesPerms = getModulePermissions('entities');
    const contentPerms = getModulePermissions('content');
    const hasEntities = hasFlag(entitiesPerms);
    const hasContent = hasFlag(contentPerms);

    // UI helpers
    const initials = employeeData?.name ? employeeData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EM';

    const handleNavClick = (label) => {
        if (setActiveTab) setActiveTab(label);
        if (isMobile && setSidebarOpen) setSidebarOpen(false);
    };

    const handleLogout = () => {
        try {
            // Clear employee session and tokens
            localStorage.removeItem('employee_data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirect to login page and open Employee tab
            window.location.href = '/login?mode=employee';
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

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

                    {/* Inventory Section */}
                    {hasAnyInventory && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Inventory
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            
                            {hasInventoryPackages && (
                                <NavItem
                                    icon={<Package size={20} />}
                                    label="Packages"
                                    active={activeTab === 'Packages'}
                                    onClick={() => handleNavClick('Packages')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                            
                            {hasInventoryHotels && (
                                <NavItem
                                    icon={<Hotel size={20} />}
                                    label="Hotels"
                                    active={activeTab === 'Hotels'}
                                    onClick={() => handleNavClick('Hotels')}
                                    isOpen={isSidebarOpen}
                                />
                            )}

                            
                            {hasInventoryTickets && (
                                <NavItem
                                    icon={<Ticket size={20} />}
                                    label="Tickets"
                                    active={activeTab === 'Tickets'}
                                    onClick={() => handleNavClick('Tickets')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                            
                            {/* Flights and Discounted Hotels removed for Employee sidebar */}
                            
                            {hasInventoryOthers && (
                                <NavItem
                                    icon={<Box size={20} />}
                                    label="Others"
                                    active={activeTab === 'Others'}
                                    onClick={() => handleNavClick('Others')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                            {hasInventoryShare && (
                                <NavItem
                                    icon={<Briefcase size={20} />}
                                    label="Share Inventory"
                                    active={activeTab === 'Share Inventory'}
                                    onClick={() => handleNavClick('Share Inventory')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                        </>
                    )}

                    {/* Pricing Section */}
                    {hasAnyPricing && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Pricing
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            
                            {hasPricingDiscounts && (
                                <NavItem
                                    icon={<DollarSign size={20} />}
                                    label="Discounts"
                                    active={activeTab === 'Discounts'}
                                    onClick={() => handleNavClick('Discounts')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                            
                            {hasPricingCommissions && (
                                <NavItem
                                    icon={<TrendingUp size={20} />}
                                    label="Commissions"
                                    active={activeTab === 'Commissions'}
                                    onClick={() => handleNavClick('Commissions')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                            
                            {hasPricingServiceCharges && (
                                <NavItem
                                    icon={<Receipt size={20} />}
                                    label="Service Charges"
                                    active={activeTab === 'Service Charges'}
                                    onClick={() => handleNavClick('Service Charges')}
                                    isOpen={isSidebarOpen}
                                />
                            )}
                        </>
                    )}

                    {/* Finance Section */}
                    {hasFinance && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Finance
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<FileText size={20} />}
                                label="Finance"
                                active={activeTab === 'Finance'}
                                onClick={() => handleNavClick('Finance')}
                                isOpen={isSidebarOpen}
                            />
                        </>
                    )}

                    {/* Payments Section */}
                    {hasPayments && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Payments
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<Receipt size={20} />}
                                label="Payments"
                                active={activeTab === 'Payments'}
                                onClick={() => handleNavClick('Payments')}
                                isOpen={isSidebarOpen}
                            />
                        </>
                    )}

                    {/* CRM / Customers Section */}
                    {(hasCRM || hasCustomers) && (
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

                    {/* HR / Employees Section */}
                    {(hasEmployees || hasHR) && (
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

                    {/* Entities Section */}
                    {hasEntities && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Entities
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<Building2 size={20} />}
                                label="Entities"
                                active={activeTab === 'Entities'}
                                onClick={() => handleNavClick('Entities')}
                                isOpen={isSidebarOpen}
                            />
                        </>
                    )}

                    {/* Content & Operations Section */}
                    {hasContent && (
                        <>
                            {isSidebarOpen && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1 pl-2 pt-4">
                                    Operations
                                </p>
                            )}
                            {!isSidebarOpen && <div className="h-4" />}
                            <NavItem
                                icon={<ClipboardList size={20} />}
                                label="Operations"
                                active={activeTab === 'Operations'}
                                onClick={() => handleNavClick('Operations')}
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
