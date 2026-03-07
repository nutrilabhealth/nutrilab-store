import { createClient } from "./supabase.js";

console.log("NutriLab Store started");

const supabase = createClient();

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  console.log("Products:", data);
}

loadProducts();
