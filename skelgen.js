/**
 * Vows skeleton test generator
 * A work very much in progress
 * https://github.com/pauly/vows-skelgen
 * 
 * @author PC <paulypopex@gmail.com>
 */

var baseName = function ( file ) {
  file = '' + file;
  var base = file.substring( file.lastIndexOf( '/' ) + 1 );
  if ( base.lastIndexOf( '.' ) == -1 ) {
    return base;
  }
  return base.substring( 0, base.lastIndexOf( '.' ));
};

var getFile = function ( ) {
  if ( ! process.argv[2] ) {
    console.error( 'usage: node', process.argv[1], '[file] > [outputfile]' );
    console.error( '(or node', process.argv[1], '[file] | node)' );
    process.exit( 1 );
  }
  var file = process.argv[2];
  if ( /^\w/.exec( file )) {
    file = process.cwd( ) + '/' + file;
  }
  return file;
};

var writeTests = function ( methodName ) {
  var test = '  // @todo parse the file and use params / @assert rules\n' +
    '  \'' + methodName + '\': {\n' +
    '    \'handles good input\': function ( ) {\n' +
    '      /* var result = ' + methodName + '( );\n' +
    '      var expect = { };\n' +
    '      assert.equal( result, expect ); */\n' +
    '    },\n' +
    '    \'handles bad input\': {\n';
  var inputs = [ 'foo', 66, undefined, null, [ ], { }, new Date( ) ];
  for ( var i = 0; i < inputs.length; i ++ ) {
    if ( i ) {
      test += ',\n';
    }
    var data = JSON.stringify( inputs[ i ] );
    test += '      \'handles ' + data + '\': function ( ) {\n' +
      '        var expect = null;\n' +
      '        var result = ' + methodName + '( ' + data + ' );\n' +
      '          assert.equal( result, expect );\n' +
      '      }';
  }
  test += '\n    }\n' +
    '  }';
  return test;
};

var file = getFile( );
var name = baseName( file );
var obj = require( file );
var functions = obj;
var content = '/**\n * generated by ' + process.argv[1] + '\n' +
  ' * https://github.com/pauly/vows-skelgen\n' +
  ' * ' + new Date( ) + '\n */\n' +
  'var assert = require( \'assert\' );\n' +
  'var vows = require( \'vows\' );\n' +
  'var file = \'' + file + '\';\n' +
  'var ' + name + ' = require( file );\n\n' +
  'vows.describe( \'' + name + '\' ).addBatch( {\n';
var gotFunctions = false;
for ( var methodName in functions ) {
  if ( functions.hasOwnProperty( methodName )) {
    if ( gotFunctions ) {
      content += ',\n';
    }
    content += writeTests( name + '.' + methodName );
    gotFunctions = true;
  }
}
if ( ! gotFunctions ) {
  content += writeTests( name );
}
content += '\n' +
  '} ).run( );\n';

console.log( content );
