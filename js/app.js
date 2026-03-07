import {addToCart,getCart,getCartCount} from "./cart.js"

const SUPABASE_URL="https://cthfqhxnplyibdsjzcrq.supabase.co"
const SUPABASE_KEY="sb_publishable_AjGX1zKhV8kEyGMbvAKwQg_srda-oyI"

const supabase=supabase.createClient(SUPABASE_URL,SUPABASE_KEY)


const homeGrid=document.getElementById("homeGrid")
const catalogGrid=document.getElementById("catalogGrid")
const cartList=document.getElementById("cartList")
const cartBadge=document.getElementById("cartBadge")

const searchInput=document.getElementById("searchInput")

let products=[]


async function loadProducts(){

const {data}=await supabase

.from("products")

.select("*")

products=data||[]

renderProducts()

}


function productCard(p){

const div=document.createElement("div")

div.className="card"

div.innerHTML=`

<img src="${p.image_url||""}">

<div class="cardBody">

<div>${p.name}</div>

<div class="price">${p.price} ₽</div>

<button class="addCart">В корзину</button>

</div>

`

div.querySelector(".addCart").onclick=()=>{

addToCart(p)

updateCart()

}

return div

}



function renderProducts(){

homeGrid.innerHTML=""

catalogGrid.innerHTML=""

products.forEach(p=>{

homeGrid.appendChild(productCard(p))

catalogGrid.appendChild(productCard(p))

})

}



function renderCart(){

const cart=getCart()

cartList.innerHTML=""

cart.forEach(p=>{

const div=document.createElement("div")

div.innerHTML=`${p.name} — ${p.price} ₽`

cartList.appendChild(div)

})

}



function updateCart(){

cartBadge.textContent=getCartCount()

renderCart()

}



searchInput.oninput=()=>{

const q=searchInput.value.toLowerCase()

homeGrid.innerHTML=""

products

.filter(p=>p.name.toLowerCase().includes(q))

.forEach(p=>homeGrid.appendChild(productCard(p)))

}



document.querySelectorAll(".bottomNav button").forEach(btn=>{

btn.onclick=()=>{

const tab=btn.dataset.tab

document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"))

document.getElementById("screen-"+tab).classList.add("active")

}

})


loadProducts()

updateCart()
