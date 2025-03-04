import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";

interface ProductRevenueLossChartProps {
  supplierId: string;
}

interface OrderItem {
  product_id: number;
  amount_refunded: number;
}

interface Order {
  created_at: string;
  items: OrderItem[];
  state: string;
}

interface Product {
  product_id: number;
  manufacturer: string;
}

const ProductRevenueLossChart: React.FC<ProductRevenueLossChartProps> = ({
  supplierId,
}) => {
  const [timeFilter, setTimeFilter] = useState("yearly");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch("http://localhost:3000/api/orders"),
          fetch("http://localhost:3000/api/products"),
        ]);

        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();

        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get supplier's product IDs
  const supplierProductIds = new Set(
    products
      .filter((product) => product.manufacturer === supplierId)
      .map((product) => product.product_id),
  );

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

  const { labels, values } = orders.reduce(
    (acc, order) => {
      const orderDate = new Date(order.created_at);
      const timeKey = getTimeKey(orderDate, timeFilter);

      // Filter items for supplier's products and calculate refunds
      const totalRefund = order.items
        .filter((item) => supplierProductIds.has(item.product_id))
        .reduce((sum, item) => sum + (item.amount_refunded || 0), 0);

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
        name: "Montant du Remboursement",
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
        title: { text: "Temps" },
        labels: { rotate: -45 },
      },
      yaxis: {
        title: { text: "Montant du Remboursement (TND)" },
        labels: {
          formatter: (val: number) => `TND ${val.toFixed(2)}`,
        },
      },
      title: {
        text: `Remboursements de Produits (${timeFilter})`,
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
        <h3 className="text-lg font-semibold">Analyse des Remboursements</h3>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="rounded-md border p-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="annuel">Annuel</option>
          <option value="mensuel">Mensuel</option>
          <option value="hebdomadaire">Hebdomadaire</option>
          <option value="quotidien">Quotidien</option>
          <option value="semestriel">Semestriel</option>
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          Chargement des données de remboursement...
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
          Aucune donnée de remboursement disponible pour la période sélectionnée
        </div>
      )}
    </div>
  );
};

export default ProductRevenueLossChart;
