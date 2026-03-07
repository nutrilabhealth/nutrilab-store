import { getCart, addToCart, getCartCount } from "./cart.js";

const SUPABASE_URL = "https://cthfqhxnplyibdsjzcrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_AjGX1zKhV8kEyGMbvAKwQg_srda-oyI";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const homeGrid = document.getElementById("homeGrid");
const catalogGrid = document.getElementById("catalogGrid");
const cartList = document.getElementById("cartList");
const cartBadge = document.getElementById("cartBadge");
const searchInput = document.getElementById("searchInput");
const userName = document.getElementById("userName");
const userId = document.getElementById("userId");
const favCount = document.getElementById("favCount");
const cartCount = document.getElementById("cartCount");

let products = [];

function fmtPrice(value) {
  return Number(value || 0).toLocaleString("ru-RU") + " ₽";
}

function getImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  if (product.image_url) return product.image_url;
  return "https://via.placeholder.com/800x800?text=NutriLab";
}

function getDiscount(product) {
  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);
  if (!oldPrice || oldPrice <= price) return "";
  const percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  return `-${percent}%`;
}

function getRating(product) {
  if (product.rating) return Number(product.rating).toFixed(1);
  return "5.0";
}

function getReviews(product) {
  if (product.reviews_count) return Number(product.reviews_count).toLocaleString("ru-RU");
  return "1";
}

function visibleProducts(list) {
  return (list || []).filter(p => (p.status || "") !== "hidden");
}

function renderProductCards(list, target) {
  if (!target) return;

  if (!list.length) {
    target.innerHTML = `<div class="empty">Товаров не найдено.</div>`;
    return;
  }

  target.innerHTML = list.map((p) => {
    const discount = getDiscount(p);
    const inStock = Number(p.stock || 0) > 0;

    return `
      <div class="card">
        <div class="card-image">
          <img src="${getImage(p)}" alt="${p.name || "Товар"}">
          <div class="card-fav">♡</div>
          ${discount ? `<div class="card-discount">${discount}</div>` : ""}
          <button class="card-cart" data-add="${p.id}">🛒</button>
        </div>

        <div class="card-body">
          <div class="price-row">
            <div class="price">${fmtPrice(p.price)}</div>
            ${Number(p.old_price || 0) > 0 ? `<div class="old-price">${fmtPrice(p.old_price)}</div>` : ""}
          </div>

          <div class="brand-line">NutriLab</div>

          <div class="title">${p.name || "Без названия"}</div>

          <div class="rating-row">
            <span class="rating-star">★</span>
            <span>${getRating(p)}</span>
            <span>·</span>
            <span>${getReviews(p)} отзыв.</span>
          </div>

          <div class="meta-line">
            <div class="stock-pill ${inStock ? "in" : "out"}">
              ${inStock ? "В наличии" : "Нет"}
            </div>
            <div class="article">${p.article || ""}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  target.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.add;
      const product = products.find(item => String(item.id) === String(id));
      if (!product) return;
      addToCart(product);
      renderCart();
      updateCartBadge();
      renderProfile();
    });
  });
}

function renderProducts() {
  const list = visibleProducts(products);
  renderProductCards(list, homeGrid);
  renderProductCards(list, catalogGrid);
}

function renderSearchProducts() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  if (!query) {
    renderProducts();
    return;
  }

  const filtered = visibleProducts(products).filter((p) => {
    const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.article || ""}`.toLowerCase();
    return text.includes(query);
  });

  renderProductCards(filtered, homeGrid);
  renderProductCards(filtered, catalogGrid);
}

function renderCart() {
  const cart = getCart();

  if (!cartList) return;

  if (!cart.length) {
    cartList.innerHTML = `<div class="empty">Корзина пуста.</div>`;
    return;
  }

  let total = 0;

  cartList.innerHTML = cart.map((p) => {
    total += Number(p.price || 0);

    return `
      <div class="cart-item">
        <img src="${getImage(p)}" alt="${p.name || "Товар"}">
        <div>
          <div class="cart-item-title">${p.name || "Товар"}</div>
          <div class="cart-item-price">${fmtPrice(p.price)}</div>
          <div class="cart-row">
            <div class="qty-value">1 шт</div>
            <div class="cart-line-total">${fmtPrice(p.price)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("") + `
    <div class="cart-box">
      <div class="article">Итого</div>
      <div class="cart-total">${fmtPrice(total)}</div>
      <div class="cart-actions">
        <button class="btn btn-dark" id="clearCartBtn">Очистить</button>
        <button class="btn btn-primary" id="checkoutBtn">Оформить</button>
      </div>
    </div>
  `;

  const clearBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (clearBtn) {
    clearBtn.onclick = () => {
      localStorage.setItem("nutrilab_cart", "[]");
      renderCart();
      updateCartBadge();
      renderProfile();
    };
  }

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      alert("Оформление заказа подключим следующим шагом");
    };
  }
}

function updateCartBadge() {
  const count = getCartCount();
  if (!cartBadge) return;

  cartBadge.textContent = count;
  if (count > 0) cartBadge.classList.remove("hidden");
  else cartBadge.classList.add("hidden");
}

function renderProfile() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (tgUser) {
    const fullName = `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() || "Пользователь";
    userName.textContent = fullName;
    userId.textContent = `Telegram ID: ${tgUser.id || "—"}`;
  } else {
    userName.textContent = "Гость";
    userId.textContent = "Открыто вне Telegram";
  }

  favCount.textContent = "Избранное: 0";
  cartCount.textContent = `Товаров в корзине: ${getCartCount()}`;
}

function switchTab(tab) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.querySelectorAll(".bottomNav button").forEach((btn) => btn.classList.remove("active"));

  const screen = document.getElementById(`screen-${tab}`);
  if (screen) screen.classList.add("active");

  const activeBtn = document.querySelector(`.bottomNav button[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

async function loadProducts() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    const html = `<div class="empty">Ошибка загрузки: ${error.message}</div>`;
    homeGrid.innerHTML = html;
    catalogGrid.innerHTML = html;
    return;
  }

  products = data || [];
  renderProducts();
}

searchInput?.addEventListener("input", renderSearchProducts);

document.querySelectorAll(".bottomNav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

loadProducts();
renderCart();
updateCartBadge();
renderProfile();
