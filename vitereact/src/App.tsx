import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import all views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_NotificationsPanel from '@/components/views/GV_NotificationsPanel.tsx';
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Register from '@/components/views/UV_Register.tsx';
import UV_ProfileSetup from '@/components/views/UV_ProfileSetup.tsx';
import UV_HomeGuest from '@/components/views/UV_HomeGuest.tsx';
import UV_SearchResults from '@/components/views/UV_SearchResults.tsx';
import UV_PropertyDetail from '@/components/views/UV_PropertyDetail.tsx';
import UV_BookingSummary from '@/components/views/UV_BookingSummary.tsx';
import UV_Payment from '@/components/views/UV_Payment.tsx';
import UV_PaymentRetry from '@/components/views/UV_PaymentRetry.tsx';
import UV_BookingConfirmation from '@/components/views/UV_BookingConfirmation.tsx';
import UV_SearchResults_CompareModal from '@/components/views/UV_SearchResults_CompareModal.tsx';
import UV_Dashboard_Host from '@/components/views/UV_Dashboard_Host.tsx';
import UV_Listing_Create from '@/components/views/UV_Listing_Create.tsx';
import UV_Listing_Edit from '@/components/views/UV_Listing_Edit.tsx';
import UV_Host_Listings from '@/components/views/UV_Host_Listings.tsx';
import UV_MessagesInbox from '@/components/views/UV_MessagesInbox.tsx';
import UV_MessagesThread from '@/components/views/UV_MessagesThread.tsx';
import UV_ProfileManage from '@/components/views/UV_ProfileManage.tsx';
import UV_Reviews_Guest from '@/components/views/UV_Reviews_Guest.tsx';
import UV_Reviews_Host from '@/components/views/UV_Reviews_Host.tsx';
import UV_Wishlist from '@/components/views/UV_Wishlist.tsx';
import UV_GuestBookings from '@/components/views/UV_GuestBookings.tsx';
import UV_HostBookings from '@/components/views/UV_HostBookings.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper for pages that need global components
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <GV_TopNav />
    <main className="flex-grow">
      {children}
    </main>
    <GV_Footer />
  </div>
);

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <AppLayout>
              <UV_Landing />
            </AppLayout>
          } />
          
          <Route path="/login" element={<UV_Login />} />
          <Route path="/register" element={<UV_Register />} />
          <Route path="/profile/setup" element={<UV_ProfileSetup />} />
          
          {/* Protected Guest Routes */}
          <Route path="/dashboard/guest" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_HomeGuest />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_SearchResults />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/properties/:property_id" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_PropertyDetail />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/bookings/summary" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_BookingSummary />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/payments" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Payment />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/payments/retry" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_PaymentRetry />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/bookings/confirmation" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_BookingConfirmation />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/compare" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_SearchResults_CompareModal />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Protected Host Routes */}
          <Route path="/dashboard/host" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Dashboard_Host />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/listings/create" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Listing_Create />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/listings/:listing_id/edit" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Listing_Edit />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/listings" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Host_Listings />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Protected Messaging Routes */}
          <Route path="/messages" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_MessagesInbox />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/messages/:thread_id" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_MessagesThread />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Protected Profile Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_ProfileManage />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/reviews/write" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Reviews_Guest />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/reviews/host" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Reviews_Host />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Protected Wishlist Route */}
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_Wishlist />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Protected Bookings Routes */}
          <Route path="/bookings/guest" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_GuestBookings />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/bookings/host" element={
            <ProtectedRoute>
              <AppLayout>
                <UV_HostBookings />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Redirect all unmatched routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
};

export default App;