import React, { useEffect, useState } from "react";

interface Order {
  created_at: string;
  state: string;
  customer_id: number;
  store_id: number;
  items: Array<{
    product_id: number;
    qty_invoiced: number;
    price?: number;
  }>;
}

interface Product {
  product_id: number;
  price: number;
}

interface QuarterlyData {
  quarter: string;
  totalOrders: number;
  uniqueCustomers: Set<number>;
  revenue: number;
}

interface SupplierQuarterlyMetrics {
  warehouseId?: number | null;
  orders: Order[];
  products: Product[];
}

const AllSuppliersQuarterlyMetrics = ({
  warehouseId = null,
  orders,
  products,
}: SupplierQuarterlyMetrics) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [quartersData, setQuartersData] = useState<QuarterlyData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (!orders.length) return;

    const productMap = new Map(products.map((p) => [p.product_id, p.price]));

    // Filter orders by warehouse and not canceled
    const validOrders = orders.filter(
      (order) =>
        order.state !== "canceled" &&
        (warehouseId === null || order.store_id === warehouseId)
    );

    // Extract all years from valid orders
    const years = Array.from(
      new Set(validOrders.map((o) => new Date(o.created_at).getFullYear()))
    ).sort((a, b) => b - a);
    setAvailableYears(years);

    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }

    // Group orders per quarter for the selected year
    const quarterlyMap = new Map<string, QuarterlyData>();

    validOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const year = orderDate.getFullYear();
      if (year !== selectedYear) return; // only include selected year

      const quarter = `Q${Math.floor(orderDate.getMonth() / 3) + 1}`;
      if (!quarterlyMap.has(quarter)) {
        quarterlyMap.set(quarter, {
          quarter,
          totalOrders: 0,
          uniqueCustomers: new Set<number>(),
          revenue: 0,
        });
      }

      const qData = quarterlyMap.get(quarter)!;
      qData.totalOrders++;
      if (order.customer_id) qData.uniqueCustomers.add(order.customer_id);

      order.items.forEach((item) => {
        const price = productMap.get(item.product_id) ?? item.price ?? 0;
        qData.revenue += item.qty_invoiced * price;
      });
    });

    // Ensure all 4 quarters exist even if empty
    ["Q1", "Q2", "Q3", "Q4"].forEach((q) => {
      if (!quarterlyMap.has(q)) {
        quarterlyMap.set(q, {
          quarter: q,
          totalOrders: 0,
          uniqueCustomers: new Set(),
          revenue: 0,
        });
      }
    });

    setQuartersData(
      Array.from(quarterlyMap.values()).sort((a, b) =>
        a.quarter.localeCompare(b.quarter)
      )
    );
  }, [selectedYear, warehouseId, orders, products]);

  // Year totals
  const totalOrders = quartersData.reduce((sum, q) => sum + q.totalOrders, 0);
  const totalUniqueCustomers = new Set(
    quartersData.flatMap((q) => Array.from(q.uniqueCustomers))
  ).size;
  const totalRevenue = quartersData.reduce((sum, q) => sum + q.revenue, 0);

  return (
    <div className="border-stroke rounded-lg border bg-white p-4 shadow-lg">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold sm:text-xl">
          Performance Globale Trimestrielle
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
              <td className="p-2 sm:p-3">{data.revenue.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-semibold">
            <td className="p-2 sm:p-3">Total</td>
            <td className="p-2 sm:p-3">{totalOrders}</td>
            <td className="p-2 sm:p-3">{totalUniqueCustomers}</td>
            <td className="p-2 sm:p-3">{totalRevenue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AllSuppliersQuarterlyMetrics;
