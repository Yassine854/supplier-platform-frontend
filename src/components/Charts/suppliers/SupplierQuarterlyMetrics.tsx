import React, { useEffect, useState } from "react";

interface Order {
  created_at: string;
  state: string;
  customer_id: number;
  items: Array<{
    product_id: number;
    qty_invoiced: number;
  }>;
}

interface Product {
  product_id: number;
  manufacturer: string;
  cost: number;
}

interface QuarterlyData {
  quarter: string;
  totalOrders: number;
  uniqueCustomers: Set<number>;
  turnover: number;
}

const SupplierQuarterlyMetrics = ({ supplierId }: { supplierId: string }) => {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [quartersData, setQuartersData] = useState<QuarterlyData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3000/api/orders").then(
        (res) => res.json() as Promise<Order[]>,
      ),
      fetch("http://localhost:3000/api/products").then(
        (res) => res.json() as Promise<Product[]>,
      ),
    ]).then(([orders, products]) => {
      const supplierProducts = products.filter(
        (p) => p.manufacturer === supplierId,
      );
      const supplierProductIds = new Set(
        supplierProducts.map((p) => p.product_id),
      );
      const productMap = new Map(
        supplierProducts.map((p) => [p.product_id, p]),
      );

      const validOrders = orders.filter(
        (order) =>
          order.state !== "canceled" &&
          order.items.some((item) => supplierProductIds.has(item.product_id)),
      );

      const years = Array.from(
        new Set(
          validOrders.map((order) => new Date(order.created_at).getFullYear()),
        ),
      ).sort((a: number, b: number) => b - a);

      setAvailableYears(years);
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }

      const quarterlyMap = validOrders.reduce(
        (acc: Map<string, QuarterlyData>, order) => {
          const orderDate = new Date(order.created_at);
          const year = orderDate.getFullYear();
          if (year !== selectedYear) return acc;

          const quarter = `Q${Math.floor(orderDate.getMonth() / 3) + 1}`;

          if (!acc.has(quarter)) {
            acc.set(quarter, {
              quarter,
              totalOrders: 0,
              uniqueCustomers: new Set<number>(),
              turnover: 0,
            });
          }

          const quarterData = acc.get(quarter)!;
          quarterData.totalOrders++;

          if (order.customer_id) {
            quarterData.uniqueCustomers.add(order.customer_id);
          }

          order.items.forEach((item) => {
            if (supplierProductIds.has(item.product_id)) {
              const product = productMap.get(item.product_id);
              if (product) {
                quarterData.turnover += item.qty_invoiced * product.cost;
              }
            }
          });

          return acc;
        },
        new Map<string, QuarterlyData>(),
      );

      setQuartersData(Array.from(quarterlyMap.values()));
    });
  }, [supplierId, selectedYear]);

  // Calculate yearly totals
  const totalOrders = quartersData.reduce((sum, q) => sum + q.totalOrders, 0);
  const totalUniqueCustomers = new Set(
    quartersData.flatMap((q) => Array.from(q.uniqueCustomers)),
  ).size;
  const totalTurnover = quartersData.reduce((sum, q) => sum + q.turnover, 0);

  return (
    <div className="border-stroke rounded-lg border bg-white p-4 shadow-lg">
      {/* Title & Year Selector */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold sm:text-xl">
          Performance Trimestrielle
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full rounded border p-2 sm:w-auto"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Optimized Table - No Scrolling */}
      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left sm:p-3">Trim.</th>
            <th className="p-2 text-left sm:p-3">Cmds Tot.</th>
            <th className="p-2 text-left sm:p-3">Clients</th>
            <th className="p-2 text-left sm:p-3">C.A. (TND)</th>
          </tr>
        </thead>
        <tbody>
          {quartersData.map((data, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2 sm:p-3">{data.quarter}</td>
              <td className="p-2 sm:p-3">{data.totalOrders}</td>
              <td className="p-2 sm:p-3">{data.uniqueCustomers.size}</td>
              <td className="p-2 sm:p-3">{(data.turnover || 0).toFixed(2)}</td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-gray-200 font-semibold">
            <td className="p-2 sm:p-3">Total</td>
            <td className="p-2 sm:p-3">{totalOrders}</td>
            <td className="p-2 sm:p-3">{totalUniqueCustomers}</td>
            <td className="p-2 sm:p-3">{totalTurnover.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SupplierQuarterlyMetrics;
