import React, { useState, useEffect } from "react";
import axios from "axios";
import CardDataStats from "../../components/Charts/suppliers/CardDataStats";
import {
  FaClipboardList,
  FaMoneyBillWave,
  FaUsers,
  FaUndo,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SupplierAreaChart from "../../components/Charts/super_admin/SupplierAreaChart";
import SupplierQuarterlyMetrics from "../../components/Charts/super_admin/SupplierQuarterlyMetrics";
import ProductRevenueLossChart from "../../components/Charts/super_admin/ProductRevenueLossChart";
import AvailableProducts from "../../components/Charts/super_admin/AvailableProducts";
import SupplierCategoryPieChart from "../../components/Charts/super_admin/SupplierCategoryPieChart";
import ClientSegment from "../../components/Charts/super_admin/ClientSegment";
import RegionsOrders from "../../components/Charts/super_admin/RegionsOrders";
import InventoryTrendChart from "../../components/Charts/super_admin/InventoryTrendChart";
import SupplierTopProductsChart from "../../components/Charts/super_admin/SupplierTopProductsChart";


const AllSuppliersDashboard = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    null,
  );

  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);
  const [appliedWarehouse, setAppliedWarehouse] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products_stock, setProductsStock] = useState<any[]>([]);

  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          categoriesRes,
          productsRes,
          ordersRes,
          productsStockRes,
          customersRes,
          warehousesRes,
        ] = await Promise.all([
          axios.get("http://localhost:3000/api/categories"),
          axios.get("http://localhost:3000/api/products"),
          axios.get("http://localhost:3000/api/orders"),
          axios.get("http://localhost:3000/api/products_stock"),
          axios.get("http://localhost:3000/api/customers"),
          axios.get("http://localhost:3000/api/warehouses"),
        ]);

        setCategories(categoriesRes.data);
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
        setProductsStock(productsStockRes.data);
        setCustomers(customersRes.data);
        setWarehouses(warehousesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date === null) {
      setAppliedStartDate(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date === null) {
      setAppliedEndDate(null);
    }
  };

  const handleApplyFilters = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedWarehouse(selectedWarehouse);
  };

  // Calculate global metrics with warehouse filter
  const totalValidOrders = orders.filter(
    (order) =>
      order.state !== "canceled" &&
      (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
      (!appliedEndDate || new Date(order.created_at) <= appliedEndDate) &&
      (!appliedWarehouse || order.store_id === Number(appliedWarehouse)),
  ).length;

  const validCustomerIds = new Set(customers.map((c) => c.id));

  const uniqueCustomers = new Set(
    orders
      .filter((order) => {
        const orderTime = new Date(order.created_at).getTime();
        return (
          order.state !== "canceled" &&
          order.customer_id &&
          validCustomerIds.has(order.customer_id) &&
          (!appliedStartDate ||
            orderTime >= appliedStartDate.setHours(0, 0, 0, 0)) &&
          (!appliedEndDate ||
            orderTime <= appliedEndDate.setHours(23, 59, 59, 999)) &&
          (!appliedWarehouse || order.store_id === Number(appliedWarehouse))
        );
      })
      .map((order) => order.customer_id),
  ).size;

  const totalReturns = orders
    .filter(
      (order) =>
        order.state !== "canceled" &&
        (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
        (!appliedEndDate || new Date(order.created_at) <= appliedEndDate) &&
        (!appliedWarehouse || order.store_id === Number(appliedWarehouse)),
    )
    .flatMap((order) => order.items)
    .reduce((sum, item) => sum + item.qty_refunded, 0);

  const totalTurnover = orders
    .filter(
      (order) =>
        order.state !== "canceled" &&
        (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
        (!appliedEndDate || new Date(order.created_at) <= appliedEndDate) &&
        (!appliedWarehouse || order.store_id === Number(appliedWarehouse)),
    )
    .flatMap((order) => order.items)
    .reduce((sum, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return sum + item.qty_invoiced * (product?.price || 0);
    }, 0);

    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-7.5">
        {/* Filter Section */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Warehouse Filter */}
            <div className="w-full md:w-40">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Warehouse
              </label>
              <select
                value={selectedWarehouse || ""}
                onChange={(e) => setSelectedWarehouse(e.target.value || null)}
                className="w-full rounded-lg border border-stroke bg-white p-2.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
  
            {/* Date Filters */}
            <div className="w-full md:w-40">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Date Début
              </label>
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                dateFormat="yyyy/MM/dd"
                className="w-full rounded-lg border border-stroke bg-white p-2.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                isClearable
              />
            </div>
  
            <div className="w-full md:w-40">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Date Fin
              </label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                dateFormat="yyyy/MM/dd"
                className="w-full rounded-lg border border-stroke bg-white p-2.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                isClearable
              />
            </div>
          </div>
  
          <button
            onClick={handleApplyFilters}
            className="flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Appliquer Filtres
          </button>
        </div>
  
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats
            title="Chiffre d'affaires"
            total={`${totalTurnover.toFixed(2)} TND`}
          >
            <FaMoneyBillWave className="fill-primary dark:fill-white" />
          </CardDataStats>
  
          <CardDataStats
            title="Commandes"
            total={totalValidOrders.toString()}
          >
            <FaClipboardList className="fill-primary dark:fill-white" />
          </CardDataStats>
  
          <CardDataStats
            title="Clients Uniques"
            total={uniqueCustomers.toString()}
          >
            <FaUsers className="fill-primary dark:fill-white" />
          </CardDataStats>
  
          <CardDataStats
            title="Retours"
            total={totalReturns.toString()}
          >
            <FaUndo className="fill-primary dark:fill-white" />
          </CardDataStats>
        </div>
  
        {/* Charts Grid */}
        <div className="mt-6 grid w-full grid-cols-1 gap-6">
          {/* First Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <SupplierAreaChart
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                orders={orders}
                products={products}
              />
            </div>
            <div className="mt-6 flex w-full justify-center">
              <SupplierQuarterlyMetrics
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                orders={orders}
                products={products}
              />
            </div>
          </div>
  
          {/* Second Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex w-full justify-center">
              <ProductRevenueLossChart
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                orders={orders}
              />
            </div>
            <div className="flex w-full justify-center">
              <AvailableProducts
                products={products}
                products_stock={products_stock}
                warehouses={warehouses}
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
              />
            </div>
          </div>
  
          
  
          {/* Dual Charts Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex w-full justify-center">
              <SupplierCategoryPieChart
                orders={orders}
                products={products}
                categories={categories}
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                startDate={appliedStartDate}
                endDate={appliedEndDate}
              />
            </div>
            <div className="flex w-full justify-center">
              <ClientSegment
                orders={orders}
                customers={customers}
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                startDate={appliedStartDate}
                endDate={appliedEndDate}
              />
            </div>
          </div>
  
          {/* Map + Inventory Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 flex w-full justify-center">
              <RegionsOrders
                orders={orders}
                customers={customers}
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
              />
            </div>
            <div className="flex w-full justify-center">
              <InventoryTrendChart
                warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
                warehouses={warehouses}
                products={products}
                orders={orders}
                productsStock={products_stock}
                categories={categories}
              />
            </div>
          </div>
  
          {/* Bottom Full Width Row */}
          <div className="grid grid-cols-1">
            <SupplierTopProductsChart
              orders={orders}
              products={products}
              warehouseId={appliedWarehouse ? Number(appliedWarehouse) : null}
              startDate={appliedStartDate}
              endDate={appliedEndDate}
            />
          </div>
        </div>
      </div>
    );
  };
  
  export default AllSuppliersDashboard;
