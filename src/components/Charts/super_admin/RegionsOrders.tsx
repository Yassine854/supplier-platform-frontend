import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const newColors = ["#FF5733", "#33FF57", "#3357FF", "#F1C40F"];
const quarters = ["Q1", "Q2", "Q3", "Q4"];

interface Order {
  created_at: string;
  status: string;
  customer_id: number;
  store_id: number;
}

interface Customer {
  id: number;
  addresses: { region: { region: string } }[];
}

interface OrdersByRegionProps {
  orders: Order[];
  customers: Customer[];
  warehouseId?: number | null;
}

const OrdersByRegion: React.FC<OrdersByRegionProps> = ({
  orders,
  customers,
  warehouseId,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [regions, setRegions] = useState<
    Record<string, { [key: string]: number }>
  >({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const processData = () => {
      try {
        setLoading(true);

        const filteredOrders = orders.filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          return (
            orderDate.getFullYear() === selectedYear &&
            order.status !== "canceled" &&
            (!warehouseId || order.store_id === warehouseId)
          );
        });

        const regionData: Record<string, { [key: string]: Set<string> }> = {};

        filteredOrders.forEach((order: Order) => {
          const customer = customers.find((c) => c.id === order.customer_id);
          if (!customer?.addresses?.[0]?.region?.region) return;

          const region = customer.addresses[0].region.region;
          const month = new Date(order.created_at).getMonth() + 1;
          const quarter = quarters[Math.floor((month - 1) / 3)];

          regionData[region] = regionData[region] || {
            Q1: new Set(),
            Q2: new Set(),
            Q3: new Set(),
            Q4: new Set(),
          };
          regionData[region][quarter].add(order.customer_id.toString());
        });

        const formattedData = Object.fromEntries(
          Object.entries(regionData).map(([region, quarters]) => [
            region,
            Object.fromEntries(
              Object.entries(quarters).map(([q, set]) => [q, set.size]),
            ),
          ]),
        );

        setRegions(formattedData);
      } catch (error) {
        console.error("Error processing data", error);
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [selectedYear, warehouseId, orders, customers]);

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
        <span className="text-sm font-medium">Année:</span>
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
        <p>Chargement...</p>
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
