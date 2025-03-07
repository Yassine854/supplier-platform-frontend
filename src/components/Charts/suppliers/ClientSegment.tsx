import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";

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
  created_at: string;
  state: string;
  status: string;
  items: Array<{ product_id: number }>;
}

interface Product {
  product_id: number;
  manufacturer: string;
}

interface ClientSegmentProps {
  supplierId: string;
  orders: Order[];
  customers: Customer[];
  products: Product[];
  startDate?: Date | null;
  endDate?: Date | null;
}

const ClientSegment: React.FC<ClientSegmentProps> = ({
  supplierId,
  orders,
  customers,
  products,
  startDate: propStartDate,
  endDate: propEndDate,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(propStartDate || null);
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
    const processData = () => {
      try {
        // Add null-safe defaults for all input arrays
        const safeCustomers = customers || [];
        const safeProducts = products || [];
        const safeOrders = orders || [];
  
        // Safe customer profile mapping
        const customerProfileMap = safeCustomers.reduce(
          (acc: Record<number, string>, customer) => {
            if (customer?.id) {
              acc[customer.id] =
                customer.retailer_profile === "0" || !customer.retailer_profile
                  ? "Inconnue"
                  : customer.retailer_profile;
            }
            return acc;
          },
          {}
        );
  
        // Safe product manufacturer mapping
        const productManufacturerMap = safeProducts.reduce(
          (acc: Record<number, string>, product) => {
            if (product?.product_id) {
              acc[product.product_id] = product.manufacturer || "Unknown";
            }
            return acc;
          },
          {}
        );
  
        // Date filtering with null checks
        const startUTC = startDate
          ? Date.UTC(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            )
          : null;
  
        const endUTC = endDate
          ? Date.UTC(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate() + 1
            ) - 1
          : null;
  
        // Safe order filtering with optional chaining
        const filteredOrders = safeOrders.filter((order) => {
          const orderDate = new Date(order?.created_at || 0);
          const orderTimestamp = orderDate.getTime();
          
          const hasSupplierProducts = (order.items || []).some(
            (item) => productManufacturerMap[item.product_id] === supplierId
          );
  
          const dateValid =
            (!startUTC || orderTimestamp >= startUTC) &&
            (!endUTC || orderTimestamp <= endUTC);
  
          return order.state !== "canceled" && hasSupplierProducts && dateValid;
        });
  
        // Safe customer segmentation
        const profileDistribution: Record<string, Set<number>> = {};
        const allCustomers = new Set<number>();
  
        filteredOrders.forEach((order) => {
          if (order?.customer_id) {
            const profile = customerProfileMap[order.customer_id] || "Inconnue";
            
            if (!profileDistribution[profile]) {
              profileDistribution[profile] = new Set();
            }
  
            if (!allCustomers.has(order.customer_id)) {
              profileDistribution[profile].add(order.customer_id);
              allCustomers.add(order.customer_id);
            }
          }
        });
  
        // Prepare chart data
        const segments = Object.entries(profileDistribution).map(
          ([label, customers]) => ({
            label,
            count: customers.size,
          })
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
                  config: any
                ) => {
                  console.log(
                    "Selected profile:",
                    segments[config.dataPointIndex]?.label
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
              y: { formatter: (value: number) => `${value} clients` },
            },
            title: {
              text: `Profils des Clients – Clients uniques : ${allCustomers.size}`,
              align: "center",
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                fontFamily: "Satoshi, sans-serif",
              },
            },
          },
        });
      } catch (error) {
        console.error("Error processing data:", error);
        setChartData(null);
        setSegmentDetails([]);
        setTotalCustomers(0);
      }
    };
  
    processData();
  }, [supplierId, orders, customers, products, startDate, endDate]);
  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
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
            Chargement des profils des détaillants...
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
                  {segment.label || "Profil inconnu"}
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  {segment.count} clients uniques
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