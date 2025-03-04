import React, { useEffect, useState } from "react";

interface Order {
  created_at: string;
  state: string;
  customer_id: number;
  store_id: number;
  items: Array<{
    product_id: number;
    qty_invoiced: number;
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
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [quartersData, setQuartersData] = useState<QuarterlyData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (!orders.length || !products.length) return;

    const productMap = new Map(products.map((p) => [p.product_id, p]));

    // Apply warehouse filter
    const validOrders = orders
      .filter(
        (order) =>
          order.state !== "canceled" &&
          (warehouseId === null || order.store_id === warehouseId),
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    // Extract available years from filtered orders
    const years = Array.from(
      new Set(
        validOrders.map((order) => new Date(order.created_at).getFullYear()),
      ),
    ).sort((a, b) => b - a);

    setAvailableYears(years);
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }

    const globalCustomerSet = new Set<number>();
    const quarterlyMap = new Map<string, QuarterlyData>();

    validOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const year = orderDate.getFullYear();
      if (year !== selectedYear) return;

      const quarter = `Q${Math.floor(orderDate.getMonth() / 3) + 1}`;

      if (!quarterlyMap.has(quarter)) {
        quarterlyMap.set(quarter, {
          quarter,
          totalOrders: 0,
          uniqueCustomers: new Set<number>(),
          revenue: 0,
        });
      }

      const quarterData = quarterlyMap.get(quarter)!;
      quarterData.totalOrders++;

      // Track unique customers globally for the year
      const isNewCustomer = !globalCustomerSet.has(order.customer_id);
      if (order.customer_id && isNewCustomer) {
        quarterData.uniqueCustomers.add(order.customer_id);
        globalCustomerSet.add(order.customer_id);
      }

      // Calculate revenue using product prices
      order.items.forEach((item) => {
        const product = productMap.get(item.product_id);
        if (product) {
          quarterData.revenue += item.qty_invoiced * product.price;
        }
      });
    });

    setQuartersData(Array.from(quarterlyMap.values()));
  }, [selectedYear, warehouseId, orders, products]);

  // Calculate yearly totals
  const totalOrders = quartersData.reduce((sum, q) => sum + q.totalOrders, 0);
  const totalUniqueCustomers = new Set(
    quartersData.flatMap((q) => Array.from(q.uniqueCustomers)),
  ).size;
  const totalRevenue = quartersData.reduce((sum, q) => sum + q.revenue, 0);

  return (
    <div className="border-stroke rounded-lg border bg-white p-4 shadow-lg">
      {/* Title & Year Selector */}
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
          {/* Total row */}
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
