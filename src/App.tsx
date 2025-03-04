import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

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


function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

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
              <Route path="/test"  element={<SupplierDashboard />} />
              <Route index element={<SuperAdminDashboard />} />
              <Route 
                  path="/supplierDashboard/:supplierId"  
                  element={<SupplierDashboard_sp />} 
                />
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
