const CART_KEY = "nutrilab_cart";
const FAV_KEY = "nutrilab_fav";

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "{}");
}

export function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(id, qty = 1) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  setCart(cart);
}

export function updateCartQty(id, qty) {
  const cart = getCart();

  if (qty <= 0) delete cart[id];
  else cart[id] = qty;

  setCart(cart);
}

export function clearCart() {
  localStorage.setItem(CART_KEY, "{}");
}

export function getCartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

export function getFav() {
  return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
}

export function setFav(fav) {
  localStorage.setItem(FAV_KEY, JSON.stringify(fav));
}

export function toggleFav(id) {
  const fav = getFav();
  const sid = String(id);

  if (fav.includes(sid)) {
    setFav(fav.filter(item => item !== sid));
  } else {
    fav.push(sid);
    setFav(fav);
  }
}

export function isFav(id) {
  return getFav().includes(String(id));
}

export function getFavCount() {
  return getFav().length;
}
