import React, { useState,useEffect, ReactNode } from 'react';

import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import axios from "axios";
import Footer from "./footer";

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //Supplier Data testing
  const supplierId = "27"; 
  const [supplier, setSupplier] = useState<any>(null);
  


  useEffect(() => {


    const fetchSupplier = async () => {
      try {
        // Fetch all suppliers from the API
        const response = await axios.get("http://localhost:3000/api/suppliers");
        const foundSupplier = response.data.find(
          (supplier: any) => supplier.manufacturer_id === Number(supplierId),
        );

        if (foundSupplier) {
          setSupplier(foundSupplier);
        } else {
          console.error("Supplier not found");
        }
      } catch (error) {
        console.error("Error fetching supplier:", error);
      }
    };



    fetchSupplier();

  }, [supplierId]);


  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
       
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
            <Footer supplier={supplier} />
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      
      {/* <!-- ===== Page Wrapper End ===== --> */}
      
    </div>
    
  );
};

export default DefaultLayout;
