import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

import CardDataStats from '../../components/Charts/suppliers/CardDataStats';
import {
  FaClipboardList,
  FaMoneyBillWave,
  FaUsers,
  FaUndo,
} from 'react-icons/fa';
import axios from 'axios';
import ProductRevenueLossChart from '../../components/Charts/suppliers/ProductRevenueLossChart';
import TopArticlesOrdered from '../../components/Charts/suppliers/TopArticlesOrdered';
import SupplierAreaChart from '../../components/Charts/suppliers/SupplierAreaChart';
import RegionsOrders from '../../components/Charts/suppliers/RegionsOrders';
import AvailableProducts from '../../components/Charts/suppliers/AvailableProducts';
import DatePicker from 'react-datepicker';
import ClientSegment from '../../components/Charts/suppliers/ClientSegment';
import SupplierQuarterlyMetrics from '../../components/Charts/suppliers/SupplierQuarterlyMetrics';
import SupplierCategoryPieChart from '../../components/Charts/suppliers/SupplierCategoryPieChart';
import SupplierTopProductsChart from '../../components/Charts/suppliers/SupplierTopProductsChart';
import InventoryTrendChart from '../../components/Charts/suppliers/InventoryTrendChart';
import 'react-datepicker/dist/react-datepicker.css';
import { API_BASE_URL } from "../../config";

// const supplierId = "27"; // Example supplier ID (e.g., Technofood)

const SupplierDashboard = () => {
  const { supplierId } = useParams<{ supplierId: string }>(); // Get from URL params

  const [searchParams] = useSearchParams();
  const [startDate, setStartDate] = useState<Date | null>(null); // Default to null
  const [endDate, setEndDate] = useState<Date | null>(null); // Default to null

  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);

  const navigate = useNavigate();


  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const fetchData = async () => {
      try {
        const [
          categoriesRes,
          suppliersRes,
          ordersRes,
          productsRes,
          customersRes,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/suppliers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/supplier_products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/customers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setCustomers(customersRes.data);

        // Find supplier logic
        const foundSupplier = suppliersRes.data.find(
          (supplier: any) => supplier.manufacturerId === Number(supplierId),
        );
        if (foundSupplier) {
          setSupplier(foundSupplier);
        } else {
          console.error('Supplier not found');
          navigate('/suppliers');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [supplierId, navigate]);

  const handleApplyFilters = () => {
    // Only apply the current dates if they are not null
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  //Total orders
  const supplierProducts = products.filter(
    (p) => p.manufacturer === supplierId,
  );
  const supplierProductIds = new Set(supplierProducts.map((p) => p.product_id));

  const totalValidOrders = orders.filter(
    (order) =>
      order.state != 'canceled' &&
      (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
      (!appliedEndDate || new Date(order.created_at) <= appliedEndDate) &&
      order.items.some((item: { product_id: number }) =>
        supplierProductIds.has(item.product_id),
      ),
  ).length;

  //Total unique customers
  const uniqueCustomers = new Set<number>();
  orders.forEach((order) => {
    if (
      order.state != 'canceled' &&
      (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
      (!appliedEndDate || new Date(order.created_at) <= appliedEndDate) &&
      order.items.some((item: { product_id: number }) =>
        supplierProductIds.has(item.product_id),
      )
    ) {
      if (order.customer_id) {
        uniqueCustomers.add(order.customer_id);
      }
    }
  });
  const totalUniqueCustomers = uniqueCustomers.size;

  //Total returned products
  const totalReturns = orders
    .filter(
      (order) =>
        order.state !== 'canceled' &&
        (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
        (!appliedEndDate || new Date(order.created_at) <= appliedEndDate),
    )
    .flatMap((order) => order.items)
    .filter(
      (item) =>
        supplierProductIds.has(item.product_id) && item.qty_refunded > 0,
    )
    .reduce((sum, item) => sum + item.qty_refunded, 0);

  //Chiffre d'affaires
  const totalTurnover = orders
    .filter(
      (order) =>
        order.state !== 'canceled' &&
        (!appliedStartDate || new Date(order.created_at) >= appliedStartDate) &&
        (!appliedEndDate || new Date(order.created_at) <= appliedEndDate),
    )
    .flatMap((order) => order.items)
    .filter((item) => supplierProductIds.has(item.product_id))
    .reduce((sum, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return sum + item.qty_invoiced * (product?.cost || 0);
    }, 0);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // Automatically clear the applied start date if input is cleared
    if (date === null) {
      setAppliedStartDate(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    // Automatically clear the applied end date if input is cleared
    if (date === null) {
      setAppliedEndDate(null);
    }
  };
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-7.5">
      {supplier && (
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {supplier.company_name}
          </h1>
          {supplier.city && supplier.country && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {supplier.city}, {supplier.country}
            </p>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="w-full md:w-40">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Date Début
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
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
              onChange={(date) => setEndDate(date)}
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
          Appliquer Filtre
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

        <CardDataStats title="Commandes" total={totalValidOrders.toString()}>
          <FaClipboardList className="fill-primary dark:fill-white" />
        </CardDataStats>

        <CardDataStats
          title="Clients Uniques"
          total={totalUniqueCustomers.toString()}
        >
          <FaUsers className="fill-primary dark:fill-white" />
        </CardDataStats>

        <CardDataStats title="Retours" total={totalReturns.toString()}>
          <FaUndo className="fill-primary dark:fill-white" />
        </CardDataStats>
      </div>

      {/* Charts Grid */}
      <div className="mt-6 grid w-full grid-cols-1 gap-6">
        {/* First Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <SupplierAreaChart
              supplierId={supplierId!}
              orders={orders}
              products={products}
            />{' '}
          </div>
          <div className="mt-6 flex w-full justify-center">
            <SupplierQuarterlyMetrics
              supplierId={supplierId!}
              orders={orders}
              products={products}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 flex w-full justify-center">
            <ProductRevenueLossChart
              supplierId={supplierId!}
              orders={orders}
              products={products}
            />
          </div>
          <div className="flex w-full justify-center">
            <AvailableProducts supplierId={supplierId!} products={products} />
          </div>
        </div>

        {/* Full Width Row */}
        <div className="grid grid-cols-1">
          <TopArticlesOrdered
            supplierId={supplierId!}
            orders={orders}
            products={products}
            startDate={startDate}
            endDate={endDate}
          />
        </div>

        <div className="grid grid-cols-1">
          <SupplierCategoryPieChart
              supplierId={supplierId!}
              orders={orders}
              products={products}
              categories={categories}
              suppliers={suppliers}
              startDate={startDate}
              endDate={endDate}
            />
        </div>


        <div className="grid grid-cols-1">
          <ClientSegment
              supplierId={supplierId!}
              orders={orders}
              customers={customers}
              products={products}
              startDate={startDate}
              endDate={endDate}
            />
        </div>  

        

        {/* Map + Inventory Row */}
        {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <RegionsOrders
              supplierId={supplierId!}
              orders={orders}
              products={products}
              customers={customers}
            />
          </div>
          <div className="flex w-full justify-center">
            <InventoryTrendChart
              supplierId={supplierId!}
              products={products}
              orders={orders}
            />
          </div>
        </div> */}

<div className="grid grid-cols-1">
          <RegionsOrders
              supplierId={supplierId!}
              orders={orders}
              products={products}
              customers={customers}
            />
          </div>

        {/* Bottom Full Width Row */}
        <div className="grid grid-cols-1">
          <SupplierTopProductsChart
            supplierId={supplierId!}
            products={products}
            orders={orders}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
