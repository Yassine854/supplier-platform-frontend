import { ApexOptions } from "apexcharts";
import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";

const options: ApexOptions = {
  legend: {
    show: false,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#3C50E0", "#80CAEE"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 335,
    type: "area",
    zoom: { enabled: false },
    toolbar: { show: false },
  },
  stroke: { curve: "straight" },
  dataLabels: { enabled: false },
  grid: {
    borderColor: "#EDEFF1",
    strokeDashArray: 5,
  },
  title: {
    text: "Fundamental Analysis of Stocks",
    align: "left",
  },
  subtitle: {
    text: "Price Movements",
    align: "left",
  },
  xaxis: {
    type: "datetime",
    categories: [
      "2024-01-01",
      "2024-02-01",
      "2024-03-01",
      "2024-04-01",
      "2024-05-01",
      "2024-06-01",
      "2024-07-01",
      "2024-08-01",
      "2024-09-01",
      "2024-10-01",
      "2024-11-01",
      "2024-12-01",
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    opposite: true,
    min: 0,
    max: 100,
  },
};

interface ChartState {
  series: {
    name: string;
    data: number[];
  }[];
}

const AreaChart: React.FC = () => {
  const [state] = useState<ChartState>({
    series: [
      {
        name: "STOCK ABC",
        data: [30, 40, 45, 50, 49, 60, 70, 91, 125, 90, 85, 100],
      },
    ],
  });

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Stock ABC</p>
              <p className="text-sm font-medium">2024 - Monthly Data</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div id="areaChart" className="-ml-5">
          <ReactApexChart options={options} series={state.series} type="area" height={350} />
        </div>
      </div>
    </div>
  );
};

export default AreaChart;
