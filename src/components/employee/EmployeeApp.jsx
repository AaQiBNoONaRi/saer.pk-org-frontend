import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import EmployeeSidebar from './EmployeeSidebar';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeHRView from './EmployeeHRView';

export default function EmployeeApp() {
    const employeeData = (() => {
        try { return JSON.parse(localStorage.getItem('employee_data') || '{}'); }
        catch { return {}; }
    })();
    const permissions = employeeData?.permissions || [];
    const hasCRM = permissions.includes('crm');
    const hasEmployees = permissions.includes('employees');

    // Priority: employees > crm. Employee with both sees HR view first.
    const defaultView = hasEmployees ? 'Employees' : hasCRM ? 'Dashboard' : 'Dashboard';

    const [activeTab, setActiveTab] = useState(defaultView);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const renderContent = () => {
        switch (activeTab) {
            case 'Employees':
                if (hasEmployees) return <EmployeeHRView />;
                return <NoAccessView />;
            case 'Dashboard':
            case 'Customers':
            case 'Leads':
                if (hasCRM) return <EmployeeDashboard initialTab={activeTab === 'Dashboard' ? 'Customers' : activeTab} />;
                return <NoAccessView />;
            default:
                // Fallback: show what the employee has access to
                if (hasEmployees) return <EmployeeHRView />;
                if (hasCRM) return <EmployeeDashboard />;
                return <NoAccessView />;
        }
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
            <EmployeeSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 justify-between shrink-0 shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee Portal</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {(employeeData?.name || 'E').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

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
