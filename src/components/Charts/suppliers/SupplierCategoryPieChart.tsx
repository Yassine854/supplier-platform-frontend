import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Product {
  product_id: number;
  name: string;
  manufacturer: string;
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
  items: { product_id: number; qty_invoiced: number }[];
}

interface Supplier {
  manufacturer_id: number;
  company_name: string;
  email: string;
  phone_number: string;
}

interface ChartState {
  series: { name: string; data: number[] }[];
  options: any;
}

interface CompetitorSales {
  supplier: Supplier;
  sales: number;
}

const SupplierCategoryComparisonChart: React.FC<{
  supplierId: string;
  startDate?: Date | null;
  endDate?: Date | null;
}> = ({ supplierId, startDate: propStartDate, endDate: propEndDate }) => {
  const [chartState, setChartState] = useState<ChartState>({
    series: [],
    options: {
      chart: {
        type: "bar",
        height: 350,
        stacked: true,
        fontFamily: "Satoshi, sans-serif",
        background: "#FFFFFF",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 8,
          dataLabels: { position: "top" },
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [],
        labels: { style: { fontSize: "14px" } },
        type: "category",
      },
      yaxis: {
        labels: { formatter: (val: number) => Math.round(val).toString() },
      },
      legend: { position: "top" },
      colors: ["#3B82F6"],
    },
  });

  const [competitorsData, setCompetitorsData] = useState<
    Record<string, CompetitorSales[]>
  >({});
  const [startDate, setStartDate] = useState<Date | null>(
    propStartDate || null,
  );
  const [endDate, setEndDate] = useState<Date | null>(propEndDate || null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setStartDate(propStartDate || null);
    setEndDate(propEndDate || null);
  }, [propStartDate, propEndDate]);

  const filterOrdersByDate = (
    orders: Order[],
    start: Date | null,
    end: Date | null,
  ): Order[] => {
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      return (
        (!startDate || orderDate >= startDate) &&
        (!endDate || orderDate <= endDate)
      );
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
    

        const [productsRes, categoriesRes, ordersRes, suppliersRes] =
          await Promise.all([
            fetch(`http://localhost:3000/api/products`),
            fetch(`http://localhost:3000/api/categories`),
            fetch(`http://localhost:3000/api/orders`),
            fetch(`http://localhost:3000/api/suppliers`),
          ]);

        if (
          !productsRes.ok ||
          !categoriesRes.ok ||
          !ordersRes.ok ||
          !suppliersRes.ok
        ) {
          throw new Error("Failed to fetch data");
        }

        const products: Product[] = await productsRes.json();
        const categories: Category[] = await categoriesRes.json();
        const orders: Order[] = await ordersRes.json();
        const suppliers: Supplier[] = await suppliersRes.json();

        if (!Array.isArray(suppliers) || !Array.isArray(products)) {
          throw new Error("Invalid data format from API");
        }

        const currentSupplier = suppliers.find(
          (s) => s.manufacturer_id.toString() === supplierId,
        );
        const competitorSuppliers = suppliers.filter(
          (s) => s.manufacturer_id.toString() !== supplierId,
        );

        const supplierProducts = products.filter(
          (p) => p.manufacturer === supplierId,
        );
        const supplierCategories = new Set<string>(
          supplierProducts.flatMap((p) => p.category_ids).filter(Boolean),
        );

        const categoryMap = new Map<number, string>();
        const categoryCompetitors: Record<string, CompetitorSales[]> = {};

        categories.forEach((c) => {
          categoryMap.set(c.categoryId, c.nameCategory);
          if (supplierCategories.has(String(c.categoryId))) {
            categoryCompetitors[c.nameCategory] = competitorSuppliers.map(
              (supplier) => ({
                supplier,
                sales: 0,
              }),
            );
          }
        });

        const filteredOrders = filterOrdersByDate(orders, startDate, endDate);

        filteredOrders.forEach((order) => {
          if (order.state === "canceled") return;

          order.items.forEach((item) => {
            const product = products.find(
              (p) => p.product_id === item.product_id,
            );
            if (
              !product ||
              !product.category_ids?.some((c) => supplierCategories.has(c))
            )
              return;

            const productSupplier = suppliers.find(
              (s) => s.manufacturer_id.toString() === product.manufacturer,
            );
            if (!productSupplier) return;

            product.category_ids?.forEach((catId) => {
              if (!supplierCategories.has(catId)) return;
              const categoryName = categoryMap.get(Number(catId));
              if (!categoryName) return;

              if (productSupplier.manufacturer_id.toString() !== supplierId) {
                const competitors = categoryCompetitors[categoryName] || [];
                const competitorIndex = competitors.findIndex(
                  (c) =>
                    c.supplier.manufacturer_id ===
                    productSupplier.manufacturer_id,
                );

                if (competitorIndex !== -1) {
                  competitors[competitorIndex].sales += item.qty_invoiced;
                }
              }
            });
          });
        });

        const categoriesList = Object.keys(categoryCompetitors);
        const mySalesData = categoriesList.map((category) => {
          return filteredOrders.reduce((acc, order) => {
            if (order.state === "canceled") return acc;
            return (
              acc +
              order.items.reduce((sum, item) => {
                const product = products.find(
                  (p) => p.product_id === item.product_id,
                );
                return product?.manufacturer === supplierId &&
                  product?.category_ids?.some(
                    (catId) => categoryMap.get(Number(catId)) === category,
                  )
                  ? sum + item.qty_invoiced
                  : sum;
              }, 0)
            );
          }, 0);
        });

        setCompetitorsData(categoryCompetitors);

        setChartState((prev) => ({
          ...prev,
          series: [
            {
              name: currentSupplier?.company_name || "My Sales",
              data: mySalesData,
            },
          ],
          options: {
            ...prev.options,
            xaxis: { ...prev.options.xaxis, categories: categoriesList },
            colors: [
              "#3B82F6",
              ...competitorSuppliers.map(
                () =>
                  "#" +
                  Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, "0"),
              ),
            ],
          },
        }));
        setError(null);
      } catch (err) {
        console.error("Error:", err);
        setError(
          "Failed to load data. Please refresh or check your connection.",
        );
        setCompetitorsData({});
        setChartState((prev) => ({
          ...prev,
          series: [],
          options: {
            ...prev.options,
            xaxis: { ...prev.options.xaxis, categories: [] },
          },
        }));
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

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-inner">
        <h3 className="mb-6 text-center text-2xl font-semibold">
          Comparaison des Ventes par Catégorie
        </h3>
        {chartState.series[0]?.data?.length > 0 ? (
          <ReactApexChart
            options={chartState.options}
            series={chartState.series}
            type="bar"
            height={450}
          />
        ) : (
          <div className="flex h-[450px] items-center justify-center text-gray-500">
            No sales data available for selected period
          </div>
        )}
      </div>

      {/* <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(competitorsData).map(([category, competitors = []]) => (
          <div
            key={category}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              {category}
            </h4>
            <div className="space-y-3">
              {competitors
                ?.filter((c) => c?.sales > 0)
                ?.sort((a, b) => (b?.sales || 0) - (a?.sales || 0))
                ?.map((competitor, idx) => (
                  <div
                    key={competitor.supplier.manufacturer_id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor:
                            chartState.options.colors?.[idx + 1] || "#cccccc",
                        }}
                      />
                      <span className="text-sm">
                        {competitor.supplier?.company_name ||
                          "Unknown Supplier"}
                      </span>
                    </div>
                    <span className="font-medium">{competitor.sales || 0}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default SupplierCategoryComparisonChart;
