import React, { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

interface SupplierDetails {
  company_name: string;
  contact_name: string;
  phone_number: string;
  email: string;
  address: string;
}

interface EmailFormPopupProps {
  onClose: () => void;
  supplierDetails: SupplierDetails;
}

const serviceCategories = {
  "Services Marketing": [
    "Annonces",
    "Promotions",
    "Codes de réduction pour clients",
  ],
  "Services Commerciaux": [
    "Consultation commerciale personnalisée",
    "Devis sur mesure",
    "Suivi de commande & support",
  ],
};

const EmailFormPopup: React.FC<EmailFormPopupProps> = ({
  onClose,
  supplierDetails,
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [contactName] = useState(supplierDetails.contact_name);
  const [contactPhone] = useState(supplierDetails.phone_number);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const templateParams = {
      to_email: "medhioubyassine@gmail.com",
      from_name: supplierDetails.company_name,
      reply_to: supplierDetails.email,
      subject: `[${supplierDetails.company_name}] - Request for Services`,
      message: `Hello Kamioun team,

I ${supplierDetails.company_name} would like to request the following services:
${selectedServices.map((service) => `- ${service}`).join("\n")}

Contact information:
- Contact Person: ${contactName}
- Phone Number: ${contactPhone}
- Email: ${supplierDetails.email}
- Company Address: ${supplierDetails.address}

Best regards,
${supplierDetails.company_name}`,
    };

    try {
      await emailjs.send(
        "service_uyp6kf7",
        "template_zrvu0d5",
        templateParams,
        "lib5DzwJvadW8SbiB"
      );
      onClose();
    } catch (err) {
      setError("Échec de l'envoi de la demande. Veuillez réessayer.");
      console.error("Erreur d'envoi d'email:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 mt-16 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div
        ref={popupRef}
        className="w-full max-w-xs rounded-lg bg-white p-4 shadow-xl md:max-w-md"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Demande de service</h2>
          <button
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <label className="mb-1 block text-sm font-medium">Sujet</label>
    <input
      type="text"
      disabled
      value={`[${supplierDetails.company_name}] - Demande de services`}
      className="w-full rounded border bg-gray-100 p-2 text-sm"
    />
  </div>

  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Services
    </label>
    <div className="max-h-40 overflow-y-auto rounded border p-2 text-sm">
      {Object.entries(serviceCategories).map(([category, services]) => (
        <div
          key={category}
          className="mb-4 border-b pb-2 last:border-b-0"
        >
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {category}
          </h3>
          {services.map((service) => (
            <div
              key={service}
              onClick={() => {
                setSelectedServices((prev) =>
                  prev.includes(service)
                    ? prev.filter((s) => s !== service)
                    : [...prev, service]
                );
              }}
              className={`mb-1 cursor-pointer rounded p-2 text-sm ${
                selectedServices.includes(service)
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100"
              }`}
            >
              {service}
              {selectedServices.includes(service) && (
                <span className="ml-2 text-blue-600">✓</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
    
    {/* Selected services display */}
    {selectedServices.length > 0 && (
      <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
        <p className="text-xs font-medium text-gray-600">Services sélectionnés:</p>
        <div className="mt-1 text-xs text-gray-700">
          {selectedServices.join(", ")}
        </div>
      </div>
    )}
  </div>

  {error && (
    <div className="text-center text-xs text-red-500">{error}</div>
  )}

  <button
    type="submit"
    disabled={loading}
    className="w-full rounded bg-blue-600 p-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
  >
    {loading ? 'Envoi en cours...' : 'Envoyer'}
  </button>
</form>
      </div>
    </div>
  );
};

export default EmailFormPopup;