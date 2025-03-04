import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

interface RevenueOverTimeChartProps {
  supplierId: string;
}

interface Order {
  created_at: string;
  state: string;
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

const SupplierAreaChart: React.FC<RevenueOverTimeChartProps> = ({
  supplierId,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState("annuel");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3000/api/orders").then(
        (res) => res.json() as Promise<Order[]>,
      ),
      fetch("http://localhost:3000/api/products").then(
        (res) => res.json() as Promise<Product[]>,
      ),
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData);
      setProducts(productsData);
    });
  }, []);

  useEffect(() => {
    if (orders.length === 0 || products.length === 0) return;

    // Get supplier products and create product map
    const supplierProducts = products.filter(
      (p) => p.manufacturer === supplierId,
    );
    const productMap = new Map(supplierProducts.map((p) => [p.product_id, p]));
    const timeSeries: { [key: string]: number } = {};

    // Process valid orders
    orders.forEach((order) => {
      if (order.state === "canceled") return;

      const orderDate = new Date(order.created_at);
      const timeKey = getTimeKey(orderDate);

      order.items.forEach((item) => {
        const product = productMap.get(item.product_id);
        if (!product) return;

        const turnover = item.qty_invoiced * product.cost;
        timeSeries[timeKey] = (timeSeries[timeKey] || 0) + turnover;
      });
    });

    // Sort and format data for chart
    const timeLabels = Object.keys(timeSeries).sort();
    const turnoverData = timeLabels.map((time) => timeSeries[time]);

    setChartData({
      series: [{ name: "Turnover", data: turnoverData }],
      options: getChartOptions(timeLabels, timeFilter),
    });
  }, [orders, products, supplierId, timeFilter]);

  // Helper function to generate time keys
  const getTimeKey = (date: Date) => {
    switch (timeFilter) {
      case "mensuel":
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      case "hebdomadaire":
        const weekNumber = Math.ceil(date.getDate() / 7);
        return `${date.getFullYear()}-W${weekNumber
          .toString()
          .padStart(2, "0")}`;
      case "quotidien":
        return date.toISOString().split("T")[0];
      case "semestriel":
        return `${date.getFullYear()}-S${date.getMonth() < 6 ? "01" : "02"}`;
      default:
        return date.getFullYear().toString();
    }
  };

  // Chart options configuration
  const getChartOptions = (
    categories: string[],
    filter: string,
  ): ApexOptions => ({
    chart: {
      type: "area",
      height: 400,
      background: "#FFFFFF",
    },
    xaxis: {
      categories,
      title: { text: "Temps" }, // "Time" -> "Temps"
      type: "category",
    },
    yaxis: {
      title: { text: "Chiffre d'affaires (TND)" }, // "Turnover (TND)" -> "Chiffre d'affaires (TND)"
      labels: { formatter: (val: number) => `${val.toFixed(0)} TND` },
    },
    title: {
      text: `Chiffre d'affaires (${filter})`, // "Turnover" -> "Chiffre d'affaires"
      align: "center",
    },
    tooltip: {
      y: { formatter: (val: number) => `${val.toFixed(2)} TND` },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
  });

  return (
    <div className="border-stroke mt-6 w-full rounded-lg border bg-white p-6 shadow-lg">
      <div className="mb-4">
        <label className="mr-2">Filtrer :</label>{" "}
        {/* "Filter:" -> "Filtrer :" */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border p-2"
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
        <p>Chargement des données du graphique...</p>
      )}
    </div>
  );
};

export default SupplierAreaChart;
