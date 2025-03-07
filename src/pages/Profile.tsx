import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import CoverOne from '../images/cover/cover-01.png';
import userSix from '../images/user/user.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaMapMarker,
} from 'react-icons/fa';

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    role: 'superadmin' | 'supplier';
    username?: string;
    company_name?: string;
    email?: string;
    contact_name?: string;
    phone_number?: string;
    city?: string;
    postal_code?: string;
  };
}

const Profile = () => {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth) as AuthResponse;
        setAuthData(parsedAuth);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/auth/signin');
  };

  if (!authData) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <>
      <Breadcrumb pageName="Profil" />

      <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <img
            src={CoverOne}
            alt="profile cover"
            className="h-full w-full object-cover opacity-20"
          />
        </div>

        <div className="px-4 pb-6 text-center">
          <div className="relative z-30 mx-auto -mt-16 h-32 w-32 rounded-full border-4 border-white bg-white shadow-xl dark:border-boxdark">
            <img
              src={userSix}
              alt="profile"
              className="h-full w-full rounded-full object-cover"
            />
          </div>

          <div className="mt-6">
            <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
              {authData.user.role === 'supplier'
                ? authData.user.company_name
                : authData.user.username}
            </h1>
            <p className="mb-6 text-lg font-medium text-gray-600 dark:text-gray-300">
              {authData.user.role.charAt(0).toUpperCase() + authData.user.role.slice(1)}
            </p>

            {authData.user.role === 'supplier' && (
              <div className="mx-auto max-w-4xl rounded-lg bg-gray-50 p-8 shadow-lg dark:bg-boxdark-2">
                <h2 className="mb-8 text-3xl font-semibold text-black dark:text-white flex items-center justify-center gap-3">
                  <FaBuilding className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  Détails de l'Entreprise
                </h2>
              
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <FaUser className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">Nom du Contact</p>
                        <p className="text-lg text-black dark:text-white">
                          {authData.user.contact_name}
                        </p>
                      </div>
                    </div>
                  
                    <div className="flex items-start gap-4">
                      <FaMapMarker className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">Adresse</p>
                        <p className="text-lg text-black dark:text-white">
                          {authData.user.postal_code} {authData.user.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <FaEnvelope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-lg text-black dark:text-white">
                          {authData.user.email}
                        </p>
                      </div>
                    </div>
                  
                    <div className="flex items-start gap-4">
                      <FaPhone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                        <p className="text-lg text-black dark:text-white">
                          {authData.user.phone_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;