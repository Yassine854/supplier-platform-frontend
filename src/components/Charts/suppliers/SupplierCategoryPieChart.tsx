import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

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
  manufacturerId: number;
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

interface SupplierCategoryComparisonChartProps {
  supplierId: string;
  products: Product[];
  categories: Category[];
  orders: Order[];
  suppliers: Supplier[];
  startDate?: Date | null;
  endDate?: Date | null;
}

const SupplierCategoryComparisonChart: React.FC<SupplierCategoryComparisonChartProps> = ({
  supplierId,
  products,
  categories,
  orders,
  suppliers,
  startDate: propStartDate,
  endDate: propEndDate,
}) => {
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
  const [startDate, setStartDate] = useState<Date | null>(propStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(propEndDate || null);

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
    try {
      // Add null checks for critical data sources
      const safeSuppliers = suppliers || [];
      const safeProducts = products || [];
      const safeOrders = orders || [];
      const safeCategories = categories || [];
  
      const currentSupplier = safeSuppliers.find(
        (s) => s.manufacturerId?.toString() === supplierId
      );
      
      const competitorSuppliers = safeSuppliers.filter(
        (s) => s.manufacturerId?.toString() !== supplierId
      );
  
      const supplierProducts = safeProducts.filter(
        (p) => p.manufacturer === supplierId
      );
  
      // Safely get category IDs
      const supplierCategories = new Set<string>(
        supplierProducts.flatMap((p) => p.category_ids || []).filter(Boolean)
      );
  
      // Process categories safely
      const categoryMap = new Map<number, string>();
      const categoryCompetitors: Record<string, CompetitorSales[]> = {};
  
      safeCategories.forEach((c) => {
        if (c?.categoryId && c?.nameCategory) {
          categoryMap.set(c.categoryId, c.nameCategory);
          if (supplierCategories.has(String(c.categoryId))) {
            categoryCompetitors[c.nameCategory] = competitorSuppliers.map(
              (supplier) => ({
                supplier,
                sales: 0,
              })
            );
          }
        }
      });
  
      // Ensure filteredOrders is always an array
      const filteredOrders = filterOrdersByDate(safeOrders, startDate, endDate) || [];
  
      // Safe order processing
      filteredOrders.forEach((order) => {
        if (order.state === "canceled") return;
  
        // Add null check for order.items
        const items = order.items || [];
        items.forEach((item) => {
          const product = safeProducts.find(
            (p) => p.product_id === item.product_id
          );
          
          // Add null checks for product and category_ids
          const validCategories = (product?.category_ids || []).filter((c) =>
            supplierCategories.has(c)
          );
  
          if (!product || validCategories.length === 0) return;
  
          const productSupplier = safeSuppliers.find(
            (s) => s.manufacturerId?.toString() === product.manufacturer
          );
  
          if (!productSupplier) return;
  
          validCategories.forEach((catId) => {
            const categoryName = categoryMap.get(Number(catId));
            if (!categoryName) return;
  
            if (productSupplier.manufacturerId?.toString() !== supplierId) {
              const competitors = categoryCompetitors[categoryName] || [];
              const competitorIndex = competitors.findIndex(
                (c) =>
                  c.supplier.manufacturerId === productSupplier.manufacturerId
              );
  
              if (competitorIndex !== -1) {
                competitors[competitorIndex].sales += item.qty_invoiced || 0;
              }
            }
          });
        });
      });
  
      // Safe reduce with default values
      const categoriesList = Object.keys(categoryCompetitors);
      const mySalesData = categoriesList.map((category) => {
        return filteredOrders.reduce((acc, order) => {
          if (order.state === "canceled") return acc;
          
          // Add null check for order.items
          const items = order.items || [];
          return (
            acc +
            items.reduce((sum, item) => {
              const product = safeProducts.find(
                (p) => p.product_id === item.product_id
              );
              return product?.manufacturer === supplierId &&
                (product?.category_ids || []).some(
                  (catId) => categoryMap.get(Number(catId)) === category
                )
                ? sum + (item.qty_invoiced || 0)
                : sum;
            }, 0)
          );
        }, 0);
      });
  
      // Update state
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
                `#${Math.floor(Math.random() * 16777215)
                  .toString(16)
                  .padStart(6, "0")}`
            ),
          ],
        },
      }));
  
    } catch (err) {
      console.error("Error processing data:", err);
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
  }, [supplierId, products, categories, orders, suppliers, startDate, endDate]);

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
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
            Aucune donnée de vente disponible pour la période sélectionnée
          </div>
        )}
      </div>
      
      {/* {JSON.parse(localStorage.getItem('auth') || '{}')?.user?.role === 'superadmin' && ( */}
      {JSON.parse(localStorage.getItem('auth') || '{}') && (

  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                key={competitor.supplier.manufacturerId}
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
  </div>
)}
    </div>
  );
};

export default SupplierCategoryComparisonChart;