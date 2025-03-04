import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";

const AvailableProducts: React.FC<{ supplierId: string }> = ({
  supplierId,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/products");
        setProducts(response.data);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to fetch products");
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter available products based on supplier and stock status
  const availableProducts = products.filter(
    (product) =>
      product.manufacturer === supplierId &&
      product.stock_item?.is_in_stock &&
      product.stock_item?.qty != 0,
  );

  const totalAvailableProducts = availableProducts.length;
  const totalPages = Math.ceil(totalAvailableProducts / productsPerPage);
  const currentProducts = availableProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <h2 className="mb-3 text-xl font-semibold">Produits disponibles</h2>
      <p className="mb-4 text-sm font-medium text-gray-600">
        Total disponible: {totalAvailableProducts}
      </p>

      <div className="space-y-2">
        {totalAvailableProducts > 0 ? (
          currentProducts.map((product) => (
            <div
              key={product.product_id}
              className="rounded-lg border bg-white p-3 shadow-md transition duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{product.name}</h3>
                <span className="text-sm text-gray-500">
                  Qty: {product.stock_item?.qty || 0}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>SKU: {product.sku}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            No available products in stock for this supplier.
          </div>
        )}
      </div>

      {totalAvailableProducts > productsPerPage && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
          >
            <FaArrowLeft />
          </button>

          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
          >
            <FaArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailableProducts;
