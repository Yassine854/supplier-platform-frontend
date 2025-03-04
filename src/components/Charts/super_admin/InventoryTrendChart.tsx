import React, { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import Select from "react-select";

interface Product {
  product_id: number;
  name: string;
  category_ids?: string[];
  [key: string]: any;
}

interface ProductStock {
  _id: string;
  product_id: number;
  stock: {
    store_id: number;
    quantity: number;
    price: number;
    _id: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  categoryId: number;
  nameCategory: string;
}

interface Warehouse {
  id: number;
  name: string;
  [key: string]: any;
}

interface InventoryTrendChartProps {
  warehouseId: number | null;
  warehouses: Warehouse[];
  products: Product[];
  orders: any[];
  productsStock: ProductStock[];
  categories: Category[];
}

interface OrderItem {
  product_id: number;
  qty_invoiced: number;
  date: Date;
}

const InventoryTrendChart: React.FC<InventoryTrendChartProps> = ({
  warehouseId,
  warehouses,
  products,
  orders,
  productsStock,
  categories,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get warehouse details from props
  const selectedWarehouse = useMemo(() => {
    return warehouses.find((wh) => wh.id === warehouseId);
  }, [warehouseId, warehouses]);

  const salesMap = useMemo(() => {
    const map = new Map<number, OrderItem[]>();

    orders
      .filter(
        (order) =>
          order.state === "complete" &&
          (warehouseId ? order.store_id === warehouseId : true),
      )
      .forEach((order) => {
        const orderDate = new Date(order.created_at);
        order.items.forEach((item: any) => {
          const entries = map.get(item.product_id) || [];
          entries.push({
            product_id: item.product_id,
            qty_invoiced: item.qty_invoiced,
            date: orderDate,
          });
          map.set(item.product_id, entries);
        });
      });

    return map;
  }, [orders, warehouseId]);

  const processedSeries = useMemo(() => {
    if (!warehouseId) return [];

    return productsStock
      .filter((productStock) => {
        const product = products.find(
          (p) => p.product_id === productStock.product_id,
        );
        const warehouseStock = productStock.stock.find(
          (s) => s.store_id === warehouseId,
        );

        return (
          warehouseStock &&
          warehouseStock.quantity > 0 &&
          (!selectedCategory ||
            product?.category_ids?.includes(selectedCategory))
        );
      })
      .map((productStock) => {
        const product = products.find(
          (p) => p.product_id === productStock.product_id,
        )!;
        const warehouseStock = productStock.stock.find(
          (s) => s.store_id === warehouseId,
        )!;
        const sales = salesMap.get(productStock.product_id) || [];

        let currentInventory = warehouseStock.quantity;
        const inventoryData = sales
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((sale) => {
            currentInventory -= sale.qty_invoiced;
            return {
              x: sale.date,
              y: Math.max(currentInventory, 0),
            };
          });

        inventoryData.push({
          x: new Date(),
          y: Math.max(warehouseStock.quantity, 0),
        });

        return {
          name: product.name,
          data: inventoryData.sort((a, b) => a.x.getTime() - b.x.getTime()),
        };
      });
  }, [productsStock, warehouseId, salesMap, products, selectedCategory]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.categoryId.toString(),
      label: category.nameCategory,
    }));
  }, [categories]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 500,
      zoom: { enabled: true },
      animations: { enabled: false },
      toolbar: { show: true },
    },
    xaxis: { type: "datetime" },
    yaxis: { title: { text: "Unités" } },
    stroke: { curve: "straight", width: 1 },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      shared: true,
      intersect: false,
    },
    dataLabels: { enabled: false },
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {selectedWarehouse
            ? `Tendances des stocks de produits - ${selectedWarehouse.name}`
            : "Tendances des stocks de produits"}
        </h2>
        <div className="flex gap-4">
          <div className="min-w-[200px]">
            <Select
              options={categoryOptions}
              onChange={(selected) =>
                setSelectedCategory(selected?.value || null)
              }
              placeholder="Filter by Category..."
              isClearable
            />
          </div>
        </div>
      </div>

      {!warehouseId ? (
        <div className="flex h-96 items-center justify-center text-gray-500">
          Veuillez sélectionner un entrepôt dans le tableau de bord pour
          afficher les tendances des stocks
        </div>
      ) : processedSeries.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={processedSeries}
          type="line"
          height={500}
        />
      ) : (
        <div className="flex h-96 items-center justify-center text-gray-500">
          {selectedCategory
            ? "No products found in this category"
            : "No inventory data available for selected warehouse"}
        </div>
      )}
    </div>
  );
};

export default InventoryTrendChart;
