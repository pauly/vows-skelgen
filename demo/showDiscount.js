// showDiscount.js
const priceUtils = require('./priceUtils')
const product = {
  price: 900,
  discount: {
    originalPrice: 1000
  }
}
console.log(priceUtils.getDiscount(product)) // 100
