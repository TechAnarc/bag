import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadProducts, type Product } from "./catalog";

type CartItem = { id: string; qty: number };

type StoreCtx = {
  products: Product[];
  refreshProducts: () => void;
  cart: CartItem[];
  addToCart: (id: string, qty?: number) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
  recent: string[];
  pushRecent: (id: string) => void;
};

const Ctx = createContext<StoreCtx | null>(null);

const useLocal = <T,>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] => {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw));
    } catch {}
  }, [key]);
  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setV((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
        return value;
      });
    },
    [key],
  );
  return [v, set];
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [cart, setCart] = useLocal<CartItem[]>("tbh_cart_v1", []);
  const [wishlist, setWishlist] = useLocal<string[]>("tbh_wishlist_v1", []);
  const [recent, setRecent] = useLocal<string[]>("tbh_recent_v1", []);

  const refreshProducts = useCallback(() => setProducts(loadProducts()), []);

  useEffect(() => {
    refreshProducts();
    const handler = () => refreshProducts();
    window.addEventListener("tbh:products", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tbh:products", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refreshProducts]);

  const addToCart = useCallback(
    (id: string, qty = 1) =>
      setCart((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        if (i === -1) return [...prev, { id, qty }];
        const copy = [...prev];
        copy[i] = { id, qty: copy[i].qty + qty };
        return copy;
      }),
    [setCart],
  );

  const removeFromCart = useCallback((id: string) => setCart((p) => p.filter((c) => c.id !== id)), [setCart]);
  const setQty = useCallback(
    (id: string, qty: number) =>
      setCart((p) => (qty <= 0 ? p.filter((c) => c.id !== id) : p.map((c) => (c.id === id ? { ...c, qty } : c)))),
    [setCart],
  );
  const clearCart = useCallback(() => setCart([]), [setCart]);

  const toggleWishlist = useCallback(
    (id: string) => setWishlist((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    [setWishlist],
  );
  const isWished = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const pushRecent = useCallback(
    (id: string) => setRecent((p) => [id, ...p.filter((x) => x !== id)].slice(0, 8)),
    [setRecent],
  );

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () =>
      cart.reduce((s, c) => {
        const p = products.find((p) => p.id === c.id);
        return s + (p ? p.price * c.qty : 0);
      }, 0),
    [cart, products],
  );

  const value: StoreCtx = {
    products, refreshProducts,
    cart, addToCart, removeFromCart, setQty, clearCart, cartCount, cartSubtotal,
    wishlist, toggleWishlist, isWished,
    recent, pushRecent,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
};
