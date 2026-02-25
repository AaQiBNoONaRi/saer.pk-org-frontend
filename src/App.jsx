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

import BlogsView from './components/views/BlogsView';
import FormsView from './components/views/FormsView';
import OrderDeliveryView from './components/views/OrderDeliveryView';
import OrderDeliveryDetailView from './components/views/OrderDeliveryDetailView';
import OrderConfirmationView from './components/views/OrderConfirmationView';
import OrderTicketDetailView from './components/views/OrderTicketDetailView';
import PaymentsView from './components/views/PaymentsView';
import AddBankAccountView from './components/views/AddBankAccountView';
import DiscountsView from './components/views/DiscountsView';

import AddDiscountView from './components/views/AddDiscountView';
import CommissionsView from './components/views/CommissionsView';
import AddCommissionView from './components/views/AddCommissionView';
import ServiceChargesView from './components/views/ServiceChargesView';
import AddServiceChargeView from './components/views/AddServiceChargeView';
import ShareInventoryView from './components/views/ShareInventoryView';


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
  '/blogs': 'Blogs',
  '/forms': 'Forms',
  '/order-delivery': 'Order Delivery',
  '/pax-movement': 'Pax Movement',
  '/payments': 'Payments',
  '/payments/add': 'Add Bank Account',
  '/discounts': 'Discounts',
  '/discounts/add': 'Add Discount',
  '/commissions': 'Commissions',
  '/commissions/add': 'Add Commission',
  '/service-charges': 'Service Charges',
  '/service-charges/add': 'Add Service Charge',
  '/share-inventory': 'Share Inventory',
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
  if (path.startsWith('/order-delivery/')) return 'Order Delivery';
  if (path.startsWith('/pax-movement/')) return 'Pax Movement';



  // Default
  return 'Dashboard';
};

// Helper: Extract ID from sub-path
const getIdFromPath = (path, basePath) => {
  if (path.startsWith(basePath + '/')) {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
  return null;
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

  // Parse initial IDs from URL
  const path = window.location.pathname;
  const initialOrderId = getIdFromPath(path, '/order-delivery') || getIdFromPath(path, '/pax-movement');
  const initialPackageId = getIdFromPath(path, '/packages');
  const initialTicketId = getIdFromPath(path, '/tickets/edit');

  const [viewingOrder, setViewingOrder] = useState(initialOrderId);
  const [editingAccount, setEditingAccount] = useState(null);
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
      let path = getPathForTab(activeTab);
      const currentPath = window.location.pathname;

      // Handle sub-paths for IDs
      if (activeTab === 'Order Delivery' || activeTab === 'Pax Movement') {
        if (viewingOrder) {
          const orderId = viewingOrder?.booking_reference || viewingOrder?._id || viewingOrder?.id || viewingOrder;
          if (typeof orderId === 'string' || typeof orderId === 'number') {
            path = `${getPathForTab(activeTab)}/${orderId}`;
          }
        }
      } else if (activeTab === 'PackageDetails' && viewingPackage) {
        const pkgId = viewingPackage?.id || viewingPackage?._id || viewingPackage;
        if (typeof pkgId === 'string' || typeof pkgId === 'number') {
          path = `/packages/${pkgId}`;
        }
      } else if (activeTab === 'Add Ticket' && editingTicket) {
        const ticketId = editingTicket?.id || editingTicket?._id || editingTicket;
        if (typeof ticketId === 'string' || typeof ticketId === 'number') {
          path = `/tickets/edit/${ticketId}`;
        }
      }

      const isSubPath = currentPath.startsWith(path + '/');

      // If we are navigating to a base path (like /order-delivery) but current path has a sub-path,
      // it means the user clicked the sidebar to reset the view.
      if (currentPath !== path && !isSubPath) {
        window.history.pushState(null, '', path);
      }
    }
  }, [activeTab, isLoggedIn, viewingOrder, viewingPackage, editingTicket]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const newTab = getTabForPath(path);
      setActiveTab(newTab);

      // Restore IDs from URL on back/forward
      const orderId = getIdFromPath(path, '/order-delivery') || getIdFromPath(path, '/pax-movement');
      const pkgId = getIdFromPath(path, '/packages');

      if (orderId) setViewingOrder(orderId);
      else if (path === '/order-delivery' || path === '/pax-movement') setViewingOrder(null);

      if (pkgId) setViewingPackage(pkgId);
      else if (path === '/packages') setViewingPackage(null);
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

      case 'Blogs':
        return <BlogsView />;
      case 'Forms':
        return <FormsView />;
      case 'Discounts':
        return (
          <DiscountsView
            onAdd={() => setActiveTab('Add Discount')}
            onEdit={(discount) => {
              // You might need state for editingDiscount
              setActiveTab('Add Discount');
            }}
          />
        );
      case 'Add Discount':
        return <AddDiscountView onBack={() => setActiveTab('Discounts')} />;
      case 'Commissions':
        return (
          <CommissionsView
            onAdd={() => setActiveTab('Add Commission')}
            onEdit={(commission) => {
              setActiveTab('Add Commission');
            }}
          />
        );
      case 'Add Commission':
        return <AddCommissionView onBack={() => setActiveTab('Commissions')} />;
      case 'Service Charges':
        return (
          <ServiceChargesView
            onAdd={() => setActiveTab('Add Service Charge')}
            onEdit={(charge) => {
              setActiveTab('Add Service Charge');
            }}
          />
        );
      case 'Add Service Charge':
        return <AddServiceChargeView onBack={() => setActiveTab('Service Charges')} />;
      case 'Share Inventory':
        return <ShareInventoryView />;
      case 'Order Delivery':
      case 'Pax Movement':
        if (viewingOrder) {
          // viewingOrder can be a string ID or the full object
          const order = (typeof viewingOrder === 'object') ? viewingOrder : null;
          const status = (order?.booking_status || order?.status || order?.orderStatus || '').toLowerCase();
          const isTicket = order?.booking_type === 'ticket' || order?.type === 'Group Tickets';

          if (isTicket) {
            return (
              <OrderTicketDetailView
                order={viewingOrder}
                onBack={() => setViewingOrder(null)}
              />
            );
          }

          // If approved, show the Visa/Confirmation management page
          if (status === 'approved') {
            return (
              <OrderConfirmationView
                booking={order?._raw || order}
                orderId={viewingOrder.id || viewingOrder.booking_reference || viewingOrder}
                onBack={() => setViewingOrder(null)}
              />
            );
          }

          return (
            <OrderDeliveryDetailView
              booking={viewingOrder}
              onBack={() => setViewingOrder(null)}
              onConfirm={(updated) => setViewingOrder(updated)}
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
      getPathForTab={getPathForTab}
      isUserMenuOpen={isUserMenuOpen}
      setUserMenuOpen={setUserMenuOpen}
      setIsLoggedIn={setIsLoggedIn}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
