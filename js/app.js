import {
  getCart,
  addToCart,
  updateCartQty,
  clearCart,
  getCartCount,
  toggleFav,
  isFav,
  getFavCount
} from "./cart.js";

const SUPABASE_URL = "https://cthfqhxnplyibdsjzcrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_AjGX1zKhV8kEyGMbvAKwQg_srda-oyI";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  products: [],
  search: "",
  category: "Все",
  openedCards: []
};

const homeGrid = document.getElementById("homeGrid");
const catalogGrid = document.getElementById("catalogGrid");
const cartList = document.getElementById("cartList");
const cartSummary = document.getElementById("cartSummary");
const cartBadge = document.getElementById("cartBadge");
const cartBadgeTop = document.getElementById("cartBadgeTop");
const searchInput = document.getElementById("searchInput");
const chips = document.getElementById("chips");
const heroMount = document.getElementById("heroMount");

const userName = document.getElementById("userName");
const userId = document.getElementById("userId");
const favCount = document.getElementById("favCount");
const cartCount = document.getElementById("cartCount");
const profileAvatar = document.getElementById("profileAvatar");
const profileCategory = document.getElementById("profileCategory");

const toastWrap = document.createElement("div");
toastWrap.className = "toastWrap";
document.body.appendChild(toastWrap);

const heartIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"></path>
  </svg>
`;

const dotsIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h.01"></path>
    <path d="M12 12h.01"></path>
    <path d="M19 12h.01"></path>
  </svg>
`;

const plusCartIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="20" r="1.5"></circle>
    <circle cx="18" cy="20" r="1.5"></circle>
    <path d="M3 4h2l2.2 10h10.8L21 7H7"></path>
    <path d="M12 10v4"></path>
    <path d="M10 12h4"></path>
  </svg>
`;

function showToast(text, type = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = text;
  toastWrap.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function fmtPrice(value) {
  return Number(value || 0).toLocaleString("ru-RU") + " ₽";
}

function getImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  if (product.image_url) return product.image_url;
  return "https://via.placeholder.com/1200x1200?text=NutriLab";
}

function getDiscount(product) {
  const oldPrice = Number(product.old_price || 0);
  const price = Number(product.price || 0);
  if (!oldPrice || oldPrice <= price) return "";
  const percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  return percent > 0 ? `-${percent}%` : "";
}

function getRating(product) {
  if (product.rating) return Number(product.rating).toFixed(1);
  return "5.0";
}

function getReviews(product) {
  if (product.reviews_count) return Number(product.reviews_count).toLocaleString("ru-RU");
  return "1";
}

function isHit(product) {
  return Number(product.rating || 5) >= 4.9;
}

function isNew(product) {
  return Boolean(product.is_new);
}

function getStockLabel(product) {
  const stock = Number(product.stock || 0);
  if (stock <= 0) return { text: "Нет", className: "out" };
  if (stock <= 5) return { text: `Осталось ${stock}`, className: "low" };
  return { text: "В наличии", className: "in" };
}

function visibleProducts() {
  return (state.products || []).filter((p) => (p.status || "") !== "hidden");
}

function filteredProducts() {
  const query = state.search.trim().toLowerCase();

  return visibleProducts().filter((p) => {
    const matchCategory = state.category === "Все" || (p.category || "") === state.category;
    if (!matchCategory) return false;

    if (!query) return true;

    const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.article || ""}`.toLowerCase();
    return text.includes(query);
  });
}

function getCategories() {
  const set = new Set();
  visibleProducts().forEach((p) => {
    if (p.category) set.add(String(p.category));
  });
  return ["Все", ...Array.from(set).sort((a, b) => a.localeCompare(b, "ru"))];
}

function isCardOpened(id) {
  return state.openedCards.includes(String(id));
}

function toggleCard(id) {
  const sid = String(id);
  if (state.openedCards.includes(sid)) {
    state.openedCards = state.openedCards.filter((item) => item !== sid);
  } else {
    state.openedCards.push(sid);
  }
}

function switchTab(tab) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.querySelectorAll(".navBtn").forEach((btn) => btn.classList.remove("active"));

  const screen = document.getElementById(`screen-${tab}`);
  if (screen) screen.classList.add("active");

  const activeBtn = document.querySelector(`.navBtn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add("active");
}

function renderChips() {
  chips.innerHTML = getCategories().map((cat) => `
    <button class="chip ${state.category === cat ? "active" : ""}" data-chip="${cat}">
      ${cat}
    </button>
  `).join("");

  chips.querySelectorAll("[data-chip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.chip;
      renderChips();
      renderProducts();
      renderProfile();
    });
  });
}

function renderHero() {
  const products = visibleProducts();
  const heroProduct = products[0];

  if (!heroProduct) {
    heroMount.innerHTML = "";
    return;
  }

  heroMount.innerHTML = `
    <div class="heroStack">
      <section class="heroCard">
        <div class="heroText">
          <div class="heroEyebrow">NutriLab Premium</div>
          <h2 class="heroTitle">Витамины нового поколения</h2>
          <div class="heroSub">Чистые формулы. Максимальная биодоступность. Минималистичный подход к заботе о здоровье.</div>
          <div class="heroMeta">Коллекция витаминов и БАДов NutriLab</div>

          <div class="heroActions">
            <button class="heroBtn primary" data-hero-tab="catalog">Смотреть каталог</button>
            <button class="heroBtn secondary" data-hero-add="${heroProduct.id}">В корзину</button>
          </div>
        </div>

        <div class="heroImageWrap">
          <img class="heroImage" src="${getImage(heroProduct)}" alt="${heroProduct.name || "NutriLab"}">
          <div class="heroFloating">▶ Смотреть товар</div>
        </div>
      </section>
    </div>
  `;

  heroMount.querySelectorAll("[data-hero-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.heroAdd;
      const product = state.products.find((item) => String(item.id) === String(id));
      if (!product) return;

      if (Number(product.stock || 0) <= 0) {
        showToast("Товара нет в наличии", "info");
        return;
      }

      const current = Number(getCart()[id] || 0);
      if (current + 1 > Number(product.stock || 0)) {
        showToast("Больше нет на складе", "info");
        return;
      }

      addToCart(id, 1);
      renderCart();
      updateCartBadge();
      renderProfile();
      showToast("Добавлено в корзину");
    });
  });

  heroMount.querySelectorAll("[data-hero-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.heroTab);
    });
  });
}

function renderProductCards(list, target) {
  if (!target) return;

  if (!list.length) {
    target.innerHTML = `<div class="empty">Товаров не найдено.</div>`;
    return;
  }

  target.innerHTML = list.map((p, index) => {
    const discount = getDiscount(p);
    const favActive = isFav(p.id);
    const drawerOpen = isCardOpened(p.id);
    const stockInfo = getStockLabel(p);

    return `
      <div class="card" style="animation-delay:${Math.min(index * 0.03, 0.24)}s">
        <div class="cardImage">
          <div class="cardTopLeft">
            ${discount ? `<div class="imgPill discount">${discount}</div>` : ""}
            ${isHit(p) ? `<div class="imgPill hit">Хит</div>` : ""}
            ${isNew(p) ? `<div class="imgPill new">New</div>` : ""}
          </div>

          <img src="${getImage(p)}" alt="${p.name || "Товар"}">

          <button class="cardFav ${favActive ? "active" : ""}" data-fav="${p.id}" aria-label="Избранное">
            ${heartIcon}
          </button>

          <div class="cardBottomBtns">
            <button class="cardMore" data-more="${p.id}" aria-label="Подробнее">
              ${dotsIcon}
            </button>

            <button class="cardCart" data-add="${p.id}" aria-label="В корзину">
              ${plusCartIcon}
            </button>
          </div>
        </div>

        <div class="cardBody">
          <div class="priceRow">
            <div class="price">${fmtPrice(p.price)}</div>
            ${Number(p.old_price || 0) > 0 ? `<div class="oldPrice">${fmtPrice(p.old_price)}</div>` : ""}
            ${discount ? `<div class="priceSale">${discount}</div>` : ""}
          </div>

          <div class="brandLine">NutriLab</div>

          <div class="title">${p.name || "Без названия"}</div>

          <div class="ratingRow">
            <span class="ratingStar">★</span>
            <span>${getRating(p)}</span>
            <span>·</span>
            <span>${getReviews(p)} отзыв.</span>
          </div>

          <div class="metaLine">
            <div class="stockPill ${stockInfo.className}">
              ${stockInfo.text}
            </div>
            <div class="article">${p.article || ""}</div>
          </div>

          <div class="cardDrawer ${drawerOpen ? "open" : ""}">
            <div class="drawerGrid">
              <div class="drawerRow">
                <div class="drawerKey">Артикул</div>
                <div class="drawerVal">${p.article || "—"}</div>
              </div>

              <div class="drawerRow">
                <div class="drawerKey">Категория</div>
                <div class="drawerVal">${p.category || "—"}</div>
              </div>

              <div class="drawerRow">
                <div class="drawerKey">Остаток</div>
                <div class="drawerVal">${Number(p.stock || 0)} шт</div>
              </div>

              <div class="drawerRow">
                <div class="drawerKey">Статус</div>
                <div class="drawerVal">${Number(p.stock || 0) > 0 ? "Доступен" : "Нет в наличии"}</div>
              </div>
            </div>

            <div class="drawerDesc">
              ${p.description || "Описание товара будет добавлено позже."}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  target.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.add;
      const product = state.products.find((item) => String(item.id) === String(id));
      if (!product) return;

      if (Number(product.stock || 0) <= 0) {
        showToast("Товара нет в наличии", "info");
        return;
      }

      const current = Number(getCart()[id] || 0);
      if (current + 1 > Number(product.stock || 0)) {
        showToast("Больше нет на складе", "info");
        return;
      }

      addToCart(id, 1);
      renderCart();
      updateCartBadge();
      renderProfile();
      showToast("Добавлено в корзину");
    });
  });

  target.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav(btn.dataset.fav);
      renderProducts();
      renderProfile();
      showToast("Избранное обновлено", "info");
    });
  });

  target.querySelectorAll("[data-more]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCard(btn.dataset.more);
      renderProducts();
    });
  });
}

function renderProducts() {
  const list = filteredProducts();
  renderHero();
  renderProductCards(list, homeGrid);
  renderProductCards(list, catalogGrid);
}

function renderCart() {
  const cart = getCart();
  const entries = Object.entries(cart)
    .map(([id, qty]) => {
      const product = state.products.find((p) => String(p.id) === String(id));
      if (!product) return null;
      return {
        product,
        qty: Number(qty || 0),
        lineTotal: Number(product.price || 0) * Number(qty || 0)
      };
    })
    .filter(Boolean);

  if (!entries.length) {
    cartList.innerHTML = `<div class="empty">Корзина пуста.</div>`;
    cartSummary.classList.add("hidden");
    return;
  }

  let total = 0;

  cartList.innerHTML = entries.map(({ product, qty, lineTotal }) => {
    total += lineTotal;

    return `
      <div class="cartItem">
        <img src="${getImage(product)}" alt="${product.name || "Товар"}">
        <div>
          <div class="cartItemTitle">${product.name || "Товар"}</div>
          <div class="cartItemPrice">${fmtPrice(product.price)}</div>
          <div class="cartRow">
            <button class="qtyBtn" data-minus="${product.id}">−</button>
            <div class="qtyValue">${qty}</div>
            <button class="qtyBtn" data-plus="${product.id}">＋</button>
            <div class="cartLineTotal">${fmtPrice(lineTotal)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  cartSummary.innerHTML = `
    <div class="article">Итого</div>
    <div class="cartTotal">${fmtPrice(total)}</div>
    <div class="cartActions">
      <button class="btn btnDark" id="clearCartBtn">Очистить</button>
      <button class="btn btnPrimary" id="checkoutBtn">Оформить</button>
    </div>
  `;
  cartSummary.classList.remove("hidden");

  cartList.querySelectorAll("[data-minus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.minus;
      const current = Number(getCart()[id] || 0);
      updateCartQty(id, current - 1);
      renderCart();
      updateCartBadge();
      renderProfile();
    });
  });

  cartList.querySelectorAll("[data-plus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.plus;
      const current = Number(getCart()[id] || 0);
      const product = state.products.find((p) => String(p.id) === String(id));
      if (!product) return;

      if (current + 1 > Number(product.stock || 0)) {
        showToast("Больше нет на складе", "info");
        return;
      }

      updateCartQty(id, current + 1);
      renderCart();
      updateCartBadge();
      renderProfile();
    });
  });

  const clearBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  clearBtn?.addEventListener("click", () => {
    clearCart();
    renderCart();
    updateCartBadge();
    renderProfile();
    showToast("Корзина очищена", "info");
  });

  checkoutBtn?.addEventListener("click", () => {
    showToast("Оформление заказа подключим следующим шагом", "info");
  });
}

function updateCartBadge() {
  const count = getCartCount();
  const text = count > 99 ? "99+" : count;

  cartBadge.textContent = text;
  cartBadgeTop.textContent = text;

  if (count > 0) {
    cartBadge.classList.remove("hidden");
    cartBadgeTop.classList.remove("hidden");
  } else {
    cartBadge.classList.add("hidden");
    cartBadgeTop.classList.add("hidden");
  }
}

function renderProfile() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (tgUser) {
    const fullName = `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() || "Пользователь";
    userName.textContent = fullName;
    userId.textContent = `Telegram ID: ${tgUser.id || "—"}`;
    profileAvatar.textContent = (tgUser.first_name || "N").slice(0, 1).toUpperCase();
  } else {
    userName.textContent = "Гость";
    userId.textContent = "Открыто вне Telegram";
    profileAvatar.textContent = "G";
  }

  favCount.textContent = getFavCount();
  cartCount.textContent = getCartCount();
  profileCategory.textContent = state.category;
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
    heroMount.innerHTML = "";
    return;
  }

  state.products = data || [];
  renderChips();
  renderProducts();
  renderCart();
  updateCartBadge();
  renderProfile();
}

searchInput?.addEventListener("input", () => {
  state.search = searchInput.value || "";
  renderProducts();
});

document.querySelectorAll(".navBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTab(btn.dataset.tab);
  });
});

document.querySelectorAll(".iconBtn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTab(btn.dataset.tab);
  });
});

document.querySelectorAll('[data-action="focus-search"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    searchInput?.focus();
  });
});

try {
  window.Telegram?.WebApp?.ready?.();
  window.Telegram?.WebApp?.expand?.();
} catch (e) {}

loadProducts();
