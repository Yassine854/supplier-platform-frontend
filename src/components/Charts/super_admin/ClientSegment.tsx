import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";

const newColors = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6EE7B7", // Teal
  "#FDE68A", // Yellow
  "#FCA5A5", // Rose
  "#94A3B8", // Slate
];

interface Customer {
  id: number;
  retailer_profile: string;
}

interface Order {
  entity_id: number;
  customer_id?: number;
  created_at: string;
  state: string;
  store_id: number;
}

interface ClientSegmentProps {
  startDate?: Date | null;
  endDate?: Date | null;
  warehouseId?: number | null;
  orders: Order[];
  customers: Customer[];
}

const ClientSegment: React.FC<ClientSegmentProps> = ({
  startDate,
  endDate,
  warehouseId,
  orders,
  customers,
}) => {
  const [chartData, setChartData] = useState<{
    series: number[];
    options: ApexCharts.ApexOptions;
  } | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [segmentDetails, setSegmentDetails] = useState<
    Array<{ label: string; count: number }>
  >([]);

  useEffect(() => {
    const processClientSegments = () => {
      try {
        // 1. Create customer profile mapping with "0" handling
        const profileMap = customers.reduce(
          (acc: Record<number, string>, customer) => {
            acc[customer.id] =
              customer.retailer_profile === "0" || !customer.retailer_profile
                ? "Inconnue"
                : customer.retailer_profile;
            return acc;
          },
          {},
        );

        // 2. Apply all filters to orders
        const filteredOrders = orders.filter((order) => {
          const orderDate = new Date(order.created_at);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;

          // Normalize dates
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);

          return (
            order.state !== "canceled" &&
            (!warehouseId || order.store_id === warehouseId) &&
            (!start || orderDate >= start) &&
            (!end || orderDate <= end)
          );
        });

        // 3. Track unique customers per profile
        const profileDistribution: Record<string, Set<number>> = {};
        const uniqueCustomers = new Set<number>();

        filteredOrders.forEach((order) => {
          if (!order.customer_id) return;

          const customerId = order.customer_id;
          const profile = profileMap[customerId];

          if (!uniqueCustomers.has(customerId)) {
            profileDistribution[profile] =
              profileDistribution[profile] || new Set();
            profileDistribution[profile].add(customerId);
            uniqueCustomers.add(customerId);
          }
        });

        // 4. Prepare visualization data
        const segments = Object.entries(profileDistribution)
          .map(([label, customers]) => ({
            label,
            count: customers.size,
          }))
          .sort((a, b) => b.count - a.count);

        // 5. Update state
        setTotalCustomers(uniqueCustomers.size);
        setSegmentDetails(segments);

        setChartData({
          series: segments.map((s) => s.count),
          options: {
            chart: {
              type: "pie",
              height: 400,
              events: {
                dataPointSelection: (event, chartContext, config) => {
                  console.log(
                    "Selected segment:",
                    segments[config.dataPointIndex],
                  );
                },
              },
            },
            colors: newColors,
            labels: segments.map((s) => s.label),
            dataLabels: {
              enabled: true,
              formatter: (val: number) => `${val.toFixed(1)}%`,
              style: {
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
              },
            },
            legend: { show: false },
            tooltip: {
              y: {
                formatter: (value: number) =>
                  `${value} client${value > 1 ? "s" : ""}`,
                title: {
                  formatter: (seriesName: string) => seriesName,
                },
              },
            },
            title: {
              text: `Répartition des Clients – Clients uniques : ${uniqueCustomers.size}`,
              align: "center",
              style: {
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                color: "#1F2937",
              },
            },
            responsive: [
              {
                breakpoint: 640,
                options: {
                  chart: {
                    height: 300,
                  },
                  title: {
                    style: {
                      fontSize: "14px",
                    },
                  },
                },
              },
            ],
          },
        });
      } catch (error) {
        console.error("Error processing client segments:", error);
        setChartData(null);
        setSegmentDetails([]);
        setTotalCustomers(0);
      }
    };

    processClientSegments();
  }, [startDate, endDate, warehouseId, orders, customers]);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4 shadow-inner">
        {chartData ? (
          <ApexCharts
            options={chartData.options}
            series={chartData.series}
            type="pie"
            height={350}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-gray-500">Chargement des données clients...</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {segmentDetails.map((segment, index) => (
          <div
            key={segment.label}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div
              className="mt-1 h-5 w-5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: newColors[index % newColors.length] }}
              aria-hidden="true"
            />
            <div className="flex-1">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-800">
                  {segment.label}
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {segment.count}
                </p>
                <p className="text-sm text-gray-500">
                  {((segment.count / totalCustomers) * 100).toFixed(1)}% du
                  total
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {segmentDetails.length === 0 && !chartData && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Aucune donnée disponible pour les filtres sélectionnés
        </div>
      )}
    </div>
  );
};

export default ClientSegment;
