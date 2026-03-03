import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import EmployeeSidebar from './EmployeeSidebar';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeHRView from './EmployeeHRView';
import HRManagementView from '../views/HRManagementView';
import EmployeeProfilePage from './EmployeeProfilePage';
import LeadDetailView from '../views/LeadDetailView';
import PackagesView from '../views/PackagesView';
import AddPackageView from '../views/AddPackageView';
import HotelsView from '../views/HotelsView';
import TicketsView from '../views/TicketsView';
import OthersView from '../views/OthersView';
import DiscountsView from '../views/DiscountsView';
import CommissionsView from '../views/CommissionsView';
import ServiceChargesView from '../views/ServiceChargesView';
import DiscountedHotelsView from '../views/DiscountedHotelsView';
import AddDiscountView from '../views/AddDiscountView';
import AddCommissionView from '../views/AddCommissionView';
import AddServiceChargeView from '../views/AddServiceChargeView';
import PaymentsView from '../views/PaymentsView';
import FinanceHub from '../views/finance/FinanceHub';
import OrganizationView from '../views/OrganizationView';
import BranchesView from '../views/BranchesView';
import AgenciesView from '../views/AgenciesView';
import EmployeesView from '../views/EmployeesView';
import { getModulePermissions } from '../../utils/permissions';

export default function EmployeeApp() {
    const employeeData = (() => {
        try { return JSON.parse(localStorage.getItem('employee_data') || '{}'); }
        catch { return {}; }
    })();
    const permissions = employeeData?.permissions || [];
    
    // Helper function to check if user has any permission for a module
    const hasPermission = (permissionPrefix) => {
        if (!Array.isArray(permissions)) return false;
        return permissions.some(p => p && typeof p === 'string' && p.startsWith(permissionPrefix));
    };

    // Check for module permissions
    const hasInventory = hasPermission('inventory.');
    const hasPricing = hasPermission('pricing.');
    const hasFinance = hasPermission('finance.');
    const hasPayments = hasPermission('payments.');
    const hasCustomers = hasPermission('customers.');
    const hasHR = hasPermission('hr.');
    const hasEntities = hasPermission('entities.');
    const hasContent = hasPermission('content.') || hasPermission('operations.');
    
    // Legacy permission checks for backward compatibility
    const hasCRM = permissions.includes('crm') || hasCustomers;
    const hasEmployees = permissions.includes('employees') || hasHR;

    const defaultView = hasEmployees ? 'Employees' : hasCRM ? 'Dashboard' : 'Dashboard';

    const [activeTab, setActiveTab] = useState(defaultView);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const path = window.location.pathname;
    const initialLeadId = path.startsWith('/leads/') ? path.split('/').pop() : null;
    const [viewingLead, setViewingLead] = useState(initialLeadId);
    const [editingPackage, setEditingPackage] = useState(null);
    const [showAddPackage, setShowAddPackage] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [editingCommission, setEditingCommission] = useState(null);
    const [editingServiceCharge, setEditingServiceCharge] = useState(null);

    const initials = (employeeData?.full_name || employeeData?.name || employeeData?.email || 'E')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const renderContent = () => {
        if (showProfile) return <EmployeeProfilePage onBack={() => setShowProfile(false)} />;
        
        // Get permissions for each module
        const packagesPerms = getModulePermissions('inventory.packages');
        const hotelsPerms = getModulePermissions('inventory.hotels');
        const ticketsPerms = getModulePermissions('inventory.tickets');
        const flightsPerms = getModulePermissions('inventory.flights');
        const othersPerms = getModulePermissions('inventory.others');
        const discountsPerms = getModulePermissions('pricing.discounts');
        const commissionsPerms = getModulePermissions('pricing.commissions');
        const serviceChargesPerms = getModulePermissions('pricing.service_charges');
        const discountedHotelsPerms = getModulePermissions('hotels.discounted');
        const paymentsPerms = getModulePermissions('payments');
        const entitiesOrgPerms = getModulePermissions('entities.organization');
        const entitiesBranchPerms = getModulePermissions('entities.branch');
        const entitiesAgenciesPerms = getModulePermissions('entities.agencies');
        const entitiesEmployeesPerms = getModulePermissions('entities.employees');
        
        switch (activeTab) {
            // Inventory modules
            case 'Packages':
                if (hasPermission('inventory.packages')) {
                    if (showAddPackage) {
                        return (
                            <AddPackageView
                                onBack={() => {
                                    setEditingPackage(null);
                                    setShowAddPackage(false);
                                }}
                                initialData={editingPackage}
                            />
                        );
                    }

                    return <PackagesView
                        onNavigate={(target) => {
                            if (target === 'Add Package') {
                                // Only allow create if permitted
                                if (packagesPerms.add) setShowAddPackage(true);
                                else alert('Package creation not available in employee portal yet');
                            }
                        }}
                        onEdit={(pkg) => {
                            // Treat update permission as edit permission
                            if (packagesPerms.update) {
                                setEditingPackage(pkg);
                                setShowAddPackage(true);
                            } else {
                                alert('You do not have permission to edit packages.');
                            }
                        }}
                        onView={(pkg) => {
                            // fallback: open package detail in a new state if needed
                            // For now reuse existing view behavior
                            alert('Package view not implemented in employee portal yet');
                        }}
                        permissions={packagesPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Hotels':
                if (hasPermission('inventory.hotels')) {
                    return <HotelsView 
                        permissions={hotelsPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Tickets':
                if (hasPermission('inventory.tickets')) {
                    return <TicketsView 
                        onNavigate={() => alert('Ticket creation not available in employee portal yet')}
                        onEdit={() => alert('Ticket editing not available in employee portal yet')}
                        permissions={ticketsPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Flights':
                if (hasPermission('inventory.flights')) return <ComingSoonView module="Flights" />;
                return <NoAccessView />;
            case 'Others':
                if (hasPermission('inventory.others')) {
                    return <OthersView 
                        permissions={othersPerms}
                    />;
                }
                return <NoAccessView />;
            
            // Pricing modules
            case 'Discounts':
                if (hasPermission('pricing.discounts')) {
                    return <DiscountsView 
                        onAddDiscount={() => {
                            if (discountsPerms.add) {
                                setEditingDiscount(null);
                                setActiveTab('Add Discount');
                            } else alert('You do not have permission to add discounts.');
                        }}
                        onEditDiscount={(d) => {
                            if (discountsPerms.update) {
                                setEditingDiscount(d);
                                setActiveTab('Add Discount');
                            } else alert('You do not have permission to edit discounts.');
                        }}
                        permissions={discountsPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Commissions':
                if (hasPermission('pricing.commissions')) {
                    return <CommissionsView 
                        onAddCommission={() => {
                            if (commissionsPerms.add) {
                                setEditingCommission(null);
                                setActiveTab('Add Commission');
                            } else alert('You do not have permission to add commissions.');
                        }}
                        onEditCommission={(c) => {
                            if (commissionsPerms.update) {
                                setEditingCommission(c);
                                setActiveTab('Add Commission');
                            } else alert('You do not have permission to edit commissions.');
                        }}
                        permissions={commissionsPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Add Discount':
                // Render employee add discount view if permitted or editing
                if (discountsPerms.add || editingDiscount) {
                    return (
                        <AddDiscountView
                            onBack={() => { setEditingDiscount(null); setActiveTab('Discounts'); }}
                            initialData={editingDiscount}
                        />
                    );
                }
                return <NoAccessView />;
            case 'Add Commission':
                if (commissionsPerms.add || editingCommission) {
                    return (
                        <AddCommissionView
                            onBack={() => { setEditingCommission(null); setActiveTab('Commissions'); }}
                            initialData={editingCommission}
                        />
                    );
                }
                return <NoAccessView />;
            case 'Add Service Charge':
                if (serviceChargesPerms.add || editingServiceCharge) {
                    return (
                        <AddServiceChargeView
                            onBack={() => { setEditingServiceCharge(null); setActiveTab('Service Charges'); }}
                            initialData={editingServiceCharge}
                        />
                    );
                }
                return <NoAccessView />;
            case 'Service Charges':
                if (hasPermission('pricing.service_charges')) {
                    return <ServiceChargesView 
                        onAddServiceCharge={() => {
                            if (serviceChargesPerms.add) {
                                setEditingServiceCharge(null);
                                setActiveTab('Add Service Charge');
                            } else alert('You do not have permission to add service charges.');
                        }}
                        onEditServiceCharge={(s) => {
                            if (serviceChargesPerms.update) {
                                setEditingServiceCharge(s);
                                setActiveTab('Add Service Charge');
                            } else alert('You do not have permission to edit service charges.');
                        }}
                        permissions={serviceChargesPerms}
                    />;
                }
                return <NoAccessView />;
            case 'Discounted Hotels':
                if (hasPermission('hotels.discounted')) {
                    return <DiscountedHotelsView permissions={discountedHotelsPerms} />;
                }
                return <NoAccessView />;
            
            // Finance, Payments, etc.
            case 'Finance':
                if (hasFinance) return <FinanceHub />;
                return <NoAccessView />;
            case 'Payments':
                if (hasPayments) {
                    return <PaymentsView permissions={paymentsPerms} />;
                }
                return <NoAccessView />;
            case 'Entities':
                if (hasEntities) return <ComingSoonView module="Entities" />;
                return <NoAccessView />;
            case 'Entities:Organization':
                if (entitiesOrgPerms.view) return <OrganizationView />;
                return <NoAccessView />;
            case 'Entities:Branch':
                if (entitiesBranchPerms.view) return <BranchesView />;
                return <NoAccessView />;
            case 'Entities:Agencies':
                if (entitiesAgenciesPerms.view) return <AgenciesView />;
                return <NoAccessView />;
            case 'Entities:Employees':
                if (entitiesEmployeesPerms.view) return <EmployeesView />;
                return <NoAccessView />;
            case 'Operations':
                if (hasContent) return <ComingSoonView module="Operations" />;
                return <NoAccessView />;
            
            // HR/Employees
            case 'Employees':
                // If the employee has full HR permissions (org-level HR access), show the full HR management UI
                if (hasHR) return <HRManagementView />;
                // Otherwise, if this user has employee-scoped employees permission, show the personal HR view
                if (hasEmployees) return <EmployeeHRView />;
                return <NoAccessView />;
            
            // CRM/Customers
            case 'Dashboard':
            case 'Customers':
            case 'Leads':
                if (hasCRM || hasCustomers) return <EmployeeDashboard initialTab={activeTab === 'Dashboard' ? 'Customers' : activeTab} onViewLead={(l) => { const id = l._id || l.id || l; window.history.pushState(null, '', `/leads/${id}`); setViewingLead(id); }} />;
                return <NoAccessView />;
            
            default:
                if (hasEmployees || hasHR) return <EmployeeHRView />;
                if (hasCRM || hasCustomers) return <EmployeeDashboard />;
                return <NoAccessView />;
        }
    };

    const TopBar = ({ isLeadView = false }) => (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 justify-between shrink-0 shadow-sm">
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
                <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee Portal</span>
                <button
                    onClick={() => {
                        if (isLeadView) return; // don't show profile while viewing lead
                        setShowProfile(p => !p);
                    }}
                    title="My Profile"
                    className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs hover:bg-blue-700 transition-all hover:scale-105 shadow-sm cursor-pointer"
                >
                    {initials}
                </button>
            </div>
        </header>
    );

    // If a lead is being viewed via URL, render the lead detail page
    if (viewingLead) {
        return (
            <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
                <EmployeeSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    onLogoClick={() => setShowProfile(true)}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <TopBar isLeadView />
                    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                        <LeadDetailView leadId={viewingLead} onBack={() => { window.history.pushState(null, '', '/'); setViewingLead(null); }} />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
            <EmployeeSidebar
                activeTab={activeTab}
                setActiveTab={(tab) => { setShowProfile(false); setActiveTab(tab); }}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                onLogoClick={() => setShowProfile(true)}
            />


            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar />
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

function NoAccessView() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Access Restricted</p>
            <p className="text-xs mt-1 text-slate-400">You don't have permission to view this section.</p>
        </div>
    );
}

function ComingSoonView({ module }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-700">{module}</p>
            <p className="text-xs mt-1 text-slate-400">This module is coming soon!</p>
            <p className="text-xs text-slate-400">Your permissions are configured correctly.</p>
        </div>
    );
}
