import React, { useState, useEffect } from 'react';

// Components
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import DashboardView from './components/views/DashboardView';
import TicketsView from './components/views/TicketsView';
import PackagesView from './components/views/PackagesView';
import HotelsView from './components/views/HotelsView';
import FinanceView from './components/views/finance/FinanceHub';
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

import BlogsView from './components/views/BlogsView';
import FormsView from './components/views/FormsView';
import OrderDeliveryView from './components/views/OrderDeliveryView';
import OrderDeliveryDetailView from './components/views/OrderDeliveryDetailView';
import PaymentsView from './components/views/PaymentsView';
import AddBankAccountView from './components/views/AddBankAccountView';
import OrderConfirmationView from './components/views/OrderConfirmationView';
import OrderTicketDetailView from './components/views/OrderTicketDetailView';

import CommissionEarningsView from './components/views/CommissionEarningsView';
import DiscountsView from './components/views/DiscountsView';
import CommissionsView from './components/views/CommissionsView';
import AddCommissionView from './components/views/AddCommissionView';
import ServiceChargesView from './components/views/ServiceChargesView';
import AddServiceChargeView from './components/views/AddServiceChargeView';
import PaxMovementView from './components/views/PaxMovementView';
import DailyOperationsView from './components/views/DailyOperationsView';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import HRManagementView from './components/views/HRManagementView';
import RolesPermissionsPage from './components/views/RolesPermissionsPage';
import BookingHistoryView from './components/views/BookingHistoryView';
import UmrahPackagePage from './components/views/bookings/UmrahPackagePage';
import UmrahBookingPage from './components/views/bookings/UmrahBookingPage';
import TicketPageBooking from './components/views/bookings/TicketPage';
import AgentUmrahCalculator from './components/views/bookings/AgentUmrahCalculator';
import CustomBookingPage from './components/views/bookings/CustomBookingPage';
// The Customer Database and Leads modules might not have specific views yet, but let's map them to generic if they don't, or map to what we have.
// Wait, I see we have EmployeesView already, which maps to Employees. The sidebar uses 'HR Employees'.

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
  '/roles-permissions': 'Roles & Permissions',
  '/employees': 'Employees',
  '/hr-employees': 'HR Employees',
  '/blogs': 'Blogs',
  '/forms': 'Forms',
  '/bookings': 'Booking History',
  '/bookings/custom': 'Custom Booking',
  '/bookings/ticket': 'Ticket Booking',
  '/bookings/umrah': 'Umrah Booking',
  '/order-delivery': 'Order Delivery',
  '/payments': 'Payments',
  '/payments/add': 'Add Bank Account',
  '/commission-earnings': 'Commission Earnings',
  '/discounts': 'Discounts',
  '/commissions': 'Commissions',
  '/service-charges': 'Service Charges',
  '/pax-movement': 'Pax Movement',
  '/daily-operations': 'Daily Operations',
  '/customers': 'Customer Database',
  '/leads': 'Lead Management',
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

  if (path.startsWith('/share-inventory')) return 'Share Inventory';

  if (path.startsWith('/discounts/')) return 'Discounts';
  if (path.startsWith('/commissions/')) return 'Commissions';
  if (path.startsWith('/service-charges/')) return 'Service Charges';


  // Default
  return 'Dashboard';
};

const App = () => {
  // Initialize activeTab from URL
  const initialTab = getTabForPath(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [viewingPackage, setViewingPackage] = useState(null);

  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCommission, setEditingCommission] = useState(null);
  const [editingServiceCharge, setEditingServiceCharge] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState({ pkg: null, flights: [], airlines: [] });
  const [customBookingData, setCustomBookingData] = useState(null);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

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
    console.log("Rendering view for activeTab:", activeTab);
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
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
      case 'Roles & Permissions':
        return <RolesPermissionsPage />;
      case 'Employees':
        return <EmployeesView />;
      case 'HR Employees':
        return <HRManagementView />;
      case 'Booking History':
        return <BookingHistoryView />;
      case 'Custom Booking':
        return (
          <AgentUmrahCalculator
            onBookCustomPackage={(data) => {
              setCustomBookingData(data);
              setActiveTab('Custom Booking Wizard');
            }}
          />
        );
      case 'Custom Booking Wizard':
        return (
          <CustomBookingPage
            calculatorData={customBookingData}
            onBack={() => {
              setCustomBookingData(null);
              setActiveTab('Custom Booking');
            }}
          />
        );
      case 'Ticket Booking':
        return <TicketPageBooking />;
      case 'Umrah Booking':
        return (
          <UmrahPackagePage
            onBookPackage={(pkg, flights, airlines) => {
              setSelectedPackage({ pkg, flights, airlines });
              setActiveTab('Umrah Booking Wizard');
            }}
          />
        );
      case 'Umrah Booking Wizard':
        return (
          <UmrahBookingPage
            packageData={selectedPackage.pkg}
            flights={selectedPackage.flights || []}
            airlines={selectedPackage.airlines || []}
            onBack={() => { setSelectedPackage({ pkg: null, flights: [], airlines: [] }); setActiveTab('Umrah Booking'); }}
          />
        );
      case 'Commission Earnings':
        return <CommissionEarningsView />;
      case 'Discounts':
        return <DiscountsView />;
      case 'Commissions':
        return (
          <CommissionsView
            onAddCommission={() => {
              setEditingCommission(null);
              setActiveTab('Add Commission');
            }}
            onEditCommission={(c) => {
              setEditingCommission(c);
              setActiveTab('Add Commission');
            }}
          />
        );
      case 'Add Commission':
        return (
          <AddCommissionView
            onBack={() => {
              setEditingCommission(null);
              setActiveTab('Commissions');
            }}
            initialData={editingCommission}
          />
        );
      case 'Service Charges':
        return (
          <ServiceChargesView
            onAddServiceCharge={() => {
              setEditingServiceCharge(null);
              setActiveTab('Add Service Charge');
            }}
            onEditServiceCharge={(sc) => {
              setEditingServiceCharge(sc);
              setActiveTab('Add Service Charge');
            }}
          />
        );
      case 'Add Service Charge':
        return (
          <AddServiceChargeView
            onBack={() => {
              setEditingServiceCharge(null);
              setActiveTab('Service Charges');
            }}
            initialData={editingServiceCharge}
          />
        );
      case 'Pax Movement':
        return <PaxMovementView />;
      case 'Daily Operations':
        return <DailyOperationsView />;
      case 'Customer Database':
        return <EmployeeDashboard />;
      case 'Lead Management':
        return <PlaceholderView title={activeTab} />;
      case 'Blogs':
        return <BlogsView />;
      case 'Forms':
        return <FormsView />;
      case 'Order Delivery':
        if (viewingOrder) {
          if (viewingOrder.booking_type === 'ticket') {
            return (
              <OrderTicketDetailView
                order={viewingOrder}
                onBack={() => setViewingOrder(null)}
              />
            );
          }
          if (isOrderConfirmed) {
            return (
              <OrderConfirmationView
                orderId={viewingOrder._id || viewingOrder.id}
                onBack={() => {
                  setIsOrderConfirmed(false);
                  setViewingOrder(null);
                }}
              />
            );
          }
          return (
            <OrderDeliveryDetailView
              booking={viewingOrder}
              onBack={() => setViewingOrder(null)}
              onConfirm={() => setIsOrderConfirmed(true)}
            />
          );
        }
        return <OrderDeliveryView onOrderClick={(order) => setViewingOrder(order)} />;
      case 'Payments':
        return (
          <PaymentsView
            onAddAccount={() => {
              setEditingAccount(null);
              setActiveTab('Add Bank Account');
            }}
            onEditAccount={(acc) => {
              setEditingAccount(acc);
              setActiveTab('Add Bank Account');
            }}
          />
        );
      case 'Add Bank Account':
        return (
          <AddBankAccountView
            onBack={() => {
              setEditingAccount(null);
              setActiveTab('Payments');
            }}
            editingAccount={editingAccount}
          />
        );
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