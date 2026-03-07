import { addToCart, getCart, getCartCount } from "./cart.js";

const SUPABASE_URL = "https://cthfqhxnplyibdsjzcrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_AjGX1zKhV8kEyGMbvAKwQg_srda-oyI";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const homeGrid = document.getElementById("homeGrid");
const catalogGrid = document.getElementById("catalogGrid");
const cartList = document.getElementById("cartList");
const cartBadge = document.getElementById("cartBadge");
const searchInput = document.getElementById("searchInput");

let products = [];

function showProducts(list, target) {
  if (!target) return;

  if (!list.length) {
    target.innerHTML = `<div style="padding:16px;color:white;">Товаров нет</div>`;
    return;
  }

  target.innerHTML = "";

  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image_url || ""}" alt="${p.name || "Товар"}">
      <div class="cardBody">
        <div>${p.name || "Без названия"}</div>
        <div class="price">${Number(p.price || 0).toLocaleString("ru-RU")} ₽</div>
        <button class="addCart">В корзину</button>
      </div>
    `;

    card.querySelector(".addCart").onclick = () => {
      addToCart(p);
      updateCart();
      alert("Добавлено в корзину");
    };

    target.appendChild(card);
  });
}

function renderProducts() {
  showProducts(products, homeGrid);
  showProducts(products, catalogGrid);
}

function renderCart() {
  const cart = getCart();

  if (!cartList) return;

  if (!cart.length) {
    cartList.innerHTML = `<div style="padding:16px;color:white;">Корзина пуста</div>`;
    return;
  }

  cartList.innerHTML = "";

  cart.forEach((p) => {
    const div = document.createElement("div");
    div.style.padding = "12px 16px";
    div.style.color = "white";
    div.textContent = `${p.name} — ${Number(p.price || 0).toLocaleString("ru-RU")} ₽`;
    cartList.appendChild(div);
  });
}

function updateCart() {
  const count = getCartCount();
  if (cartBadge) cartBadge.textContent = count;
  renderCart();
}

function switchTab(tab) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.querySelectorAll(".bottomNav button").forEach((b) => b.classList.remove("active"));

  const screen = document.getElementById("screen-" + tab);
  if (screen) screen.classList.add("active");

  const btn = document.querySelector(`.bottomNav button[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");
}

async function loadProducts() {
  const { data, error } = await sb
    .from("products")
    .select("*");

  if (error) {
    console.error("Supabase error:", error);
    if (homeGrid) {
      homeGrid.innerHTML = `<div style="padding:16px;color:white;">Ошибка загрузки: ${error.message}</div>`;
    }
    return;
  }

  products = data || [];
  renderProducts();
}

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  const filtered = products.filter((p) =>
    `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.article || ""}`
      .toLowerCase()
      .includes(q)
  );

  showProducts(filtered, homeGrid);
});

document.querySelectorAll(".bottomNav button").forEach((btn) => {
  btn.onclick = () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  };
});

loadProducts();
updateCart();
