/**
 * Vows skeleton test generator
 * https://github.com/pauly/vows-skelgen
 * 
 * @author PC <paulypopex@gmail.com>
 */

var fs = require( 'fs' );
var skelgen = { };

module.exports = skelgen;

skelgen.badInputs = [ 'foo', 66, undefined, null, [ ], { }, 'new Date( )' ];

/**
 * @assert ( 'foo' ) === 'foo'
 * @assert ( 66 ) === '66'
 * @assert ( 'foo \'bar\' ) === 'foo bar'
 */
skelgen.sanitise = function ( string ) {
  return ( '' + string ).replace( /'/g, '' );
};

/**
 * @assert ( 'foo/bar.js' ) === 'bar'
 * @assert ( 'foo/bar' ) === 'bar'
 * @assert ( 'foo.js' ) === 'foo'
 * @assert ( 'foo' ) === 'foo'
 */
skelgen.baseName = function ( file ) {
  file = '' + file;
  var base = file.substring( file.lastIndexOf( '/' ) + 1 );
  if ( base.lastIndexOf( '.' ) == -1 ) {
    return base;
  }
  return base.substring( 0, base.lastIndexOf( '.' ));
};

skelgen.getFile = function ( file ) {
  file = '' + file;
  file = file.replace( process.cwd( ), './' );
  if ( /^\w/.exec( file )) {
    file = process.cwd( ) + '/' + file;
  }
  return file;
};

skelgen.writeTests = function ( method, obj, file ) {
  if ( ! ( obj && typeof( obj ) == 'function' )) {
    return null;
  }
  var args = [ ];
  var match = /\((.+)\)/.exec( obj.toString( ));
  if ( match && match.length > 0 ) { 
    args = match.pop( )
    .split( ',' )
    .map( function ( a ) { return a.trim( ); } );
  }
  var test = '';
  if ( args[ args.length - 1 ] == 'callback' ) {
    args.pop( );
    return skelgen.asyncTests( method, args, file );
  }
  return skelgen.syncTests( method, args, file );
};

/**
 * @assert ( 66 ) === '66'
 * @assert ( 'foo' ) === '\'foo\''
 */
skelgen.stringify = function ( data ) {
  if ( data === undefined ) return 'undefined';
  data = JSON.stringify( data )
    .replace( /"/g, '\'' )
    .replace( /'new Date\( \)'/, 'new Date( )' );
  return data;
};

skelgen.map = function ( args, data ) {
  if ( ! ( args instanceof Array )) return [ data ];
  var params = args.map( function ( f ) { return data; } );
  if ( params.length ) return params;
  return [ data ];
};

skelgen.asyncTests = function ( method, args, file ) {
  if ( ! ( args instanceof Array )) {
    args = [ ];
  }
  var test = '  \'' + skelgen.sanitise( method ) + '\': {\n';
  test += skelgen.goodInputTestsAsync( method, args, file ) + ',\n';
  test += '    \'handles malformed input\': function ( ) {\n';
  for ( var i = 0; i < skelgen.badInputs.length; i ++ ) {
    if ( i ) {
      test += ',\n';
    }
    var data = skelgen.stringify( skelgen.badInputs[ i ] );
    var params = skelgen.map( args, data );
    test += '      \'handles ' + skelgen.sanitise( data ) + '\': {\n' +
      '        topic: function ( ) {\n' +
      '          ' + method + '( ' + params + ', this.callback );\n' +
      '        },\n' +
      '        callback: function( err, result ) {\n' +
      '          // assert.equal( err, null );\n' +
      '        }\n' +
      '      }';
  }
  test += '\n    }\n' +
    '  }';
  return test;
};

skelgen.commentBefore = function ( method, file ) {
  if ( typeof file !== 'string' ) return null;
  var data = fs.readFileSync( file, 'utf8' );
  var commentRegex = '^(\\/\\*\\*[\\s\\S]+?\\*\\/)\\s+';
  var regex = new RegExp( commentRegex + skelgen.sanitise( method ), 'gm' );
  var comments = regex.exec( data );
  if ( comments && comments[1] ) { 
    return comments[1].substr( comments[1].lastIndexOf( '/**' ));
  }
  return null;
};

skelgen.assertsFrom = function ( comment ) {
  var regex = new RegExp( '^\\s+\\*\\s+@assert\\s+\\((.+?)\\)\\s+(={2,3})\\s+(.+?)$', 'gm' );
  var match;
  var asserts = [ ];
  while ( match = regex.exec( comment )) {
    asserts.push( match.slice( 1 ));
  }
  return asserts;
};

skelgen.goodInputTests = function ( method, params, file ) {
  var test = '    \'handles good input\': function ( ) {\n';
  asserts = skelgen.assertsFrom( skelgen.commentBefore( method, file ));
  if ( asserts && asserts.length ) {
    for ( var i = 0; i < asserts.length; i ++ ) {
      test = test + '      assert.equal( ' +
        method + '(' + 
        asserts[i][0] + ' ), ' + asserts[i][2] + ' );\n';
    }
  }
  else {
    test += '      // var result = ' + method + '( ' + params + ' );\n' +
    '      // var expect = { };\n' +
    '      // assert.equal( result, expect );\n';
  }
  test += '    }';
  return test;
};

skelgen.goodInputTestsAsync = function ( method, params, file ) {
  return '    \'handles good input\': {\n' +
    '      // topic: function ( ) {\n' +
    '      //   ' + method + '( ' + params + ', this.callback );\n' +
    '      // },\n' +
    '      // callback: function( err, result ) {\n' +
    '      //   assert.equal( err, null );\n' +
    '      // },\n' +
    '    }';
};

skelgen.syncTests = function ( method, args, obj ) {
  if ( typeof method !== 'string' ) {
    return null;
  }
  var test;
  if ( ! ( args instanceof Array )) {
    args = [ ];
  }
  var params = args;
  params.pop( );
  test = '  \'' + skelgen.sanitise( method ) + '\': {\n';
  test += skelgen.goodInputTests( method, params, obj ) + ',\n';
  test += '    \'handles bad input\': function ( ) {\n';
  test += '      assert.doesNotThrow(\n' +
    '        function ( ) {\n';
  for ( var i = 0; i < skelgen.badInputs.length; i ++ ) {
    var data = skelgen.stringify( skelgen.badInputs[ i ] );
    params = skelgen.map( args, data );
    test += '          ' + method + '( ' + params + ' );\n';
  }
  test += '        }\n' +
    '      );\n' +
    '    }\n' +
    '  }';
  return test;
};

skelgen.generate = function ( ) {
  if ( ! ( process && process.argv && process.argv[2] )) {
    console.error( 'usage: node', process.argv[1], '[file] [optional method] > [outputfile]' );
    console.error( '(or node', process.argv[1], '[file] [optional method] | node)' );
    return null;
  }
  var requestedMethod = process.argv[3] || null;
  var file = skelgen.getFile( process.argv[2] );
  var name = skelgen.baseName( file );
  var obj = require( file );
  var funcs = obj;
  var content = '/**\n * generated by ' + process.argv[1] + '\n' +
    ' * https://github.com/pauly/vows-skelgen\n' +
    ' * ' + new Date( ) + '\n */\n\n' +
    'var assert = require( \'assert\' );\n' +
    'var vows = require( \'vows\' );\n' +
    'var file = \'' + file + '\';\n' +
    'var ' + name + ' = require( file );\n\n' +
    'vows.describe( \'' + name + '\' ).addBatch( {\n';
  var gotFunctions = false;
  for ( var method in funcs ) {
    if ( funcs.hasOwnProperty( method )) {
      if ( funcs[ method ] instanceof Function ) {
        if (( ! requestedMethod ) || ( requestedMethod === method )) {
          if ( gotFunctions ) {
            content += ',\n';
          }
          content += skelgen.writeTests( name + '.' + method, funcs[ method ], file );
          gotFunctions = true;
        }
      }
    }
  }
  if ( ! gotFunctions ) {
    content += skelgen.writeTests( name, obj );
    // our standard is instantiables are capitalised
    if ( /^[A-Z]/.test( name )) {
      var funcs = new obj( );
      for ( var method in funcs ) {
        if ( funcs[ method ] instanceof Function ) {
          console.log( '/* ', requestedMethod, '===', method,  '? */' );
          if (( ! requestedMethod ) || ( requestedMethod === method )) {
            content += ',\n';
            content += skelgen.writeTests( 'new ' + name + '( ).' + method, funcs[ method ], file );
            gotFunctions = true;
          }
        }
      }
    }
  }
  content += '\n' +
    '} ).run( { }, function _checkAllOK ( result ) {\n' +
    '  assert.equal( result.honored + result.pending, result.total );\n' +
    '  process.exit( 0 );\n' +
    '} );\n';
  return content;
};

