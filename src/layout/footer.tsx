import { useState } from 'react';
import EmailFormPopup from './email';
import Kamioun_logo from '../images/kamioun.png';

interface SupplierDetails {
  company_name: string;
  contact_name: string;
  phone_number: string;
  email: string;
  postal_code: string;
  city: string;
  country: string;
}

interface FooterProps {
  supplier: SupplierDetails | null;
}

const Footer: React.FC<FooterProps> = ({ supplier }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);

  return (
    <>
      {showEmailForm && supplier && (
        <EmailFormPopup
          onClose={() => setShowEmailForm(false)}
          supplierDetails={{
            company_name: supplier.company_name,
            contact_name: supplier.contact_name,
            phone_number: supplier.phone_number,
            email: supplier.email,
            address: `${supplier.postal_code} ${supplier.city}, ${supplier.country}`,
          }}
        />
      )}

      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            
            {/* Logo Section */}
            <div className="flex flex-col items-center space-y-6 lg:items-start">
              <div className="relative group">
                <img
                  alt="Kamioun"
                  className="h-12 w-auto transform transition duration-300 hover:scale-105"
                  src={Kamioun_logo}
                />
              </div>
              <p className="text-sm text-gray-400">
                © 2025 Kamioun.<br/>
                Tous droits réservés.
              </p>
            </div>

            {/* Services Section */}
            <div className="flex flex-col items-center space-y-8">
              <h2 className="text-xl font-bold text-amber-400">Nos Services</h2>
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-amber-400">Marketing</h3>
                  <ul className="space-y-3">
                    {['Annonces', 'Promotions', 'Codes de réduction pour clients'].map((service) => (
                      <li 
                        key={service}
                        className="flex items-center text-gray-300 hover:text-amber-300 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2 fill-current text-amber-400" viewBox="0 0 24 24">
                          <path d="M9.707 17.707l10-10-1.414-1.414L9 15.586l-4.293-4.293-1.414 1.414L9 18.414z"/>
                        </svg>
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-amber-400">Commercial</h3>
                  <ul className="space-y-3">
                    {['Consultation commerciale personnalisée', 'Devis sur mesure', 'Suivi de commande & support'].map((service) => (
                      <li 
                        key={service}
                        className="flex items-center text-gray-300 hover:text-amber-300 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2 fill-current text-amber-400" viewBox="0 0 24 24">
                          <path d="M9.707 17.707l10-10-1.414-1.414L9 15.586l-4.293-4.293-1.414 1.414L9 18.414z"/>
                        </svg>
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center lg:text-right">
              <button
                onClick={() => setShowEmailForm(true)}
                className="group relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-gray-900 font-bold hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">
                  Demander un service
                  <span className="ml-2">🚀</span>
                </span>
                <div className="absolute -inset-1 bg-amber-400/30 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;