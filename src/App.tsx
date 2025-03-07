import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Loader from './common/Loader';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Chart from './pages/Chart';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';
import DefaultLayout from './layout/DefaultLayout';
import SupplierDashboard from './pages/suppliers/SupplierDashboard';
import SuperAdminDashboard from './pages/super_admin/AllSuppliersDashboard';
import SupplierDashboard_sp from './pages/super_admin/SupplierDashboard';

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    role: 'superadmin' | 'supplier' | null;
    username?: string;
    company_name?: string;
    email?: string;
    contact_name?: string;
    phone_number?: string;
    city?: string;
    postal_code?: string;
  };
}

function App() {
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  // Simple auth check function
  const isAuthenticated = () => {
    try {
      const storedAuth = localStorage.getItem('auth');
      return storedAuth && JSON.parse(storedAuth)?.user?.role;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Clean up invalid auth data
    if (!isAuthenticated()) {
      localStorage.removeItem('auth');
    }
    setAuthChecked(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (loading || !authChecked) {
    return <Loader />;
  }

  // Get user role safely
  const getRole = () => {
    try {
      return JSON.parse(localStorage.getItem('auth')!).user?.role;
    } catch {
      return null;
    }
  };

  // Redirect logic
  if (!isAuthenticated() && pathname !== '/auth/signin' && pathname !== '/auth/signup') {
    return <Navigate to="/auth/signin" replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={getRole() === 'superadmin' ? '/admin/dashboard' : '/supplier/dashboard'}
            replace
          />
        }
      />
      
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />

      {isAuthenticated() && (
        <Route
          path="/*"
          element={
            <DefaultLayout>
              <Routes>
                {/* Super Admin Routes */}
                {getRole() === 'superadmin' && (
                  <>
                    <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/supplierDashboard/:supplierId" element={<SupplierDashboard_sp />} />
                  </>
                )}

                {/* Supplier Routes */}
                {getRole() === 'supplier' && (
                  <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
                )}

                {/* Common Routes */}
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/chart" element={<Chart />} />
                <Route path="/ui/alerts" element={<Alerts />} />
                <Route path="/ui/buttons" element={<Buttons />} />

                {/* Fallback for authenticated users */}
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={getRole() === 'superadmin' ? '/admin/dashboard' : '/supplier/dashboard'}
                      replace
                    />
                  }
                />
              </Routes>
            </DefaultLayout>
          }
        />
      )}
    </Routes>
  );
}

export default App;