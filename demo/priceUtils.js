// priceUtils.js

var priceUtils = { };

module.exports = priceUtils;

/**
 * @assert ( { price: 1000 } ) === null
 * @assert ( { price: 900, discount: { originalPrice: 1000 }} ) === 100
 */
priceUtils.getDiscount = function ( product ) {
  if ( ! ( product instanceof Object && product.discount instanceof Object )) {
    return null;
  }
  return product.discount.originalPrice - product.price;
};

/**
 * @assert ( { price: 1000 } ) === null
 * @assert ( { price: 900, discount: { originalPrice: 1000 }} ) === 100
 */
priceUtils.getDiscountAsync = function ( product, callback ) {
  if ( ! ( product instanceof Object )) {
    return callback( 'product missing', null );
  }
  if ( ! ( product.discount instanceof Object )) {
    return callback( null, null );
  }
  callback( null, product.discount.originalPrice - product.price );
};
