import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  category_ids: string[];
  manufacturer: string;
}

interface Category {
  categoryId: number;
  nameCategory: string;
}

interface Supplier {
  id: string;
  name: string;
}

const IntegratedSalesChart = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes, ordersRes, suppliersRes] =
          await Promise.all([
            fetch("/api/categories"),
            fetch("/api/products"),
            fetch("/api/orders"),
            fetch("/api/customers"),
          ]);

        const categories: Category[] = await categoriesRes.json();
        const products: Product[] = await productsRes.json();
        const orders: Order[] = await ordersRes.json();
        const suppliers: Supplier[] = await suppliersRes.json();

        const hierarchy = {
          name: "Categories",
          children: [] as any[],
        };

        // Build category-supplier-product structure
        categories.forEach((category) => {
          const categoryNode = {
            name: category.nameCategory,
            children: [] as any[],
          };

          suppliers.forEach((supplier) => {
            const supplierNode = {
              name: supplier.name,
              children: [] as any[],
              total: 0,
            };

            products
              .filter(
                (p) =>
                  p.category_ids?.includes(category.categoryId.toString()) &&
                  p.manufacturer === supplier.id,
              )
              .forEach((product) => {
                const productOrders = orders
                  .filter(
                    (order) =>
                      order.state !== "canceled" &&
                      (!startDate || new Date(order.created_at) >= startDate) &&
                      (!endDate || new Date(order.created_at) <= endDate),
                  )
                  .flatMap((order) =>
                    order.items.filter(
                      (item) => item.product_id === product.product_id,
                    ),
                  )
                  .reduce((sum, item) => sum + item.qty_invoiced, 0);

                if (productOrders > 0) {
                  supplierNode.children.push({
                    name: product.name,
                    value: productOrders,
                  });
                  supplierNode.total += productOrders;
                }
              });

            if (supplierNode.total > 0) {
              supplierNode.children.sort((a, b) => b.value - a.value);
              categoryNode.children.push({
                name: supplierNode.name,
                value: supplierNode.total,
                children: supplierNode.children,
              });
            }
          });

          if (categoryNode.children.length > 0) {
            categoryNode.children.sort((a, b) => b.value - a.value);
            hierarchy.children.push(categoryNode);
          }
        });

        setSeries([hierarchy]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const options: ApexOptions = {
    chart: {
      type: "treemap",
      height: 600,
      toolbar: { show: true },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontFamily: "Arial",
        colors: ["#fff"],
      },
      formatter: (text: string, opts: any) => {
        const levels = opts.dataPointIndex.split("-").length - 1;
        const icons = ["📦", "🏭", "📝"];
        return `${icons[levels]} ${text} (${opts.value})`;
      },
    },
    plotOptions: {
      treemap: {
        enableShades: true,
        shadeIntensity: 0.2,
        colorScale: {
          ranges: [
            { from: 0, to: 100, color: "#D6EAF8" },
            { from: 100, to: 500, color: "#AED6F1" },
            { from: 500, to: 1000, color: "#85C1E9" },
            { from: 1000, to: 5000, color: "#5DADE2" },
          ],
        },
      },
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const node = w.globals.series[seriesIndex][dataPointIndex];
        const level = node.dataPointIndex.split("-").length - 1;
        const labels = ["Catégorie", "Fournisseur", "Produit"];
        return `
          <div class="p-2 bg-white border rounded shadow">
            <div class="font-bold">${labels[level]}:</div>
            <div>${node.name}</div>
            <div class="mt-1">Commandes: ${node.value}</div>
          </div>
        `;
      },
    },
  };

  return (
    <div className="w-full rounded-lg border bg-white p-4 shadow">
      <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-xl font-bold">Analyse Hiérarchique des Ventes</h2>
        <div className="flex gap-2">
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Début"
            className="w-32 rounded border p-2 text-sm"
            dateFormat="dd/MM/yy"
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="Fin"
            className="w-32 rounded border p-2 text-sm"
            dateFormat="dd/MM/yy"
          />
        </div>
      </div>

      <ReactApexChart
        options={options}
        series={series}
        type="treemap"
        height={600}
      />
    </div>
  );
};

export default IntegratedSalesChart;
