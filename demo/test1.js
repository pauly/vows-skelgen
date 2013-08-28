// test1.js

var assert = require( 'assert' );
var vows = require( 'vows' );
var file = './priceUtils.js';
var priceUtils = require( file );

vows.describe( 'priceUtils' ).addBatch( {
  'priceUtils.getDiscount': {
    'handles good input': function ( ) {
      var product = {
        price: 900,
        discount: {
          originalPrice: 1000
        }
      };
      var expected = 100;
      var result = priceUtils.getDiscount( product );
      assert.equal( expected, result );
    },
    'handles bad input': function ( ) {
      assert.doesNotThrow(
        function ( ) {
          priceUtils.getDiscount( { price: 900 } );
        }
      );
    }
  }
} ).run( );

