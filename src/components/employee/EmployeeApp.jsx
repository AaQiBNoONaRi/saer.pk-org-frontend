import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import EmployeeSidebar from './EmployeeSidebar';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeHRView from './EmployeeHRView';
import EmployeeProfilePage from './EmployeeProfilePage';
import LeadDetailView from '../views/LeadDetailView';

export default function EmployeeApp() {
    const employeeData = (() => {
        try { return JSON.parse(localStorage.getItem('employee_data') || '{}'); }
        catch { return {}; }
    })();
    const permissions = employeeData?.permissions || [];
    const hasCRM = permissions.includes('crm');
    const hasEmployees = permissions.includes('employees');

    const defaultView = hasEmployees ? 'Employees' : hasCRM ? 'Dashboard' : 'Dashboard';

    const [activeTab, setActiveTab] = useState(defaultView);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const path = window.location.pathname;
    const initialLeadId = path.startsWith('/leads/') ? path.split('/').pop() : null;
    const [viewingLead, setViewingLead] = useState(initialLeadId);

    const initials = (employeeData?.full_name || employeeData?.name || employeeData?.email || 'E')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const renderContent = () => {
        if (showProfile) return <EmployeeProfilePage onBack={() => setShowProfile(false)} />;
        switch (activeTab) {
            case 'Employees':
                if (hasEmployees) return <EmployeeHRView />;
                return <NoAccessView />;
            case 'Dashboard':
            case 'Customers':
            case 'Leads':
                if (hasCRM) return <EmployeeDashboard initialTab={activeTab === 'Dashboard' ? 'Customers' : activeTab} onViewLead={(l) => { const id = l._id || l.id || l; window.history.pushState(null, '', `/leads/${id}`); setViewingLead(id); }} />;
                return <NoAccessView />;
            default:
                if (hasEmployees) return <EmployeeHRView />;
                if (hasCRM) return <EmployeeDashboard />;
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
