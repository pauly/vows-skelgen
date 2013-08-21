/**
 * Vows skeleton test generator
 * https://github.com/pauly/vows-skelgen
 * 
 * @author PC <paulypopex@gmail.com>
 */

var fs = require( 'fs' );
var path = require( 'path' );
var optimist = require( 'optimist' );
var skelgen = { };

module.exports = skelgen;

skelgen.badInputs = [ 'foo', 66, undefined, null, [ ], { }, 'new Date( )', 'function( ){ }' ];

/**
 * @assert ( 'foo' ) === 'foo'
 * @assert ( 66 ) === '66'
 * @assert ( 'foo \'bar\'' ) === 'foo bar'
 */
skelgen.sanitise = function ( string ) {
  return ( '' + string ).replace( /'/g, '' );
};

/**
 * @assert ( 'foo' ) === 'foo'
 * @assert ( 66 ) === '66'
 * @assert ( 'new foo( )' ) === 'foo'
 * @assert ( 'new foo()' ) === 'foo'
 */
skelgen.uninstantiate = function ( string ) {
  return ( '' + string )
    .replace( /(new |\(\s*\))/g, '' )
    .replace( /\./g, '(.prototype)?.' );
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
  var last = args[ args.length - 1 ];
  if ( last == 'callback' || last == 'cb' ) {
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
  if ( data instanceof Function ) {
    return 'function( ){ }';
  }
  data = JSON.stringify( data )
    .replace( /"/g, '\'' )
    .replace( /'new Date\( \)'/, 'new Date( )' )
    .replace( /'function\( \){ }'/, 'function( ){ }' );
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
  var label = skelgen.sanitise( method );
  var test = '  \'' + label + '\': {\n';
  test += skelgen.goodInputTestsAsync( method, args, file ) + ',\n';
  test += '    \'handles malformed input\': {\n';
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
      '        callback: function ( err, result ) {\n' +
      '          console.log( \'' + method + '\', ' + data + ', \'returns\', err, result );\n' +
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
  var regex = new RegExp( commentRegex + '(var )?' + skelgen.sanitise( method ) + '\\W', 'gm' );
  var comments = regex.exec( data );
  if ( comments && comments[1] ) { 
    return comments[1].substr( comments[1].lastIndexOf( '/**' ));
  }
  return null;
};

/**
 * @assert ( ' * @assert (1) == 1' ) === [ [ '1', '==', '1' ] ]
 * @assert ( ' * @assert (2) === 2' ) === [ [ '2', '===', '2' ] ]
 * @assert ( ' * @assert ( 3 ) == 3' ) === [ [ '3', '==', '3' ] ]
 * @assert ( ' * @assert ( 4) == 4\n * @assert (5 ) == 5' ) === [ [ '4', '==', '4' ], [ '5', '==', '5' ], ]
 * @assert ( ' * @assert (\'seven\') == \'seven\'' ) == [ [ '\'seven\'', '==', '\'seven\'' ] ]
 *
 * looks like the types are being messed with here but it is ok
 */
skelgen.assertsFrom = function ( comment ) {
  var regex = new RegExp( '^\\s+\\*\\s+@assert\\s+\\((.+)\\)\\s+(={2,3})\\s+(.+?)$', 'gm' );
  var match;
  var asserts = [ ];
  while ( match = regex.exec( comment )) {
    asserts.push( [ match[1].trim( ), match[2], match[3].trim( ) ] );
  }
  return asserts;
};

skelgen.goodInputTests = function ( method, params, file ) {
  var test = '    \'handles good input\': function ( ) {\n';
  asserts = skelgen.assertsFrom( skelgen.commentBefore( method, file ));
  if ( asserts && asserts.length ) {
    for ( var i = 0; i < asserts.length; i ++ ) {
      test = test + '      assert.deepEqual( ' +
        method + '( ' + 
        asserts[i][0] + ' ), ' + asserts[i][2] + ' );\n';
    }
  }
  else {
    test += '      // var result = ' + method + '( ' + params + ' );\n' +
      '      // var expect = { };\n' +
      '      // assert.deepEqual( result, expect );\n';
  }
  test += '    }';
  return test;
};

skelgen.goodInputTestsAsync = function ( method, params, file ) {
  var test = '    \'handles good input\': {\n';
  asserts = skelgen.assertsFrom( skelgen.commentBefore( skelgen.uninstantiate( method ), file ));
  if ( asserts && asserts.length ) {
    for ( var i = 0; i < asserts.length; i ++ ) {
      test += '      topic: function ( ) {\n' +
        '        ' + method + '( ' + asserts[i][0] + ', this.callback );\n' +
        '      },\n' +
        '      callback: function( err, result ) {\n' +
        '        assert.deepEqual( err, null );\n' +
        '        assert.deepEqual( result, ' + asserts[i][2] + ' );\n' +
        '      },\n';
    }
  }
  else {
    test += '      // we got ' + asserts.length + ' asserts;\n';
    test += '      // topic: function ( ) {\n' +
      '      //   ' + method + '( ' + params + ', this.callback );\n' +
      '      // },\n' +
      '      // callback: function( err, result ) {\n' +
      '      //   assert.deepEqual( err, null );\n' +
      '      // },\n';
  }
  test += '    }';
  return test;
};

skelgen.syncTests = function ( method, args, file ) {
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
  test += skelgen.goodInputTests( method, params, file ) + ',\n';
  test += '    \'handles malformed input\': function ( ) {\n';
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
  var args = require( 'optimist' ).argv;
  var inputFile = args._[0];
  var requestedMethod = args.method;
  if ( ! inputFile ) {
    console.error( 'usage:\n\tnode', process.argv[1], '[file] [optional method] --output [outputfile]' );
    console.error( '\tnode', process.argv[1], '[file] [optional method] | node)' );
    return null;
  }
  var file = path.resolve( inputFile );
  var relativeFile = args.output ? path.relative( path.dirname( args.output ), file ) : file;
  var name = skelgen.baseName( file );
  var Obj = require( file );
  var content = '';
  if ( ! args.hx ) {
    content += '/**\n * generated by ' + process.argv + '\n' +
      ' * https://github.com/pauly/vows-skelgen\n' +
      ' * ' + new Date( ) + '\n */\n\n';
  }
  content += 'var assert = require( \'assert\' );\n' +
    'var vows = require( \'vows\' );\n' +
    'var file = \'' + relativeFile + '\';\n' +
    'var ' + name + ' = require( file );\n\n';
  content += 'vows.describe( \'' + name + '\' ).addBatch( {\n';
  var gotFunctions = false;
  for ( var method in Obj ) {
    if ( Obj.hasOwnProperty( method )) {
      if ( Obj[ method ] instanceof Function ) {
        if ( requestedMethod && ( requestedMethod !== method )) continue;
        content += gotFunctions ? ',\n' : '';
        content += skelgen.writeTests( name + '.' + method, Obj[ method ], file );
        gotFunctions = true;
      }
    }
  }
  if (( ! gotFunctions ) && ( /^[A-Z]/.test( name ))) {
    // our standard is instantiables are capitalised
    var obj = new Obj( );
    for ( method in obj ) {
      if ( obj[ method ] instanceof Function ) {
        if ( requestedMethod && ( requestedMethod !== method )) continue;
        content += gotFunctions ? ',\n' : '';
        content += skelgen.writeTests( 'new ' + name + '( ).' + method, obj[ method ], file );
        gotFunctions = true;
      }
    }
  }
  if ( ! gotFunctions ) {
    content += skelgen.writeTests( name, Obj, file );
  }
  content += '\n' +
    '} )';
  content += '.run( { }, function _allOK ( result ) {\n' +
    '  assert.equal( result.honored + result.pending, result.total );\n' +
    '  process.exit( 0 );\n' +
    '} );\n';
  if ( args.output ) {
    fs.writeFileSync( args.output, content );
  }
  else {
    console.log( content );
  }
};

