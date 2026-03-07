import { LS_CART } from "./config.js";

export function getCart() {
  return JSON.parse(localStorage.getItem(LS_CART) || "{}");
}

export function setCart(cart) {
  localStorage.setItem(LS_CART, JSON.stringify(cart));
}

export function addToCart(id, qty = 1) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  setCart(cart);
}

export function clearCart() {
  localStorage.removeItem(LS_CART);
}
