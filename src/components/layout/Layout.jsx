import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({
    children,
    activeTab,
    isSidebarOpen,
    setSidebarOpen,
    isMobile,
    onTabChange,
    isUserMenuOpen,
    setUserMenuOpen,
    setIsLoggedIn
}) => {
    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden text-left">
            {/* Mobile Overlay */}
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={onTabChange}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                setIsLoggedIn={setIsLoggedIn}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header
                    activeTab={activeTab}
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                />

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
