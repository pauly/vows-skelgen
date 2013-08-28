// showDiscount.js
var priceUtils = require( './priceUtils.js' );
var product = {
  price: 900,
  discount: {
    originalPrice: 1000
  }
};
console.log( priceUtils.getDiscount( product )); // 100
