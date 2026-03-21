'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppDataContext = createContext(null);

// Cache TTL: 5 minutes. After this, background refresh will fetch fresh data.
const CACHE_TTL = 5 * 60 * 1000;

export function AppDataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [warehousesLoaded, setWarehousesLoaded] = useState(false);
  const [batchesLoaded, setBatchesLoaded] = useState(false);

  const lastFetch = useRef({ products: 0, warehouses: 0, batches: 0 });

  const fetchProducts = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && productsLoaded && (now - lastFetch.current.products) < CACHE_TTL) return;
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.products || []);
      lastFetch.current.products = now;
    } catch (_) {}
    setProductsLoaded(true);
  }, [productsLoaded]);

  const fetchWarehouses = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && warehousesLoaded && (now - lastFetch.current.warehouses) < CACHE_TTL) return;
    try {
      const res = await fetch('/api/warehouses', { cache: 'no-store' });
      const data = await res.json();
      setWarehouses(data.warehouses || []);
      lastFetch.current.warehouses = now;
    } catch (_) {}
    setWarehousesLoaded(true);
  }, [warehousesLoaded]);

  const fetchBatches = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && batchesLoaded && (now - lastFetch.current.batches) < CACHE_TTL) return;
    try {
      const res = await fetch('/api/batches', { cache: 'no-store' });
      const data = await res.json();
      setBatches(data.batches || []);
      lastFetch.current.batches = now;
    } catch (_) {}
    setBatchesLoaded(true);
  }, [batchesLoaded]);

  // Pre-load everything on app start
  useEffect(() => {
    fetchProducts(true);
    fetchWarehouses(true);
    fetchBatches(true);
  }, []);

  const invalidateProducts = () => {
    lastFetch.current.products = 0;
    fetchProducts(true);
  };

  const invalidateAll = () => {
    lastFetch.current = { products: 0, warehouses: 0, batches: 0 };
    fetchProducts(true);
    fetchWarehouses(true);
    fetchBatches(true);
  };

  return (
    <AppDataContext.Provider value={{
      products, warehouses, batches,
      productsLoaded, warehousesLoaded, batchesLoaded,
      fetchProducts, fetchWarehouses, fetchBatches,
      invalidateProducts, invalidateAll,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
