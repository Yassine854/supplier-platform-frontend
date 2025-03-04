import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const newColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F1C40F",
  "#8E44AD",
  "#E74C3C",
  "#3498DB",
  "#2ECC71",
  "#9B59B6",
  "#F39C12",
];

interface Customer {
  id: number;
  retailer_profile: string;
}

interface Order {
  entity_id: number;
  customer_id?: number;
  created_at: string; // Corrected interface
  state: string;
  status: string;
  items: Array<{ product_id: number }>;
}

interface Product {
  product_id: number;
  manufacturer: string;
}

const ClientSegment: React.FC<{
  supplierId: string;
  startDate?: Date | null;
  endDate?: Date | null;
}> = ({ supplierId, startDate: propStartDate, endDate: propEndDate }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(
    propStartDate || null,
  );
  const [endDate, setEndDate] = useState<Date | null>(propEndDate || null);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [segmentDetails, setSegmentDetails] = useState<
    { label: string; count: number }[]
  >([]);

  useEffect(() => {
    setStartDate(propStartDate || null);
    setEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, customersResponse, productsResponse] =
          await Promise.all([
            fetch("http://localhost:3000/api/orders"),
            fetch("http://localhost:3000/api/customers"),
            fetch("http://localhost:3000/api/products"),
          ]);

        const orders: Order[] = await ordersResponse.json();
        const customers: Customer[] = await customersResponse.json();
        const products: Product[] = await productsResponse.json();

        const customerProfileMap = customers.reduce(
          (acc: Record<number, string>, customer) => {
            // Check if retailer_profile is "0" or empty and categorize as "Inconnue"
            acc[customer.id] =
              customer.retailer_profile === "0" || !customer.retailer_profile
                ? "Inconnue"
                : customer.retailer_profile;
            return acc;
          },
          {},
        );

        const productManufacturerMap = products.reduce(
          (acc: Record<number, string>, product) => {
            acc[product.product_id] = product.manufacturer;
            return acc;
          },
          {},
        );

        // UTC date boundary calculations
        const startUTC = startDate
          ? Date.UTC(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate(),
            )
          : null;

        const endUTC = endDate
          ? Date.UTC(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate() + 1,
            ) - 1
          : null;

        // Filter orders with UTC comparison
        const filteredOrders = orders.filter((order) => {
          const orderTimestamp = new Date(order.created_at).getTime();
          const hasSupplierProducts = order.items.some(
            (item) => productManufacturerMap[item.product_id] === supplierId,
          );

          const dateValid =
            (!startUTC || orderTimestamp >= startUTC) &&
            (!endUTC || orderTimestamp <= endUTC);

          return order.state !== "canceled" && hasSupplierProducts && dateValid;
        });

        // Track unique customers
        const profileDistribution: Record<string, Set<number>> = {};
        const allCustomers = new Set<number>();

        filteredOrders.forEach((order) => {
          if (order.customer_id) {
            const profile = customerProfileMap[order.customer_id]; // Already handled "0" or empty profiles as "Inconnue"

            if (!profileDistribution[profile]) {
              profileDistribution[profile] = new Set();
            }

            if (!allCustomers.has(order.customer_id)) {
              profileDistribution[profile].add(order.customer_id);
              allCustomers.add(order.customer_id);
            }
          }
        });

        // Prepare visualization data
        const segments = Object.entries(profileDistribution).map(
          ([label, customers]) => ({
            label,
            count: customers.size,
          }),
        );

        setTotalCustomers(allCustomers.size);
        setSegmentDetails(segments);

        setChartData({
          series: segments.map((item) => item.count),
          options: {
            chart: {
              type: "pie",
              height: 400,
              events: {
                dataPointSelection: (
                  event: any,
                  chartContext: any,
                  config: any,
                ) => {
                  console.log(
                    "Selected profile:",
                    segments[config.dataPointIndex].label,
                  );
                },
              },
            },
            colors: newColors,
            labels: segments.map((item) => item.label),
            dataLabels: {
              enabled: true,
              formatter: (val: number) => `${val.toFixed(1)}%`,
            },
            legend: { show: false },
            tooltip: {
              y: { formatter: (value: number) => `${value} customers` },
            },
            title: {
              text: `Profils des Clients – Clients uniques : ${allCustomers.size}`,
              align: "center",
            },
          },
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [supplierId, startDate, endDate]);

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      {/* <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-medium">Période:</label>
        <div className="flex gap-3">
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Date Début"
            className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="MMM d, yyyy"
            isClearable
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="Date Fin"
            className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="MMM d, yyyy"
            isClearable
          />
        </div>
      </div> */}

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-inner">
        {chartData ? (
          <ApexCharts
            options={chartData.options}
            series={chartData.series}
            type="pie"
            height={350}
          />
        ) : (
          <p className="text-center text-gray-500">
            Loading retailer profiles...
          </p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {segmentDetails.map((segment, index) => (
          <div
            key={segment.label}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mt-1 h-5 w-5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: newColors[index % newColors.length] }}
            />
            <div className="flex-1">
              <div className="flex flex-col">
                <span className="break-words font-medium text-gray-800">
                  {segment.label || "No Profile"}
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  {segment.count} unique customers
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientSegment;
