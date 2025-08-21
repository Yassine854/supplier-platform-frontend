import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import Logo from '../../images/logo/yellow-kamioun.png';
import axios from 'axios';
import { API_BASE_URL } from "../../config";
import FakeAdBanner from "../../pages/suppliers/fakeAd"

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    role: 'superadmin' | 'supplier';
    username?: string;
    company_name?: string;
    manufacturerId?: string;
    contact_name?: string;
    city?: string;
    postal_code?: string;
    email?: string;
    phone_number?: string;
  };
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
  );
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    const token = localStorage.getItem('authToken');
    setAuthToken(token);
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth) as AuthResponse;
        setAuthData(parsedAuth);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  // Close sidebar on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // Close sidebar on ESC press
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  // Store sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  // Fetch suppliers when dropdown is shown
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!authToken || !isDropdownVisible) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setAllSuppliers(response.data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [isDropdownVisible, authToken]);

  // Filter suppliers based on search term
  useEffect(() => {
    const filterSuppliers = () => {
      if (!searchTerm) {
        setFilteredSuppliers([]);
        return;
      }

      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = allSuppliers.filter((supplier) => {
        const idMatch = supplier.manufacturerId?.toString().includes(lowerSearchTerm);
        const nameMatch = supplier.company_name?.toLowerCase().includes(lowerSearchTerm);
        return idMatch || nameMatch;
      });

      setFilteredSuppliers(filtered);
    };

    const debounceTimer = setTimeout(filterSuppliers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, allSuppliers]);

  const handleSupplierSelect = (supplier: any) => {
    navigate(`/supplierDashboard/${supplier.manufacturerId}`);
    setIsDropdownVisible(false);
    setSearchTerm("");
  };

  
  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink 
          to="/" 
          className="group relative flex w-full items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="relative rounded-lg p-2">
  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-900/5 to-gray-900/0 opacity-50 transition-opacity duration-300 group-hover:opacity-70 dark:from-white/5 dark:to-white/0" />
  
  <img 
    src={Logo} 
    alt="Kamioun Logo" 
    className="relative z-10 w-24 drop-shadow-xl filter transition-all duration-300 md:w-32 lg:w-40 dark:brightness-125" 
  />
</div>

          <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
        </NavLink>
  
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>
  
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>
  
            <ul className="mb-6 flex flex-col gap-1.5">
              {authData?.user.role === 'supplier' && (
                <li>
                  <NavLink
                    to="/supplier/dashboard"
                    className={({ isActive }) =>
                      'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                      (isActive && '!text-white')
                    }
                  >
                    <svg
                      className="fill-current"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z"
                        fill=""
                      />
                      <path
                        d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z"
                        fill=""
                      />
                      <path
                        d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z"
                        fill=""
                      />
                      <path
                        d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z"
                        fill=""
                      />
                    </svg>
                    Dashboard
                  </NavLink>
                </li>
              )}



          {authData?.user.role === 'superadmin' && (
              <SidebarLinkGroup activeCondition={pathname.includes('/supplierDashboard')}>
                {(handleClick, open) => (
                  <React.Fragment>
                    <NavLink
                      to="#"
                      className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                        pathname.includes('/supplierDashboard') && 'bg-graydark dark:bg-meta-4'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownVisible(!isDropdownVisible);
                        sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                      }}
                    >
                      {/* Supplier Icon */}
                      <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.5 14.25C1.5 14.6625 1.8375 15 2.25 15H15.75C16.1625 15 16.5 14.6625 16.5 14.25V12.75C16.5 9.75 14.1 6.75 11.25 6.75H6.75C3.9 6.75 1.5 9.75 1.5 12.75V14.25ZM9 3C10.6575 3 12 4.3425 12 6C12 7.6575 10.6575 9 9 9C7.3425 9 6 7.6575 6 6C6 4.3425 7.3425 3 9 3Z"
                          fill=""
                        />
                      </svg>
                      Suppliers
                      <svg
                        className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                          open && 'rotate-180'
                        }`}
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                          fill=""
                        />
                      </svg>
                    </NavLink>

                    {/* Dropdown Content */}
                    <div className={`translate transform overflow-hidden ${!open && 'hidden'}`}>
                      <div className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6 pr-4">
                        {/* Dashboard Link */}
                        <NavLink
                          to="/admin/dashboard"
                          className={({ isActive }) =>
                            `group relative flex items-center rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                              isActive && '!text-white'
                            }`
                          }
                        >
                          Dashboard
                        </NavLink>

                        {/* Search Input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search supplier..."
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 text-white focus:border-primary focus-visible:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {isLoading && (
                            <div className="absolute right-3 top-3">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                            </div>
                          )}
                        </div>

                        {/* Search Results */}
                        {filteredSuppliers.length > 0 && (
                          <div className="max-h-60 overflow-y-auto rounded-md border border-stroke bg-boxdark">
                            {filteredSuppliers.map((supplier) => (
                              <div
                                key={supplier.manufacturerId}
                                className="cursor-pointer p-3 hover:bg-meta-4"
                                onClick={() => handleSupplierSelect(supplier)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">
                                    {supplier.company_name}
                                  </span>
                                  <span className="text-xs text-gray-300">
                                    ID: {supplier.manufacturerId}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                  Contact: {supplier.contact_name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isLoading && filteredSuppliers.length === 0 && searchTerm && (
                          <div className="p-2 text-center text-sm text-gray-400">
                            No suppliers found
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                )}
              </SidebarLinkGroup>
              )}


              {/* <!-- Menu Item Profile --> */}

              {/* <li>
                <NavLink
                  to="/calendar"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes('calendar') &&
                    'bg-graydark dark:bg-meta-4'
                  }`}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558C13.2749 1.71558 12.9937 1.99683 12.9937 2.36245V2.9812H4.97803V2.36245C4.97803 2.02495 4.69678 1.71558 4.33115 1.71558C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812ZM1.77178 8.21245H4.1624V10.9968H1.77178V8.21245ZM5.42803 8.21245H8.38115V10.9968H5.42803V8.21245ZM8.38115 12.2625V15.0187H5.42803V12.2625H8.38115ZM9.64678 12.2625H12.5999V15.0187H9.64678V12.2625ZM9.64678 10.9968V8.21245H12.5999V10.9968H9.64678ZM13.8374 8.21245H16.228V10.9968H13.8374V8.21245ZM2.2499 4.24683H3.7124V4.83745C3.7124 5.17495 3.99365 5.48433 4.35928 5.48433C4.7249 5.48433 5.00615 5.20308 5.00615 4.83745V4.24683H13.0499V4.83745C13.0499 5.17495 13.3312 5.48433 13.6968 5.48433C14.0624 5.48433 14.3437 5.20308 14.3437 4.83745V4.24683H15.7499C16.0312 4.24683 16.2562 4.47183 16.2562 4.75308V6.94683H1.77178V4.75308C1.77178 4.47183 1.96865 4.24683 2.2499 4.24683ZM1.77178 14.5125V12.2343H4.1624V14.9906H2.2499C1.96865 15.0187 1.77178 14.7937 1.77178 14.5125ZM15.7499 15.0187H13.8374V12.2625H16.228V14.5406C16.2562 14.7937 16.0312 15.0187 15.7499 15.0187Z"
                      fill=""
                    />
                  </svg>
                  Calendar
                </NavLink>
              </li> */}
              {/* <!-- Menu Item Calendar --> */}

              {/* <!-- Menu Item Profile --> */}
              <li>
                <NavLink
                  to="/profile"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes('profile') && 'bg-graydark dark:bg-meta-4'
                  }`}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
                      fill=""
                    />
                    <path
                      d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
                      fill=""
                    />
                  </svg>
                  Profil
                </NavLink>
              </li>

              {/* <!-- Menu Item Profile --> */}

            </ul>
          </div>

          {/* <!-- Others Group --> */}
          <div>

          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}

        <FakeAdBanner/>
      </div>
    </aside>

    
  );
};

export default Sidebar;
