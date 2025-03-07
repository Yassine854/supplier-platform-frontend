import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

const generateUniqueColors = (count: number) => {
  return Array.from(
    { length: count },
    (_, i) => `hsl(${(i * 137.508) % 360}, 70%, 50%)`,
  );
};

interface OrderItem {
  product_id: number;
  qty_invoiced: number;
}

interface Order {
  created_at: string;
  state: string;
  items: OrderItem[];
}

interface Product {
  product_id: number;
  name: string;
  manufacturer: string;
}

interface Props {
  supplierId: string;
  products: Product[];
  orders: Order[];
  startDate?: Date | null;
  endDate?: Date | null;
}

const TopArticlesOrdered: React.FC<Props> = ({
  supplierId,
  products,
  orders,
  startDate: propStartDate,
  endDate: propEndDate,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(propStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(propEndDate || null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const [state, setState] = useState<{
    series: number[];
    labels: string[];
    ordersCount: number[];
  }>({ series: [], labels: [], ordersCount: [] });

  useEffect(() => {
    setStartDate(propStartDate || null);
    setEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

  useEffect(() => {
    const processData = () => {
      try {
        const filteredProducts = products.filter(
          (product) => product.manufacturer === supplierId,
        );
        const productOrders: Record<string, number> = {};

        orders.forEach((order) => {
          if (order.state !== "canceled") {
            const orderDate = new Date(order.created_at);
            if (
              (!startDate || orderDate >= startDate) &&
              (!endDate || orderDate <= endDate)
            ) {
              order.items.forEach((item) => {
                const product = filteredProducts.find(
                  (p) => p.product_id === item.product_id,
                );
                if (product) {
                  productOrders[product.name] =
                    (productOrders[product.name] || 0) + item.qty_invoiced;
                }
              });
            }
          }
        });

        const sortedEntries = Object.entries(productOrders).sort(
          (a, b) => b[1] - a[1],
        );

        const labels = sortedEntries.map(([name]) => name);
        const ordersCount = sortedEntries.map(([, count]) => count);
        const totalOrders =
          ordersCount.reduce((acc, count) => acc + count, 0) || 1;

        setState({
          series: ordersCount.map((count) =>
            Number(((count / totalOrders) * 100).toFixed(2)),
          ),
          labels,
          ordersCount,
        });
      } catch (error) {
        console.error("Error processing data:", error);
      }
    };

    processData();
  }, [supplierId, startDate, endDate, products, orders]);

  const totalPages = Math.ceil(state.labels.length / itemsPerPage);
  const currentItems = state.labels.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const colors = generateUniqueColors(state.labels.length);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 400,
      fontFamily: "Satoshi, sans-serif",
      background: "#FFFFFF",
    },
    labels: state.labels,
    colors: colors,
    legend: { show: false },
    plotOptions: { pie: { donut: { size: "65%" } } },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { fontSize: "14px", fontWeight: "bold" },
    },
    tooltip: {
      y: {
        formatter: (_, { seriesIndex }) =>
          `${state.ordersCount[seriesIndex]} commandes`,
      },
    },
  };

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      <h3 className="mb-6 text-center text-2xl font-semibold">
        Produits les plus commandés
      </h3>

      <div className="flex flex-col items-start sm:flex-row">
        <div className="flex w-full justify-center sm:w-1/2">
          <ReactApexChart
            options={options}
            series={state.series}
            type="donut"
            height={350}
          />
        </div>
        <div className="w-full space-y-4 sm:w-1/2">
          {currentItems.map((product, index) => {
            const globalIndex = currentPage * itemsPerPage + index;
            return (
              <div
                key={product}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md"
              >
                <div
                  className="mt-1 h-5 w-5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: colors[globalIndex] }}
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{product}</span>
                  <span className="mt-1 text-sm text-gray-500">
                    {" "}
                    : {state.ordersCount[globalIndex]} commandes
                  </span>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage + 1} sur {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopArticlesOrdered;