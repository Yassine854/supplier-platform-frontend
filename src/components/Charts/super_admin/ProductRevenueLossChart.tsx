import React from "react";
import ApexCharts from "react-apexcharts";

interface OrderItem {
  product_id: number;
  amount_refunded: number;
}

interface Order {
  created_at: string;
  items: OrderItem[];
  state: string;
  store_id: number;
}

interface Props {
  orders: Order[];
  warehouseId?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

const ProductReturnsAnalysisChart: React.FC<Props> = ({
  orders: allOrders,
  warehouseId = null,
  startDate,
  endDate,
}) => {
  const [timeFilter, setTimeFilter] = React.useState("yearly");
  const loading = allOrders.length === 0;

  // Apply all filters
  const filteredOrders = allOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const isValid = order.state !== "canceled";
    const matchesWarehouse = warehouseId
      ? order.store_id === warehouseId
      : true;
    const withinDateRange =
      (!startDate || orderDate >= startDate) &&
      (!endDate || orderDate <= endDate);

    return isValid && matchesWarehouse && withinDateRange;
  });

  const getTimeKey = (date: Date, filter: string) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    switch (filter) {
      case "daily":
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
          date.getDate(),
        )}`;
      case "weekly":
        return `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      case "monthly":
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      case "semestrial":
        return `${date.getFullYear()}-S${date.getMonth() < 6 ? 1 : 2}`;
      default:
        return `${date.getFullYear()}`;
    }
  };

  const { labels, values } = filteredOrders.reduce(
    (acc, order) => {
      const orderDate = new Date(order.created_at);
      const timeKey = getTimeKey(orderDate, timeFilter);

      const totalRefund = order.items.reduce(
        (sum, item) => sum + (item.amount_refunded || 0),
        0,
      );

      if (totalRefund > 0) {
        acc.labels.add(timeKey);
        acc.values[timeKey] = (acc.values[timeKey] || 0) + totalRefund;
      }

      return acc;
    },
    {
      labels: new Set<string>(),
      values: {} as { [key: string]: number },
    },
  );

  const sortedLabels = Array.from(labels).sort();
  const chartData = {
    series: [
      {
        name: "Montant des Retours",
        data: sortedLabels.map((label) => values[label]),
      },
    ],
    options: {
      chart: {
        type: "bar" as const,
        height: 350,
        toolbar: { show: false },
      },
      xaxis: {
        categories: sortedLabels,
        title: { text: "Période" },
        labels: { rotate: -45 },
      },
      yaxis: {
        title: { text: "Montant des Retours (TND)" },
        labels: {
          formatter: (val: number) => `TND ${val.toFixed(2)}`,
        },
      },
      title: {
        text: `Analyse des Retours Produits (${timeFilter})`,
        align: "center" as const,
        style: { fontSize: "16px" },
      },
      tooltip: {
        y: { formatter: (val: number) => `TND ${val.toFixed(2)}` },
      },
    },
  };

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analyse des Retours Produits</h3>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="rounded-md border p-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="yearly">Annuel</option>
          <option value="monthly">Mensuel</option>
          <option value="weekly">Hebdomadaire</option>
          <option value="daily">Quotidien</option>
          <option value="semestrial">Semestriel</option>
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          Chargement des données de retour...
        </div>
      ) : sortedLabels.length > 0 ? (
        <ApexCharts
          options={chartData.options}
          series={chartData.series}
          type="bar"
          height={400}
        />
      ) : (
        <div className="py-8 text-center text-gray-500">
          Aucun retour enregistré pour la période sélectionnée
        </div>
      )}
    </div>
  );
};

export default ProductReturnsAnalysisChart;
