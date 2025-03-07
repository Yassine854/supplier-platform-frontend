import React, { useState, useEffect, ReactNode } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import axios from "axios";
import Footer from "./footer";

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    role: 'superadmin' | 'supplier';
    manufacturerId: string;
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
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth) as AuthResponse;
        setAuthData(parsedAuth);

        if (parsedAuth.user.role === 'supplier' && parsedAuth.user.manufacturerId) {
          const fetchSupplier = async () => {
            try {
              const response = await axios.get(
                'http://localhost:3000/api/suppliers',
                {
                  headers: { 
                    Authorization: `Bearer ${parsedAuth.token}` 
                  },
                }
              );
              
              // Find the supplier with matching manufacturerId
              const foundSupplier = response.data.find(
                (s: any) => s.manufacturerId === parsedAuth.user.manufacturerId
              );
              
              if (foundSupplier) {
                setSupplier(foundSupplier);
              } else {
                console.error('Supplier not found in API response');
              }
            } catch (error) {
              console.error("Error fetching supplier:", error);
              if (axios.isAxiosError(error) && error.response?.status === 401) {
                localStorage.removeItem('auth');
                window.location.href = '/login';
              }
            }
          };
          fetchSupplier();
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, [authData?.user.manufacturerId]); // Add dependency on manufacturerId

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
            
            {authData?.user.role === 'supplier' && supplier && (
              <Footer supplier={supplier} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;