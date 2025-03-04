import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface Order {
  store_id: number;
  created_at: string;
  state: string;
  items: Array<{
    product_id: number;
    qty_invoiced: number;
  }>;
}

interface Product {
  product_id: number;
  price: number;
}

interface AreaChartProps {
  warehouseId: number | null;
  orders: Order[];
  products: Product[];
}

const AreaChart: React.FC<AreaChartProps> = ({
  warehouseId,
  orders,
  products,
}) => {
  const [chartData, setChartData] = useState<{
    series: { name: string; data: number[] }[];
    options: ApexOptions;
  } | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("annuel");

  const getTimeKey = (date: Date): string => {
    switch (timeFilter) {
      case "mensuel":
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      case "hebdomadaire":
        const week = Math.ceil(date.getDate() / 7);
        return `${date.getFullYear()}-W${week.toString().padStart(2, "0")}`;
      case "quotidien":
        return date.toISOString().split("T")[0];
      case "semestriel":
        return `${date.getFullYear()}-S${date.getMonth() < 6 ? "01" : "02"}`;
      default:
        return date.getFullYear().toString();
    }
  };

  const getChartOptions = (
    categories: string[],
    filter: string,
  ): ApexOptions => ({
    chart: {
      type: "area",
      height: 400,
      background: "#FFFFFF",
    },
    colors: ["#3C50E0"],
    xaxis: {
      categories,
      title: { text: "Temps" },
      type: "category",
      axisBorder: { show: false },
    },
    yaxis: {
      title: { text: "Revenu total (TND)" },
      labels: { formatter: (val: number) => `${val.toFixed(0)} TND` },
    },
    title: {
      text: `Revenu total (${filter})`,
      align: "center",
      style: { fontSize: "18px", fontWeight: "bold" },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(2)} TND`,
        title: { formatter: () => "Revenu: " },
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    grid: {
      borderColor: "#e7e7e7",
      row: { colors: ["#f3f3f3", "transparent"], opacity: 0.5 },
    },
  });

  useEffect(() => {
    if (!orders.length || !products.length) return;

    const productMap = new Map(products.map((p) => [p.product_id, p]));
    const timeSeries: Record<string, number> = {};

    // Apply warehouse filter if specified
    const filteredOrders = orders.filter((order) => {
      const isValid = order.state !== "canceled";
      const matchesWarehouse = warehouseId
        ? order.store_id === warehouseId
        : true;
      return isValid && matchesWarehouse;
    });

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const timeKey = getTimeKey(orderDate);

      order.items.forEach((item) => {
        const product = productMap.get(item.product_id);
        if (!product) return;

        const revenue = item.qty_invoiced * product.price;
        timeSeries[timeKey] = (timeSeries[timeKey] || 0) + revenue;
      });
    });

    const sortedTimes = Object.keys(timeSeries).sort();
    const seriesData = sortedTimes.map((time) => timeSeries[time]);

    setChartData({
      series: [{ name: "Revenu", data: seriesData }],
      options: getChartOptions(sortedTimes, timeFilter),
    });
  }, [orders, products, warehouseId, timeFilter]);

  return (
    <div className="border-stroke mt-6 w-full rounded-lg border bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-black">Analyse du Revenu</h3>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border-body rounded-lg border bg-white px-4 py-2 hover:border-primary"
        >
          <option value="annuel">Annuel</option>
          <option value="mensuel">Mensuel</option>
          <option value="hebdomadaire">Hebdomadaire</option>
          <option value="quotidien">Quotidien</option>
          <option value="semestriel">Semestriel</option>
        </select>
      </div>

      {chartData ? (
        <ReactApexChart
          options={chartData.options}
          series={chartData.series}
          type="area"
          height={400}
        />
      ) : (
        <div className="flex h-96 items-center justify-center">
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      )}
    </div>
  );
};

export default AreaChart;
