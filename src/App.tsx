import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';

import Loader from './common/Loader';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Chart from './pages/Chart';
import ECommerce from './pages/Dashboard/ECommerce';
import FormElements from './pages/Form/FormElements';
import FormLayout from './pages/Form/FormLayout';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';
import DefaultLayout from './layout/DefaultLayout';

//suppliers
import SupplierDashboard from './pages/suppliers/SupplierDashboard';

//super_admin
import SuperAdminDashboard from './pages/super_admin/AllSuppliersDashboard';
import SupplierDashboard_sp from './pages/super_admin/SupplierDashboard';

interface AuthData {
  role: 'supplier' | 'superadmin' | null;
  user: any;
}

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  const [authData, setAuthData] = useState<AuthData>({ role: null, user: {} });

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthData({
          role: parsedAuth.role || null,
          user: parsedAuth.user || {}
        });
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
    setLoading(false); // Immediately set loading to false after processing
  }, [pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <Loader />;
  }

  // Check if the route is an authentication route
  const isAuthRoute = pathname === '/auth/signin' || pathname === '/auth/signup';

  return (
    <Routes>
      {isAuthRoute ? (
        <>
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
        </>
      ) : (
        <Route
          path="/*"
          element={
            <DefaultLayout>
              <Routes>
              {authData.role === 'supplier' && (

              <Route path="/supplier/dashboard"  element={<SupplierDashboard />} />
            )}
              {authData.role === 'superadmin' && (
                    <>
                      <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                      <Route path="/supplierDashboard/:supplierId" element={<SupplierDashboard_sp />} />
                    </>
                  )}
                {/* <Route path="/test" element={<ECommerce />} /> */}
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/forms/form-elements" element={<FormElements />} />
                <Route path="/forms/form-layout" element={<FormLayout />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/chart" element={<Chart />} />
                <Route path="/ui/alerts" element={<Alerts />} />
                <Route path="/ui/buttons" element={<Buttons />} />
              </Routes>
            </DefaultLayout>
          }
        />
      )}
    </Routes>
  );
}

export default App;
