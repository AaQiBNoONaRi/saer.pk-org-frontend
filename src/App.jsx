import React, { useState, useEffect } from 'react';

// Components
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import DashboardView from './components/views/DashboardView';
import TicketsView from './components/views/TicketsView';
import PackagesView from './components/views/PackagesView';
import HotelsView from './components/views/HotelsView';
import FinanceView from './components/views/FinanceView';
import VisaServicesView from './components/views/VisaServicesView';
import PlaceholderView from './components/views/PlaceholderView';
import GenericView from './components/views/GenericView';
import AddPackageView from './components/views/AddPackageView';
import PackageDetailView from './components/views/PackageDetailView';
import AddTicketView from './components/views/AddTicketView';
import OthersView from './components/views/OthersView';
import EmployeesView from './components/views/EmployeesView';
import OrganizationView from './components/views/OrganizationView';
import BranchesView from './components/views/BranchesView';
import AgenciesView from './components/views/AgenciesView';

// Route mapping: URL path <-> Tab name
const ROUTES = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Tickets',
  '/flights': 'Flights',
  '/tickets/add': 'Add Ticket',
  '/packages': 'Packages',
  '/packages/add': 'Add Package',
  '/hotels': 'Hotels',
  '/others': 'Others',
  '/finance': 'Finance Hub',
  '/visa': 'Visa Services',
  '/organization': 'Organization',
  '/branch': 'Branch',
  '/agencies': 'Agencies',
  '/employees': 'Employees',
};

// Helper: Get URL path for a tab name
const getPathForTab = (tabName) => {
  const entry = Object.entries(ROUTES).find(([_, tab]) => tab === tabName);
  return entry ? entry[0] : '/';
};

// Helper: Get tab name for a URL path
const getTabForPath = (path) => {
  // Direct match
  if (ROUTES[path]) return ROUTES[path];

  // Catch-all for sub-routes
  if (path.startsWith('/others/')) return 'Others';
  if (path.startsWith('/tickets/')) return 'Tickets';
  if (path.startsWith('/packages/')) return 'Packages';
  if (path.startsWith('/hotels/')) return 'Hotels';

  // Default
  return 'Dashboard';
};

const App = () => {
  // Initialize activeTab from URL
  const initialTab = getTabForPath(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [viewingPackage, setViewingPackage] = useState(null);

  // Handle window resize and sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync URL when activeTab changes
  useEffect(() => {
    if (isLoggedIn) {
      const path = getPathForTab(activeTab);
      const currentPath = window.location.pathname;

      // Only push new state if:
      // 1. Current path doesn't match the new tab's base path
      // 2. AND we aren't already on a correct sub-path (e.g., don't overwrite /others/sub with /others)
      const isSubPath = currentPath.startsWith(path + '/');

      if (currentPath !== path && !isSubPath) {
        window.history.pushState(null, '', path);
      }
    }
  }, [activeTab, isLoggedIn]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newTab = getTabForPath(window.location.pathname);
      setActiveTab(newTab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle login redirect: replace /login with /
  useEffect(() => {
    if (isLoggedIn && window.location.pathname === '/login') {
      window.history.replaceState(null, '', '/');
      setActiveTab('Dashboard');
    }
  }, [isLoggedIn]);

  // Render login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // View routing logic
  const renderView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Tickets':
      case 'Flights':
        return (
          <TicketsView
            onAddTicket={() => {
              setEditingTicket(null);
              setActiveTab('Add Ticket');
            }}
            onEditTicket={(ticket) => {
              setEditingTicket(ticket);
              setActiveTab('Add Ticket');
            }}
            onDeleteTicket={async (ticket) => {
              if (window.confirm(`Are you sure you want to delete this ticket?\n\nFlight: ${ticket.departure_trip.airline} ${ticket.departure_trip.departure_city} → ${ticket.departure_trip.arrival_city}\nSeats: ${ticket.available_seats}/${ticket.total_seats}`)) {
                try {
                  const token = localStorage.getItem('access_token');
                  const response = await fetch(`http://localhost:8000/api/flights/${ticket._id}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  if (response.ok) {
                    alert('Ticket deleted successfully!');
                    // Trigger a refresh by changing tabs back and forth
                    setActiveTab('Dashboard');
                    setTimeout(() => setActiveTab('Tickets'), 10);
                  } else {
                    const errorData = await response.json();
                    alert('Failed to delete ticket: ' + (errorData.detail || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Error deleting ticket:', error);
                  alert('Error deleting ticket: ' + error.message);
                }
              }
            }}
          />
        );
      case 'Packages':
        return (
          <PackagesView
            onNavigate={setActiveTab}
            onEdit={(pkg) => {
              setEditingPackage(pkg);
              setActiveTab('Add Package');
            }}
            onView={(pkg) => {
              setViewingPackage(pkg);
              setActiveTab('PackageDetails');
            }}
          />
        );

      case 'PackageDetails':
        return (
          <PackageDetailView
            packageData={viewingPackage}
            onBack={() => setActiveTab('Packages')}
            onEdit={(pkg) => {
              setEditingPackage(pkg);
              setActiveTab('Add Package');
            }}
          />
        );
      case 'Add Package':
        return (
          <AddPackageView
            onBack={() => {
              setEditingPackage(null);
              setActiveTab('Packages');
            }}
            initialData={editingPackage}
          />
        );
      case 'Add Ticket':
        return (
          <AddTicketView
            onBack={() => {
              setEditingTicket(null);
              setActiveTab('Tickets');
            }}
            editingTicket={editingTicket}
          />
        );
      case 'Hotels':
        return <HotelsView />;
      case 'Others':
      case 'Other':
        return <OthersView onBack={() => setActiveTab('Dashboard')} />;
      case 'Finance Hub':
        return <FinanceView />;
      case 'Visa Services':
        return <VisaServicesView />;
      case 'Organization':
        return <OrganizationView />;
      case 'Branch':
        return <BranchesView />;
      case 'Agencies':
        return <AgenciesView />;
      case 'Employees':
        return <EmployeesView />;
      default:
        return <GenericView tabName={activeTab} />;
    }
  };

  // Render main application
  return (
    <Layout
      activeTab={activeTab}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      isMobile={isMobile}
      onTabChange={setActiveTab}
      isUserMenuOpen={isUserMenuOpen}
      setUserMenuOpen={setUserMenuOpen}
      setIsLoggedIn={setIsLoggedIn}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
