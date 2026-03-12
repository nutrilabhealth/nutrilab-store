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
  openedCards: [],
  activeProduct: null,
  activeProductTab: "specs",
  activeImageIndex: 0
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

const modalRoot = document.createElement("div");
modalRoot.className = "productModal";
document.body.appendChild(modalRoot);

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

const closeIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12"></path>
    <path d="M18 6L6 18"></path>
  </svg>
`;

const verifyIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6L9 17l-5-5"></path>
  </svg>
`;

const chevronLeftIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 18l-6-6 6-6"></path>
  </svg>
`;

const chevronRightIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18l6-6-6-6"></path>
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

function getImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images;
  if (product.image_url) return [product.image_url];
  return ["https://via.placeholder.com/1200x1200?text=NutriLab"];
}

function getImage(product) {
  return getImages(product)[0];
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
  return "4.9";
}

function getReviews(product) {
  if (product.reviews_count) return Number(product.reviews_count).toLocaleString("ru-RU");
  return "40";
}

function isHit(product) {
  return Number(product.rating || 4.9) >= 4.9;
}

function isNew(product) {
  return Boolean(product.is_new);
}

function getStockLabel(product) {
  const stock = Number(product.stock || 0);
  if (stock <= 0) return { text: "Нет в наличии", className: "out" };
  if (stock <= 12) return { text: `Осталось ${stock} шт`, className: "low" };
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

function buildProductSubline(product) {
  const parts = [];
  if (product.category) parts.push(String(product.category));
  if (product.form) parts.push(String(product.form));
  else parts.push("капсулы");

  if (product.count) parts.push(`${product.count} шт`);
  else parts.push("ежедневный курс");

  return parts.slice(0, 3).join(" • ");
}

function buildFeatureBadges(product) {
  const badges = [];
  const text = `${product.name || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase();

  if (text.includes("omega") || text.includes("омега")) badges.push("Omega");
  if (text.includes("магний") || text.includes("magnesium")) badges.push("Магний");
  if (text.includes("витамин") || text.includes("vitamin")) badges.push("Daily");
  if (text.includes("энерг") || text.includes("energy")) badges.push("Энергия");
  if (text.includes("сон") || text.includes("sleep")) badges.push("Сон");
  if (text.includes("иммун") || text.includes("immune")) badges.push("Иммунитет");
  if (!badges.length && product.category) badges.push(String(product.category));
  if (badges.length < 2) badges.push("Clean formula");
  if (badges.length < 3) badges.push("Premium");
  return badges.slice(0, 3);
}

function buildDrawerInfo(product) {
  const list = [];
  list.push(product.form || "Капсулы");
  list.push(product.count ? `${product.count} шт` : "90 шт");
  list.push(product.country || "Россия");
  return list.slice(0, 3);
}

function productSpecs(product) {
  const desc = String(product.description || "").toLowerCase();

  return [
    ["Артикул", product.article || "—"],
    ["Назначение", product.purpose || product.benefit || (desc.includes("сон") ? "Поддержка нервной системы и сна" : "Ежедневная поддержка организма")],
    ["Форма выпуска", product.form || "капсулы/таблетки"],
    ["Действующее вещество", product.active_ingredient || (desc.includes("магний") ? "магний" : "витаминный комплекс")],
    ["Количество", product.count ? `${product.count} шт.` : "90 шт."],
    ["Срок годности", product.shelf_life || "24 мес"],
    ["Страна производства", product.country || "Россия"],
    ["Температура хранения", `${product.temperature_min || "+5 °C"} — ${product.temperature_max || "+25 °C"}`],
    ["Особенности", product.features || product.benefit || "Чистая формула, ежедневный прием, удобный формат"],
    ["Вес", product.weight_g ? `${product.weight_g} г` : "90 г"]
  ];
}

function relatedProducts(product) {
  return visibleProducts()
    .filter((p) => String(p.id) !== String(product.id))
    .slice(0, 4);
}

function renderChips() {
  if (!chips) return;

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
  if (!heroMount) return;

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
            <button class="heroBtn secondary" data-hero-open="${heroProduct.id}">Подробнее</button>
          </div>
        </div>

        <div class="heroImageWrap">
          <img class="heroImage" src="${getImage(heroProduct)}" alt="${heroProduct.name || "NutriLab"}">
          <div class="heroFloating">▶ Смотреть товар</div>
        </div>
      </section>
    </div>
  `;

  heroMount.querySelectorAll("[data-hero-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.heroTab));
  });

  heroMount.querySelectorAll("[data-hero-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = state.products.find((item) => String(item.id) === String(btn.dataset.heroOpen));
      if (product) openProductModal(product);
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

    return `
      <div class="card" data-open-product="${p.id}" style="animation-delay:${Math.min(index * 0.03, 0.24)}s">
        <div class="cardImage">
          <button class="cardFav ${favActive ? "active" : ""}" data-fav="${p.id}" aria-label="Избранное">
            ${heartIcon}
          </button>

          <img src="${getImage(p)}" alt="${p.name || "Товар"}">

          <div class="cardTopLeft">
            ${discount ? `<div class="imgPill discount">${discount}</div>` : ""}
            ${isHit(p) ? `<div class="imgPill hit">Скидки расцвели</div>` : ""}
          </div>

          <div class="cardBottomBtns">
            <button class="cardMore" data-more="${p.id}" aria-label="Кратко">
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
          </div>

          <div class="brandLine">${p.brand || "NutriLab"}</div>
          <div class="title">${p.name || "Без названия"}</div>

          <div class="ratingRow">
            <span class="ratingStar">★</span>
            <span>${getRating(p)}</span>
            <span>·</span>
            <span>${getReviews(p)} оценка</span>
          </div>

          <div class="cardDrawer ${drawerOpen ? "open" : ""}">
            <div class="drawerHeader">
              <div class="drawerTitle">Кратко о товаре</div>
              <div class="drawerLabel">${p.brand || "NutriLab"}</div>
            </div>

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
            </div>

            <div class="drawerInfoChips">
              ${buildDrawerInfo(p).map((item) => `<div class="drawerInfoChip">${item}</div>`).join("")}
            </div>

            <div class="drawerDesc">
              ${p.description || "Премиальный продукт NutriLab для ежедневной поддержки организма."}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  target.querySelectorAll("[data-open-product]").forEach((card) => {
    card.addEventListener("click", () => {
      const product = state.products.find((item) => String(item.id) === String(card.dataset.openProduct));
      if (product) openProductModal(product);
    });
  });

  target.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      quickAddToCart(btn.dataset.add);
    });
  });

  target.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav(btn.dataset.fav);
      renderProducts();
      renderProfile();
      if (state.activeProduct && String(state.activeProduct.id) === String(btn.dataset.fav)) {
        renderProductModal();
      }
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

function quickAddToCart(id, buyNow = false) {
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
  showToast(buyNow ? "Переходим к оформлению" : "Добавлено в корзину");
  if (buyNow) switchTab("cart");
}

function openProductModal(product) {
  state.activeProduct = product;
  state.activeProductTab = "specs";
  state.activeImageIndex = 0;
  renderProductModal();
  modalRoot.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeProductModal() {
  modalRoot.classList.remove("open");
  document.body.classList.remove("modal-open");
}

function setModalImage(index) {
  const imgs = getImages(state.activeProduct);
  const len = imgs.length;
  if (!len) return;
  state.activeImageIndex = (index + len) % len;
  renderProductModal();
}

function renderProductModal() {
  const p = state.activeProduct;
  if (!p) return;

  const discount = getDiscount(p);
  const specs = productSpecs(p);
  const features = buildFeatureBadges(p);
  const stockInfo = getStockLabel(p);
  const imgs = getImages(p);
  const currentImg = imgs[state.activeImageIndex] || imgs[0];
  const related = relatedProducts(p);

  modalRoot.innerHTML = `
    <div class="productModalBackdrop" data-close-modal="1"></div>

    <div class="productSheet">
      <div class="productSheetHandle"></div>

      <div class="productSheetTop">
        <div>
          <h3 class="productSheetTitle">О товаре</h3>
        </div>

        <button class="productSheetClose" data-close-modal="1" aria-label="Закрыть">
          ${closeIcon}
        </button>
      </div>

      <div class="productGallery">
        <div class="productGalleryMain">
          <img src="${currentImg}" alt="${p.name || "Товар"}">
          ${imgs.length > 1 ? `
            <button class="productGalleryNav prev" data-gallery-prev="1">${chevronLeftIcon}</button>
            <button class="productGalleryNav next" data-gallery-next="1">${chevronRightIcon}</button>
          ` : ""}
        </div>

        ${imgs.length > 1 ? `
          <div class="productGalleryDots">
            ${imgs.map((_, i) => `<div class="productGalleryDot ${i === state.activeImageIndex ? "active" : ""}"></div>`).join("")}
          </div>

          <div class="productGalleryThumbs">
            ${imgs.map((img, i) => `
              <button class="productThumb ${i === state.activeImageIndex ? "active" : ""}" data-gallery-index="${i}">
                <img src="${img}" alt="">
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="productModalPrice">
        <div class="productModalPriceNow">${fmtPrice(p.price)}</div>
        ${Number(p.old_price || 0) > 0 ? `<div class="productModalPriceOld">${fmtPrice(p.old_price)}</div>` : ""}
        ${discount ? `<div class="productModalPriceSale">${discount}</div>` : ""}
      </div>

      <div class="productModalSub">${p.brand || "NutriLab"} · ${p.name || "Товар"} · ${buildProductSubline(p)}</div>

      <div class="productModalBadges">
        <div class="productModalBadge">${stockInfo.text}</div>
        <div class="productModalBadge">★ ${getRating(p)}</div>
        <div class="productModalBadge">${getReviews(p)} отзыв.</div>
        ${features.map((item) => `<div class="productModalBadge">${item}</div>`).join("")}
      </div>

      <div class="productSheetTabs">
        <button class="productTab ${state.activeProductTab === "specs" ? "active" : ""}" data-product-tab="specs">Характеристики</button>
        <button class="productTab ${state.activeProductTab === "desc" ? "active" : ""}" data-product-tab="desc">Описание</button>
      </div>

      <div class="productVerified">
        ${verifyIcon}
        Документы проверены
      </div>

      ${state.activeProductTab === "specs" ? `
        <div class="productModalSection">
          <h4 class="productModalSectionTitle">Основные характеристики</h4>
          <div class="productInfoCard">
            <div class="productInfoGrid">
              ${specs.map(([key, val]) => `
                <div class="productInfoRow">
                  <div class="productInfoKey">${key}</div>
                  <div class="productInfoVal">${val}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      ` : `
        <div class="productModalSection">
          <h4 class="productModalSectionTitle">Описание</h4>
          <div class="productDescCard">
            <div class="productDescLead">
              ${p.description || "Премиальный продукт NutriLab для ежедневной поддержки организма. Чистая формула, удобный формат и аккуратно подобранный состав."}
            </div>
            <div class="productDescMuted">
              Подходит для регулярного приема и аккуратно вписывается в ежедневную wellness-рутину. Формула создана для комфортного использования каждый день.
            </div>

            <div class="productModalBadges">
              <div class="productModalBadge">Артикул: ${p.article || "—"}</div>
              <div class="productModalBadge">${p.category || "БАД"}</div>
              <div class="productModalBadge">${p.form || "Капсулы"}</div>
            </div>
          </div>
        </div>
      `}

      ${related.length ? `
        <div class="alsoSection">
          <div class="alsoHead">
            <div class="alsoTitle">С этим покупают</div>
            <div class="alsoSub">Рекомендуем вместе</div>
          </div>

          <div class="alsoGrid">
            ${related.map((item) => `
              <div class="alsoCard" data-related-open="${item.id}">
                <div class="alsoCardImage">
                  <img src="${getImage(item)}" alt="${item.name || "Товар"}">
                </div>
                <div class="alsoCardBody">
                  <div class="alsoCardPrice">${fmtPrice(item.price)}</div>
                  <div class="alsoCardTitle">${item.name || "Товар"}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="productModalActions">
        <button class="productActionBtn secondary" data-modal-buy="${p.id}">Купить сейчас</button>
        <button class="productActionBtn primary" data-modal-cart="${p.id}">В корзину</button>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeProductModal);
  });

  modalRoot.querySelectorAll("[data-product-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeProductTab = btn.dataset.productTab;
      renderProductModal();
    });
  });

  modalRoot.querySelector("[data-gallery-prev]")?.addEventListener("click", () => {
    setModalImage(state.activeImageIndex - 1);
  });

  modalRoot.querySelector("[data-gallery-next]")?.addEventListener("click", () => {
    setModalImage(state.activeImageIndex + 1);
  });

  modalRoot.querySelectorAll("[data-gallery-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setModalImage(Number(btn.dataset.galleryIndex));
    });
  });

  modalRoot.querySelectorAll("[data-modal-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      quickAddToCart(btn.dataset.modalBuy, true);
    });
  });

  modalRoot.querySelectorAll("[data-modal-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      quickAddToCart(btn.dataset.modalCart, false);
    });
  });

  modalRoot.querySelectorAll("[data-related-open]").forEach((card) => {
    card.addEventListener("click", () => {
      const nextProduct = state.products.find((item) => String(item.id) === String(card.dataset.relatedOpen));
      if (nextProduct) openProductModal(nextProduct);
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

  document.getElementById("clearCartBtn")?.addEventListener("click", () => {
    clearCart();
    renderCart();
    updateCartBadge();
    renderProfile();
    showToast("Корзина очищена", "info");
  });

  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
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
  try {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      const html = `<div class="empty">Ошибка загрузки: ${error.message}</div>`;
      if (homeGrid) homeGrid.innerHTML = html;
      if (catalogGrid) catalogGrid.innerHTML = html;
      if (heroMount) heroMount.innerHTML = "";
      return;
    }

    state.products = data || [];
    renderChips();
    renderProducts();
    renderCart();
    updateCartBadge();
    renderProfile();
  } catch (err) {
    console.error("Load error:", err);
    const html = `<div class="empty">Ошибка загрузки каталога.</div>`;
    if (homeGrid) homeGrid.innerHTML = html;
    if (catalogGrid) catalogGrid.innerHTML = html;
    if (heroMount) heroMount.innerHTML = "";
  }
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProductModal();
  if (!state.activeProduct || !modalRoot.classList.contains("open")) return;
  if (e.key === "ArrowLeft") setModalImage(state.activeImageIndex - 1);
  if (e.key === "ArrowRight") setModalImage(state.activeImageIndex + 1);
});

try {
  window.Telegram?.WebApp?.ready?.();
  window.Telegram?.WebApp?.expand?.();
} catch (e) {}

loadProducts();
