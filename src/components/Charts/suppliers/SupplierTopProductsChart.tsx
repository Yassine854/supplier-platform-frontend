import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Product {
  product_id: number;
  name: string;
  manufacturer: string;
  price: number;
  cost: number;
}

interface Order {
  _id: string;
  created_at: string;
  state: string;
  items: {
    product_id: number;
    qty_invoiced: number;
    row_total_incl_tax: number;
    name: string;
  }[];
}

interface ChartState {
  series: { name: string; data: number[] }[];
  options: any;
}

const SupplierTopProductsChart = ({
  supplierId,
  startDate: propStartDate,
  endDate: propEndDate,
}: {
  supplierId: string;
  startDate?: Date | null;
  endDate?: Date | null;
}) => {
  const [chartState, setChartState] = useState<ChartState>({
    series: [{ name: "Chargement...", data: [0] }],
    options: {
      chart: { type: "bar" },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: ["Chargement..."], title: { text: "Produits" } },
      yaxis: { title: { text: "Volume des Ventes" } },
      colors: ["#3B82F6"],
      dataLabels: { enabled: false },
    },
  });

  const [startDate, setStartDate] = useState<Date | null>(
    propStartDate || null,
  );
  const [endDate, setEndDate] = useState<Date | null>(propEndDate || null);
  const [metric, setMetric] = useState<"volume" | "revenue" | "turnover">(
    "volume",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStartDate(propStartDate || null);
    setEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

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
          throw new Error("Échec de la récupération des données");

        const products: Product[] = await productsRes.json();
        const orders: Order[] = await ordersRes.json();

        // Create product cost map
        const productCostMap = products.reduce(
          (acc, product) => {
            acc[product.product_id] = product.cost;
            return acc;
          },
          {} as Record<number, number>,
        );

        // Get supplier's product IDs
        const supplierProductIds = products
          .filter((p) => p.manufacturer === supplierId)
          .map((p) => p.product_id);

        // Filter and aggregate orders
        const productData = orders
          .filter((order) => {
            const orderDate = new Date(order.created_at);
            return (
              order.state === "complete" &&
              (!startDate || orderDate >= startDate) &&
              (!endDate || orderDate <= endDate)
            );
          })
          .flatMap((order) => order.items)
          .filter((item) => supplierProductIds.includes(item.product_id))
          .reduce((acc, item) => {
            const existing = acc.get(item.product_id) || {
              name: item.name,
              volume: 0,
              revenue: 0,
              turnover: 0,
            };

            const cost = productCostMap[item.product_id] || 0;

            return acc.set(item.product_id, {
              ...existing,
              volume: existing.volume + item.qty_invoiced,
              revenue: existing.revenue + item.row_total_incl_tax,
              turnover: existing.turnover + item.qty_invoiced * cost,
            });
          }, new Map<number, { name: string; volume: number; revenue: number; turnover: number }>());

        // Sort and format data
        const sortedProducts = Array.from(productData.values())
          .sort((a, b) => {
            if (metric === "volume") return b.volume - a.volume;
            if (metric === "revenue") return b.revenue - a.revenue;
            return b.turnover - a.turnover;
          })
          .slice(0, 10);

        setChartState({
          series: [
            {
              name:
                metric === "volume"
                  ? "Unités Vendues"
                  : metric === "revenue"
                  ? "Chiffre d'Affaires (TND)"
                  : "Chiffre d'Affaires (Coût)",
              data:
                sortedProducts.length > 0
                  ? sortedProducts.map((p) => {
                      if (metric === "volume") return p.volume;
                      if (metric === "revenue") return p.revenue;
                      return p.turnover;
                    })
                  : [0],
            },
          ],
          options: {
            ...chartState.options,
            xaxis: {
              categories:
                sortedProducts.length > 0
                  ? sortedProducts.map((p) => p.name)
                  : ["Aucune donnée"],
              title: { text: "Produits" },
            },
            yaxis: {
              title: {
                text:
                  metric === "volume"
                    ? "Volume des Ventes"
                    : metric === "revenue"
                    ? "Chiffre d'Affaires (TND)"
                    : "Chiffre d'Affaires (Coût)",
              },
            },
            colors: [
              metric === "volume"
                ? "#3B82F6"
                : metric === "revenue"
                ? "#10B981"
                : "#8B5CF6",
            ],
          },
        });
      } catch (err) {
        console.error("Erreur:", err);
        setError("Échec du chargement des données. Veuillez réessayer.");
        setChartState({
          series: [{ name: "Erreur", data: [0] }],
          options: {
            ...chartState.options,
            xaxis: { categories: ["Erreur lors du chargement des données"] },
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId, startDate, endDate, metric]);

  return (
    <div className="border-stroke rounded-lg border bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row">
        <h3 className="text-xl font-semibold">Produits les Plus Performants</h3>
        <select
          value={metric}
          onChange={(e) =>
            setMetric(e.target.value as "volume" | "revenue" | "turnover")
          }
          className="w-55 px-15 rounded border py-1 text-sm"
        >
          <option value="volume">Volume</option>
          <option value="revenue">Chiffre d&apos;Affaires (Ventes)</option>
          <option value="turnover">Chiffre d&apos;Affaires (Coût)</option>
        </select>
      </div>

      {/* <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-medium">Période :</label>
        <div className="flex space-x-2">
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Date de Début"
            className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="MMM d, yyyy"
            isClearable
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="Date de Fin"
            className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>
      </div> */}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center text-gray-500">
          Chargement des données...
        </div>
      ) : chartState.series[0].data.length > 0 &&
        chartState.series[0].data[0] !== 0 ? (
        <ReactApexChart
          options={chartState.options}
          series={chartState.series}
          type="bar"
          height={400}
        />
      ) : (
        <div className="flex h-96 items-center justify-center text-gray-500">
          Aucune donnée de vente pour vos produits dans cette période
        </div>
      )}
    </div>
  );
};

export default SupplierTopProductsChart;
