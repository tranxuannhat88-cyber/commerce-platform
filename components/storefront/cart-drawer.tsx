"use client";

import { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Offer, OfferVariant } from "@/types";
import { formatVND } from "@/lib/utils";
import { ProductAvailabilityService } from "@/lib/inventory/availability";

export interface CartItem {
  offer: Offer;
  variant?: OfferVariant;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (offer: Offer, variant?: OfferVariant, quantity?: number) => void;
  removeFromCart: (offerId: string, variantId?: string) => void;
  updateQuantity: (offerId: string, variantId: string | undefined, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  hasOutOfStockItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "commerce_guest_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart, isInitialized]);

  const addToCart = (offer: Offer, variant?: OfferVariant, quantity: number = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.offer.id === offer.id && (variant ? it.variant?.id === variant.id : !it.variant)
      );

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { offer, variant, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (offerId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((it) => !(it.offer.id === offerId && (variantId ? it.variant?.id === variantId : !it.variant)))
    );
  };

  const updateQuantity = (offerId: string, variantId: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeFromCart(offerId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.offer.id === offerId && (variantId ? it.variant?.id === variantId : !it.variant)) {
          return { ...it, quantity: qty };
        }
        return it;
      })
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cart.reduce((acc, i) => {
    const price = i.variant ? i.variant.price : i.offer.price;
    return acc + price * i.quantity;
  }, 0);

  const hasOutOfStockItems = cart.some((it) => {
    const check = ProductAvailabilityService.isPurchasable(it.offer, it.quantity);
    return !check.purchasable;
  });

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
        hasOutOfStockItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      isCartOpen: false,
      setIsCartOpen: () => {},
      totalItems: 0,
      subtotal: 0,
      hasOutOfStockItems: false,
    };
  }
  return context;
}

export function CartDrawer({ storeSlug }: { storeSlug: string }) {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItems, hasOutOfStockItems } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Giỏ Hàng ({totalItems})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  Giỏ hàng của bạn đang trống
                </p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const price = item.variant ? item.variant.price : item.offer.price;
                const check = ProductAvailabilityService.isPurchasable(item.offer, item.quantity);
                const isOutOfStock = !check.purchasable;

                return (
                  <div
                    key={`${item.offer.id}-${item.variant?.id || idx}`}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                      isOutOfStock
                        ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                        : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/70 dark:border-neutral-700/80"
                    }`}
                  >
                    <img
                      src={item.offer.image_url || "https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=100"}
                      alt={item.offer.name}
                      className={`w-14 h-14 rounded-xl object-cover border ${isOutOfStock ? "grayscale" : ""}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                          {item.offer.name}
                        </h4>
                      </div>
                      {isOutOfStock && (
                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-0.5">
                          ⚠️ {check.reason || "Tạm hết hàng"}
                        </p>
                      )}
                      {item.variant && (
                        <p className="text-[11px] text-neutral-500">Phân loại: {item.variant.name}</p>
                      )}
                      <p className="text-xs font-black text-blue-600 mt-0.5">{formatVND(price)}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                          <button
                            onClick={() => updateQuantity(item.offer.id, item.variant?.id, item.quantity - 1)}
                            className="p-1 text-neutral-500 hover:text-neutral-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.offer.id, item.variant?.id, item.quantity + 1)}
                            className="p-1 text-neutral-500 hover:text-neutral-900"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.offer.id, item.variant?.id)}
                          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 space-y-3 bg-neutral-50 dark:bg-neutral-800/40">
              {hasOutOfStockItems && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[11px] text-red-700 dark:text-red-300 font-medium">
                  ⚠️ Có sản phẩm trong giỏ tạm hết hàng. Vui lòng xóa mục hết hàng để tiếp tục thanh toán.
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 font-medium">Tạm tính:</span>
                <span className="font-black text-lg text-neutral-900 dark:text-neutral-100">
                  {formatVND(subtotal)}
                </span>
              </div>

              {hasOutOfStockItems ? (
                <button
                  disabled
                  className="w-full py-3 rounded-2xl bg-neutral-300 dark:bg-neutral-800 text-neutral-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Không Thể Đặt Hàng</span>
                </button>
              ) : (
                <Link
                  href={`/${storeSlug}/checkout`}
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Tiến Hành Đặt Hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
