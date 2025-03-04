import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Product {
  product_id: number;
  name: string;
  manufacturer: string; // Added missing property
  stock_item: {
    qty: number;
    is_in_stock: boolean;
  };
}

interface OrderItem {
  product_id: number;
  qty_invoiced: number;
  date: Date;
}

interface ChartState {
  series: { name: string; data: { x: Date; y: number }[] }[];
  options: any;
}

const InventoryTrendChart = ({ supplierId }: { supplierId: string }) => {
  const [chartState, setChartState] = useState<ChartState>({
    series: [],
    options: {
      chart: { type: "line" },
      xaxis: { type: "datetime" },
      yaxis: { title: { text: "Unités" } },
      stroke: { curve: "stepline" },
      tooltip: { x: { format: "dd MMM yyyy" } },
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, ordersRes] = await Promise.all([
          fetch("http://localhost:3000/api/products"),
          fetch("http://localhost:3000/api/orders"),
        ]);

        if (!productsRes.ok || !ordersRes.ok)
          throw new Error("Data loading failed");

        const products: Product[] = await productsRes.json();
        const orders: any[] = await ordersRes.json();

        const supplierProducts = products.filter(
          (p) => p.manufacturer === supplierId && p.stock_item.is_in_stock,
        );

        // Process all sales data first
        const allSales: OrderItem[] = [];
        orders.forEach((order) => {
          if (order.state !== "complete") return;
          const orderDate = new Date(order.created_at);
          order.items.forEach((item: any) => {
            allSales.push({
              product_id: item.product_id,
              qty_invoiced: item.qty_invoiced,
              date: orderDate,
            });
          });
        });

        // Create inventory series for each product
        const inventorySeries = supplierProducts.map((product) => {
          // Filter sales for this product
          const productSales = allSales
            .filter((s) => s.product_id === product.product_id)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          // Calculate inventory timeline
          let inventory = product.stock_item.qty;
          const inventoryData: { x: Date; y: number }[] = [];
          const salesData: { x: Date; y: number }[] = [];

          // Rebuild inventory history backwards from current stock
          const salesHistory = productSales.reduceRight(
            (acc, sale) => {
              inventory += sale.qty_invoiced; // Add back sold units
              acc.push({ x: sale.date, y: inventory });
              return acc;
            },
            [] as { x: Date; y: number }[],
          );

          // Add current inventory state
          if (salesHistory.length > 0) {
            inventoryData.push(...salesHistory.reverse());
          }
          inventoryData.push({
            x: new Date(),
            y: product.stock_item.qty,
          });

          return {
            name: product.name,
            data: inventoryData,
          };
        });

        setChartState({
          series: inventorySeries,
          options: {
            ...chartState.options,
            chart: {
              ...chartState.options.chart,
              toolbar: { show: true },
            },
            stroke: { curve: "stepline" },
            markers: { size: 5 },
          },
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  return (
    <div className="border-stroke rounded-lg border bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-xl font-semibold">
        Tendances des stocks de produits
      </h3>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center text-gray-500">
          Loading inventory data...
        </div>
      ) : chartState.series.length > 0 ? (
        <ReactApexChart
          options={chartState.options}
          series={chartState.series}
          type="line"
          height={400}
        />
      ) : (
        <div className="flex h-96 items-center justify-center text-gray-500">
          No inventory data available
        </div>
      )}
    </div>
  );
};

export default InventoryTrendChart;
