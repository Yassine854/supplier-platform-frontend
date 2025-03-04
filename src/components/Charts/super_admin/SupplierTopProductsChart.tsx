import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

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
  store_id: number;
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
  options: ApexOptions;
}

interface TopProductsChartProps {
  startDate?: Date | null;
  endDate?: Date | null;
  warehouseId?: number | null;
  orders: Order[];
  products: Product[];
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          Chart rendering error - please check data inputs
        </div>
      );
    }
    return this.props.children;
  }
}

const TopProductsChart = ({
  startDate: propStartDate,
  endDate: propEndDate,
  warehouseId,
  orders,
  products,
}: TopProductsChartProps) => {
  const [chartState, setChartState] = useState<ChartState>({
    series: [{ name: "Loading...", data: [0] }],
    options: {
      chart: {
        type: "bar",
        toolbar: {
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "90%",
          distributed: false,
        },
      },
      xaxis: {
        categories: ["Loading..."],
        title: { text: "Products" },
        labels: {
          show: true,
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: false,
          trim: true,
          style: {
            fontSize: "10px",
            fontFamily: "Helvetica, Arial, sans-serif",
          },
          formatter: function (value: string) {
            return value && value.length > 0
              ? value.length > 40
                ? `${value.substring(0, 40)}...`
                : value
              : "N/A";
          },
        },
      },
      yaxis: {
        title: { text: "Sales Volume" },
        labels: {
          show: true,
          style: {
            fontSize: "10px",
          },
        },
      },
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
  const [sortedProducts, setSortedProducts] = useState<
    Array<{
      name: string;
      volume: number;
      revenue: number;
      turnover: number;
    }>
  >([]);

  useEffect(() => {
    setStartDate(propStartDate || null);
    setEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

  useEffect(() => {
    const processData = () => {
      try {
        setLoading(true);
        setError(null);

        const productCostMap = products.reduce(
          (acc, product) => {
            if (product.product_id && Number.isFinite(product.cost)) {
              acc[product.product_id] = product.cost;
            }
            return acc;
          },
          {} as Record<number, number>,
        );

        const validProductIds = products
          .filter((p) => p.product_id && p.name?.trim())
          .map((p) => p.product_id);

        const productData = orders
          .filter((order) => {
            const orderDate = new Date(order.created_at);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            return (
              order.state === "complete" &&
              (!warehouseId || order.store_id === warehouseId) &&
              (!start || orderDate >= start) &&
              (!end || orderDate <= end)
            );
          })
          .flatMap((order) => order.items)
          .filter((item) => validProductIds.includes(item.product_id))
          .reduce((acc, item) => {
            const productId = item.product_id;
            const existing = acc.get(productId) || {
              name: item.name?.trim() || `Product ${productId}`,
              volume: 0,
              revenue: 0,
              turnover: 0,
            };

            const cost = productCostMap[productId] || 0;
            const qty = Number.isFinite(item.qty_invoiced)
              ? item.qty_invoiced
              : 0;
            const revenue = Number.isFinite(item.row_total_incl_tax)
              ? item.row_total_incl_tax
              : 0;

            return acc.set(productId, {
              ...existing,
              volume: existing.volume + qty,
              revenue: existing.revenue + revenue,
              turnover: existing.turnover + qty * cost,
            });
          }, new Map<number, { name: string; volume: number; revenue: number; turnover: number }>());

        const sorted = Array.from(productData.values())
          .filter(
            (p) =>
              Number.isFinite(p.volume) &&
              Number.isFinite(p.revenue) &&
              Number.isFinite(p.turnover),
          )
          .sort((a, b) => {
            if (metric === "volume") return b.volume - a.volume;
            if (metric === "revenue") return b.revenue - a.revenue;
            return b.turnover - a.turnover;
          });

        setSortedProducts(sorted);

        setChartState({
          series: [
            {
              name:
                metric === "volume"
                  ? "Units Sold"
                  : metric === "revenue"
                  ? "Revenue (TND)"
                  : "Turnover (Cost)",
              data:
                sorted.length > 0
                  ? sorted.map((p) => {
                      const value =
                        metric === "volume"
                          ? p.volume
                          : metric === "revenue"
                          ? p.revenue
                          : p.turnover;
                      return Number.isFinite(value) ? value : 0;
                    })
                  : [0],
            },
          ],
          options: {
            ...chartState.options,
            xaxis: {
              ...chartState.options.xaxis,
              categories:
                sorted.length > 0
                  ? sorted.map((p) => p.name || "Unnamed Product")
                  : ["No data available"],
            },
            yaxis: {
              ...chartState.options.yaxis,
              title: {
                text:
                  metric === "volume"
                    ? "Sales Volume"
                    : metric === "revenue"
                    ? "Revenue (TND)"
                    : "Turnover (Cost)",
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
        console.error("Error:", err);
        setError("Failed to process data. Please check your inputs.");
        setChartState({
          series: [{ name: "Error", data: [0] }],
          options: {
            ...chartState.options,
            xaxis: { categories: ["Data processing error"] },
          },
        });
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [startDate, endDate, metric, warehouseId, orders, products]);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row">
        <h3 className="text-xl font-semibold">Produits les Plus Performants</h3>
        <select
          value={metric}
          onChange={(e) =>
            setMetric(e.target.value as "volume" | "revenue" | "turnover")
          }
          className="rounded border px-4 py-2 text-sm"
        >
          <option value="volume">Volume</option>
          <option value="revenue">Chiffre d&apos;Affaires (Ventes)</option>
          <option value="turnover">Chiffre d&apos;Affaires (Coût)</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center text-gray-500">
          Chargement des données...
        </div>
      ) : (
        <ErrorBoundary>
          <div className="h-[800px] overflow-y-auto pr-4">
            {sortedProducts.length > 0 ? (
              <ReactApexChart
                options={chartState.options}
                series={chartState.series}
                type="bar"
                height={Math.max(sortedProducts.length * 40, 400)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Aucune donnée de vente disponible
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default TopProductsChart;
