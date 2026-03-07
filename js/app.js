import { createClient } from "./supabase.js";

const app = document.getElementById("app");
const supabase = createClient();

function fmtPrice(v) {
  return Number(v || 0).toLocaleString("ru-RU") + " ₽";
}

function getImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (product.image_url) return product.image_url;
  return "https://via.placeholder.com/800x800?text=NutriLab";
}

function renderProducts(products) {
  if (!products.length) {
    app.innerHTML = `<div class="empty">Товаров пока нет.</div>`;
    return;
  }

  app.innerHTML = products.map(product => `
    <div class="card">
      <img src="${getImage(product)}" alt="${product.name || "Товар"}">
      <div class="card-body">
        <div class="badges">
          <div class="badge ${Number(product.stock || 0) > 0 ? "in" : "out"}">
            ${Number(product.stock || 0) > 0 ? "В наличии" : "Нет в наличии"}
          </div>
          ${product.category ? `<div class="badge">${product.category}</div>` : ""}
        </div>

        <div class="title">${product.name || "Без названия"}</div>
        <div class="desc">${product.description || "Описание товара появится здесь."}</div>
        <div class="price">${fmtPrice(product.price)}</div>

        <div class="actions">
          <button class="btn btn-dark" onclick="alert('Подробная карточка товара будет следующим шагом')">Подробнее</button>
          <button class="btn btn-primary" onclick="alert('Корзину подключим следующим шагом')">В корзину</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    app.innerHTML = `<div class="empty">Ошибка загрузки товаров: ${error.message}</div>`;
    return;
  }

  const visibleProducts = (data || []).filter(p => (p.status || "") !== "hidden");
  renderProducts(visibleProducts);
}

loadProducts();
