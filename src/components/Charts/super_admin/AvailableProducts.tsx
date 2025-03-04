import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaSearch } from "react-icons/fa";

interface ProductStock {
  product_id: number;
  stock: {
    store_id: number;
    quantity: number;
  }[];
}

interface Warehouse {
  id: number;
  name: string;
}

interface AvailableProductsProps {
  products: {
    product_id: number;
    name: string;
    sku: string;
    manufacturer: string;
  }[];
  products_stock: ProductStock[];
  warehouses: Warehouse[];
  warehouseId?: number | null;
}

const AvailableProducts: React.FC<AvailableProductsProps> = ({
  products,
  products_stock,
  warehouses,
  warehouseId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"name" | "sku" | "id">("name");
  const productsPerPage = 6;

  // Merge product data with stock information
  const mergedProducts = products.map((product) => {
    const stockEntry = products_stock.find(
      (ps) => ps.product_id === product.product_id,
    );
    const stock = stockEntry?.stock || [];

    return {
      ...product,
      stock,
    };
  });

  useEffect(() => {
    setIsLoading(false);
  }, [products, products_stock]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchBy, warehouseId]);

  const filteredProducts = mergedProducts.filter((product) => {
    // Calculate stock based on warehouse filter
    const totalStock = warehouseId
      ? product.stock.find((s) => s.store_id === warehouseId)?.quantity || 0
      : product.stock.reduce((sum, s) => sum + s.quantity, 0);

    // Filter out products with 0 stock
    if (totalStock <= 0) return false;

    // Apply search filters
    if (!searchTerm) return true;

    const searchValue = searchTerm.toLowerCase();
    switch (searchBy) {
      case "name":
        return product.name.toLowerCase().includes(searchValue);
      case "sku":
        return product.sku.toLowerCase().includes(searchValue);
      case "id":
        return product.product_id.toString().includes(searchValue);
      default:
        return true;
    }
  });

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);

  if (isLoading) return <div>Chargement des produits...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          {warehouseId
            ? `Produits disponibles (${
                warehouses.find((w) => w.id === warehouseId)?.name || "Entrepôt"
              })`
            : "Produits disponibles (Tous les entrepôts)"}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={searchBy}
            onChange={(e) =>
              setSearchBy(e.target.value as "name" | "sku" | "id")
            }
            className="rounded-md border p-2 text-sm"
          >
            <option value="name">Nom</option>
            <option value="sku">SKU</option>
            <option value="id">ID</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder={`Rechercher ...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border p-2 pl-8 text-sm"
            />
            <FaSearch className="absolute left-2 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm font-medium text-gray-600">
        Produits en stock: {totalProducts}
      </p>

      <div className="space-y-2">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => {
            const stock = warehouseId
              ? product.stock.find((s) => s.store_id === warehouseId)
                  ?.quantity || 0
              : product.stock.reduce((sum, s) => sum + s.quantity, 0);

            return (
              <div
                key={product.product_id}
                className="rounded-lg border bg-white p-3 shadow-md transition duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{product.name}</h3>
                    <p className="text-xs text-gray-500">
                      ID: {product.product_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-gray-500">
                      SKU: {product.sku}
                    </span>
                    <span className="block text-sm text-gray-500">
                      Stock: {stock}
                      {warehouseId && (
                        <span className="ml-2 text-xs text-gray-400">
                          (Entrepôt {warehouseId})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500">
            {searchTerm ? "Aucun résultat trouvé" : "Aucun produit en stock"}
          </div>
        )}
      </div>

      {totalProducts > productsPerPage && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
          >
            <FaArrowLeft />
          </button>

          <p className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
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
