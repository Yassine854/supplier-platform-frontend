import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axios from "axios";

const newColors = ["#FF5733", "#33FF57", "#3357FF", "#F1C40F"];
const quarters = ["Q1", "Q2", "Q3", "Q4"];

interface OrderItem {
  product_id: number;
}

interface Order {
  created_at: string;
  status: string;
  customer_id: number;
  items: OrderItem[];
}

interface Product {
  product_id: number;
  manufacturer: string;
}

interface Customer {
  id: number;
  addresses: { region: { region: string } }[];
}

const OrdersByRegion: React.FC<{ supplierId: string }> = ({ supplierId }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [regions, setRegions] = useState<
    Record<string, { [key: string]: number }>
  >({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [ordersRes, productsRes, customersRes] = await Promise.all([
          axios.get("http://localhost:3000/api/orders"),
          axios.get("http://localhost:3000/api/products"),
          axios.get("http://localhost:3000/api/customers"),
        ]);

        const orders: Order[] = ordersRes.data;
        const products: Product[] = productsRes.data;
        const customers: Customer[] = customersRes.data;

        const validProductIds = new Set(
          products
            .filter((p) => p.manufacturer === supplierId)
            .map((p) => p.product_id),
        );

        const filteredOrders = orders.filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          return (
            orderDate.getFullYear() === selectedYear &&
            order.status !== "canceled" &&
            order.items.some((item: OrderItem) =>
              validProductIds.has(item.product_id),
            )
          );
        });

        const newRegions: Record<string, { [key: string]: Set<string> }> = {};

        filteredOrders.forEach((order: Order) => {
          const customer = customers.find((c) => c.id === order.customer_id);
          if (
            !customer ||
            !customer.addresses.length ||
            !customer.addresses[0].region.region
          )
            return;

          const region = customer.addresses[0].region.region;
          const month = new Date(order.created_at).getMonth() + 1;
          let quarter = "Q1";
          if (month >= 4 && month <= 6) quarter = "Q2";
          else if (month >= 7 && month <= 9) quarter = "Q3";
          else if (month >= 10 && month <= 12) quarter = "Q4";

          if (!newRegions[region]) {
            newRegions[region] = {
              Q1: new Set(),
              Q2: new Set(),
              Q3: new Set(),
              Q4: new Set(),
            };
          }
          newRegions[region][quarter].add(order.customer_id.toString());
        });

        const countRegions = Object.fromEntries(
          Object.entries(newRegions).map(([region, quarters]) => [
            region,
            Object.fromEntries(
              Object.entries(quarters).map(([q, set]) => [q, set.size]),
            ),
          ]),
        );

        setRegions(countRegions);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, supplierId]);

  const quarterSeries = quarters.map((quarter) => ({
    name: quarter,
    data: Object.keys(regions).map((region) => regions[region][quarter] || 0),
  }));

  const chartOptions: ApexOptions = {
    chart: { type: "bar", height: 400, background: "#FFF" },
    title: { text: "Clients uniques par région", align: "center" },
    xaxis: { categories: Object.keys(regions), title: { text: "Régions" } },
    yaxis: { title: { text: "Clients uniques" } },
    legend: { position: "top" },
    colors: newColors,
  };

  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center">
        <span className="text-sm font-medium">Year:</span>
        <select
          className="ml-2 rounded border p-2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {Array.from(
            { length: currentYear - 2019 },
            (_, i) => currentYear - i,
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ApexCharts
          options={chartOptions}
          series={quarterSeries}
          type="bar"
          height={400}
        />
      )}
    </div>
  );
};

export default OrdersByRegion;
