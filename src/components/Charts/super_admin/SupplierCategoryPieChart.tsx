import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Product {
  product_id: number;
  category_ids: string[];
}

interface Category {
  categoryId: number;
  nameCategory: string;
}

interface Order {
  _id: string;
  created_at: string;
  state: string;
  store_id: number;
  items: { product_id: number; qty_invoiced: number }[];
}

interface Props {
  startDate?: Date | null;
  endDate?: Date | null;
  warehouseId?: number | null;
  orders: Order[];
  products: Product[];
  categories: Category[];
  onDatesChange?: (start: Date | null, end: Date | null) => void;
}

const TotalOrdersByCategoryChart: React.FC<Props> = ({
  startDate: propStartDate,
  endDate: propEndDate,
  warehouseId,
  orders,
  products,
  categories,
  onDatesChange,
}) => {
  const [chartData, setChartData] = useState({
    series: [{ name: "Total Orders", data: [] as number[] }],
    categories: [] as string[],
  });
  const [localStartDate, setLocalStartDate] = useState<Date | null>(
    propStartDate || null,
  );
  const [localEndDate, setLocalEndDate] = useState<Date | null>(
    propEndDate || null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStartDate(propStartDate || null);
    setLocalEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

  const handleStartDateChange = (date: Date | null) => {
    setLocalStartDate(date);
    onDatesChange?.(date, localEndDate);
  };

  const handleEndDateChange = (date: Date | null) => {
    setLocalEndDate(date);
    onDatesChange?.(localStartDate, date);
  };

  const filterOrders = (orders: Order[]): Order[] => {
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      const start = localStartDate ? new Date(localStartDate) : null;
      const end = localEndDate ? new Date(localEndDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      return (
        order.state !== "canceled" &&
        (!warehouseId || order.store_id === warehouseId) &&
        (!start || orderDate >= start) &&
        (!end || orderDate <= end)
      );
    });
  };

  useEffect(() => {
    try {
      const validCategoryIds = new Set<number>();
      const categoryMap = new Map<number, string>();
      categories.forEach((c) => {
        validCategoryIds.add(c.categoryId);
        categoryMap.set(c.categoryId, c.nameCategory);
      });

      const salesData: Record<number, number> = {};
      validCategoryIds.forEach((categoryId) => {
        salesData[categoryId] = 0;
      });

      const filteredOrders = filterOrders(orders);

      filteredOrders.forEach((order) => {
        order.items.forEach((item) => {
          const product = products.find(
            (p) => p.product_id === item.product_id,
          );
          if (!product?.category_ids) return;

          product.category_ids.forEach((catIdStr) => {
            const catId = Number(catIdStr);
            if (validCategoryIds.has(catId)) {
              salesData[catId] += item.qty_invoiced;
            }
          });
        });
      });

      const categoriesList = Array.from(categoryMap.values());
      const totalOrdersData = Array.from(validCategoryIds).map(
        (catId) => salesData[catId],
      );

      setChartData({
        series: [{ name: "Total Produits", data: totalOrdersData }],
        categories: categoriesList,
      });
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process data. Please check your filters.");
      setChartData({
        series: [{ name: "Total Produits", data: [] }],
        categories: [],
      });
    }
  }, [localStartDate, localEndDate, warehouseId, orders, products, categories]);

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-inner">
        <h3 className="mb-6 text-center text-2xl font-semibold">
          Total des produits Commandés par Catégorie
        </h3>
        {chartData.series[0]?.data.length > 0 ? (
          <ReactApexChart
            options={{
              chart: {
                type: "bar",
                height: 350,
                toolbar: { show: false },
              },
              xaxis: {
                categories: chartData.categories,
                labels: {
                  style: { fontSize: "14px" },
                  rotate: -45,
                },
              },
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  columnWidth: "60%",
                  dataLabels: {
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: true,
                formatter: (val: number) => `${val}`,
                offsetY: -20,
                style: {
                  fontSize: "12px",
                  colors: ["#000"],
                },
              },
              colors: ["#3B82F6"],
            }}
            series={chartData.series}
            type="bar"
            height={450}
          />
        ) : (
          <div className="flex h-[450px] items-center justify-center text-gray-500">
            Aucune donnée disponible pour la période sélectionnée
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalOrdersByCategoryChart;
