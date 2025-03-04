import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import supplierData from "../../../../../data_test.json"; // Ensure the path is correct

// Generate random colors for the chart
const generateColors = (num: number): string[] => {
  const colors = [
    "#3C50E0",
    "#6577F3",
    "#8FD0EF",
    "#0FADCF",
    "#FFA500",
    "#FF6347",
    "#32CD32",
    "#FFD700",
    "#FF4500",
    "#8A2BE2",
    "#FF1493",
    "#00CED1",
    "#FF8C00",
    "#DC143C",
    "#9932CC",
    "#20B2AA",
    "#FF6347",
    "#FF7F50",
    "#D2691E",
    "#BC8F8F",
  ];

  // Extend the array if needed
  while (colors.length < num) {
    colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
  }
  return colors.slice(0, num);
};

const SalesByCategory: React.FC<{ supplierId: string }> = ({ supplierId }) => {
  const [state, setState] = useState<{ series: number[]; labels: string[] }>({
    series: [],
    labels: [],
  });

  useEffect(() => {
    const categorySales: Record<string, number> = {};

    supplierData.orders.forEach((order) => {
      if (order.order.state === "delivered") {
        // Only include confirmed orders
        order.order.items.forEach((item) => {
          if (item.supplier.manufacturer_id === supplierId) {
            const categoryName = item.category.categoryName;
            const totalPrice = parseFloat(item.totalPrice);

            // Aggregate sales by category
            categorySales[categoryName] =
              (categorySales[categoryName] || 0) + totalPrice;
          }
        });
      }
    });

    const categoryNames = Object.keys(categorySales);
    const categoryRevenue = Object.values(categorySales);

    setState({
      series: categoryRevenue,
      labels: categoryNames,
    });
  }, [supplierId]);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar", // Bar chart
      height: 350,
      background: "#FFFFFF",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true, // You can set this to false for vertical bars
      },
    },
    xaxis: {
      categories: state.labels,
      title: {
        text: "Total Sales (TND)",
      },
    },
    yaxis: {
      title: {
        text: "Product Categories",
      },
    },
    colors: generateColors(state.labels.length), // Dynamically assign colors
    title: {
      text: "Sales by Product Category",
      align: "center",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(2)} TND`,
      style: {
        fontSize: "14px",
        fontWeight: "bold",
      },
    },
    legend: {
      show: false, // Hide legend
    },
  };

  return (
    <div className="mt-6 w-full bg-white p-4">
      <div className="mx-auto flex justify-center">
        <ReactApexChart
          options={options}
          series={[{ data: state.series }]}
          type="bar"
          height={500}
        />
      </div>
      {/* Display category details */}
      <div className="mt-6 flex flex-wrap justify-center">
        {state.labels.map((label, index) => (
          <div key={index} className="mb-2 flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: generateColors(state.labels.length)[index],
              }}
            ></div>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesByCategory;
