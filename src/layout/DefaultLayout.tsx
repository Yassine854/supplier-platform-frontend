import React, { useState, useEffect, ReactNode } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import axios from "axios";
import Footer from "./footer";

interface AuthData {
  role: string;
  user: {
    username?: string;
    company_name?: string;
    email?: string;
    contact_name?: string;
    phone_number?: string;
    city?: string;
    postal_code?: string;
  };
}

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    // Get authentication data
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthData(parsedAuth);
        
        // Only fetch supplier data if user is a supplier
        if (parsedAuth.role === 'supplier') {
          const fetchSupplier = async () => {
            try {
              const response = await axios.get("http://localhost:3000/api/suppliers");
              const foundSupplier = response.data.find(
                (s: any) => s.manufacturer_id === parsedAuth.user.manufacturer_id
              );
              setSupplier(foundSupplier || null);
            } catch (error) {
              console.error("Error fetching supplier:", error);
            }
          };
          fetchSupplier();
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
            
            {/* Show footer only for suppliers */}
            {authData?.role === 'supplier' && (
              <Footer supplier={supplier} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;