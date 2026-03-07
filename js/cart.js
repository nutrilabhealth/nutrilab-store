export function getCart(){

return JSON.parse(localStorage.getItem("nutrilab_cart")||"[]")

}

export function addToCart(product){

let cart=getCart()

cart.push(product)

localStorage.setItem("nutrilab_cart",JSON.stringify(cart))

}

export function getCartCount(){

return getCart().length

}
