"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useRef,
  useEffect,
} from "react";

type CartItem = {
  barcode: string;
  name: string;
  price: string;
  salePrice?: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
};

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string } // barcode
  | { type: "UPDATE_QUANTITY"; payload: { barcode: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_CART_OPEN"; payload: boolean }
  | { type: "LOAD_CART"; payload: CartState };

const initialState: CartState = {
  items: [],
  isOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD_CART":
      return action.payload;

    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.barcode === action.payload.barcode
      );

      if (existingItemIndex >= 0) {
        // Item exists, increment quantity
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += 1;
        return {
          ...state,
          items: newItems,
        };
      } else {
        // New item, add to cart
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
        };
      }
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.barcode !== action.payload),
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        // Remove item if quantity is 0 or less
        return {
          ...state,
          items: state.items.filter(
            (item) => item.barcode !== action.payload.barcode
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.barcode === action.payload.barcode
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case "CLEAR_CART": {
      return {
        ...state,
        items: [],
      };
    }

    case "TOGGLE_CART": {
      return { ...state, isOpen: !state.isOpen };
    }

    case "SET_CART_OPEN": {
      return { ...state, isOpen: action.payload };
    }

    default:
      return state;
  }
}

type CartContextType = {
  state: CartState;
  addItem: (
    item: Omit<CartItem, "quantity">,
    stockQty?: number,
    enforceStock?: boolean
  ) => void;
  removeItem: (barcode: string) => void;
  updateQuantity: (
    barcode: string,
    quantity: number,
    stockQty?: number,
    enforceStock?: boolean
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const processingRef = useRef<Map<string, number>>(new Map());

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("kiosk-cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("kiosk-cart", JSON.stringify(state));
  }, [state]);

  const addItem = (
    item: Omit<CartItem, "quantity">,
    stockQty?: number,
    enforceStock?: boolean
  ) => {
    const now = Date.now();
    const lastProcessed = processingRef.current.get(item.barcode) || 0;

    // Prevent duplicate calls within 200ms (production-ready debouncing)
    if (now - lastProcessed < 200) {
      return;
    }

    // Check stock validation if enforceStock is true
    if (enforceStock && stockQty !== undefined) {
      const existingItem = state.items.find((i) => i.barcode === item.barcode);
      const currentQuantity = existingItem ? existingItem.quantity : 0;

      if (currentQuantity >= stockQty) {
        // Cannot add more - already at stock limit
        return;
      }
    }

    processingRef.current.set(item.barcode, now);
    dispatch({ type: "ADD_ITEM", payload: item });

    // Clean up old entries to prevent memory leaks
    setTimeout(() => {
      const cutoff = Date.now() - 1000; // Keep entries for 1 second
      for (const [key, timestamp] of processingRef.current.entries()) {
        if (timestamp < cutoff) {
          processingRef.current.delete(key);
        }
      }
    }, 1000);
  };

  const removeItem = (barcode: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: barcode });
  };

  const updateQuantity = (
    barcode: string,
    quantity: number,
    stockQty?: number,
    enforceStock?: boolean
  ) => {
    // Check stock validation if enforceStock is true
    if (enforceStock && stockQty !== undefined && quantity > stockQty) {
      // Cannot set quantity higher than stock
      return;
    }

    dispatch({ type: "UPDATE_QUANTITY", payload: { barcode, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const toggleCart = () => {
    dispatch({ type: "TOGGLE_CART" });
  };

  const setCartOpen = (open: boolean) => {
    dispatch({ type: "SET_CART_OPEN", payload: open });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      const price =
        item.salePrice && Number(item.salePrice) > 0
          ? Number(item.salePrice)
          : Number(item.price);
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        setCartOpen,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
