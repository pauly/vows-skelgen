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
var args = { };

module.exports = skelgen;

skelgen.badInputs = [ 'foo', 66, undefined, null, [ ], { }, 'new Date( )', 'function ( ) { }' ];

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
    .replace( /\./g, '(\.prototype)?.' );
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
  if ( last == 'callback' || last == 'cb' || last == 'next' ) {
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
  if ( data instanceof Function ) return 'function ( ) { }';
  data = JSON.stringify( data )
    .replace( /"/g, '\'' )
    .replace( /'new Date\( \)'/, 'new Date( )' )
    .replace( /'function\s*\(\s*\)\s*{\s*}'/, 'function ( ) { }' );
  return data;
};

/**
 * @assert ( [ ], 'foo' ) === [ 'foo' ]
 * @assert ( [ 1 ], 'foo' ) === [ 'foo' ]
 * @assert ( [ 'bar' ], 'foo' ) === [ 'foo' ]
 * @assert ( [ 1, 2, 3 ], 'foo' ) === [ 'foo', 'foo', 'foo' ]
 */
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
  var goodInputTests = skelgen.goodInputTestsAsync( method, args, file );
  test += goodInputTests;
  test += goodInputTests ? ',\n' : '';
  test += '    \'handles malformed input\': {\n';
  for ( var i = 0; i < skelgen.badInputs.length; i ++ ) {
    test += i ? ',\n' : '';
    var data = skelgen.stringify( skelgen.badInputs[ i ] );
    var params = skelgen.map( args, data );
    test += '      \'handles ' + skelgen.sanitise( data ) + '\': function ( done ) {\n' +
      '        ' + method + '( ' + params + ', function ( err, result ) {\n' +
      // '          console.log( \'' + method + '\', ' + data + ', \'returns\', err, result );\n' +
      '          assert.ok( true );\n' +
      '          done( );\n' +
      '        } );\n' +
      '      }';
  }
  test += '\n    }\n' +
    '  }';
  return test;
};

/**
 * @assert ( 'foo', 'bar' ) === null
 */
skelgen.commentBefore = function ( method, file ) {
  if ( typeof file !== 'string' ) return null;
  if ( ! fs.existsSync( file )) return null;
  var data = fs.readFileSync( file, 'utf8' );
  var commentRegex = '^((\\/\\*\\*)[\\s\\S]+?\\*\\/)\\s+';
  method = skelgen.uninstantiate( method );
  var regex = new RegExp( commentRegex + '(var )?' + skelgen.sanitise( method ) + '\\W', 'gm' );
  var comments = regex.exec( data );
  if ( comments && comments[1] ) { 
    return comments[1].substr( comments[1].lastIndexOf( comments[2] ));
    return comment;
  }
  return null;
};

/**
 * @assert ( ' * @assert (1) == 1' ) === [ [ '1', '==', '1', '' ]]
 * @assert ( ' * @assert (2) === 2' ) === [ [ '2', '===', '2', '' ]]
 * @assert ( ' * @assert ( 3 ) == 3' ) === [ [ '3', '==', '3', '' ]]
 * @assert ( ' * @assert ( 4) == 4\n * @assert (5 ) == 5' ) === [ [ '4', '==', '4', '' ], [ '5', '==', '5', '' ]]
 * @assert ( ' * @assert (\'seven\') == \'seven\'' ) == [ [ '\'seven\'', '==', '\'seven\'', '' ]]
 * @assert ( ' * @assert (1).foo == 1' ) === [ [ '1', '==', '1', '.foo' ]]
 * @assert ( ' * @assert (2).foo === 2' ) === [ [ '2', '===', '2', '.foo' ]]
 * @assert ( ' * @assert ( 3 ).foo == 3' ) === [ [ '3', '==', '3', '.foo' ]]
 * @assert ( ' * @assert ( 4).foo == 4\n * @assert (5 ) == 5' ) === [ [ '4', '==', '4', '.foo' ], [ '5', '==', '5', '' ]]
 * @assert ( ' * @assert ( 4) == 4\n * @assert (5 ).foo == 5' ) === [ [ '4', '==', '4', '' ], [ '5', '==', '5', '.foo' ]]
 * @assert ( ' * @assert ( 4).foo == 4\n * @assert (5 ).foo == 5' ) === [ [ '4', '==', '4', '.foo' ], [ '5', '==', '5', '.foo' ]]
 * @assert ( ' * @assert (\'seven\').foo == \'seven\'' ) == [ [ '\'seven\'', '==', '\'seven\'', '.foo' ]]
 * @assert ( ' * @assert (1)[0] == 1' ) === [ [ '1', '==', '1', '[0]' ]]
 * @assert ( ' * @assert (2)[0] === 2' ) === [ [ '2', '===', '2', '[0]' ]]
 * @assert ( ' * @assert ( 3 )[0] == 3' ) === [ [ '3', '==', '3', '[0]' ]]
 * @assert ( ' * @assert ( 4)[0] == 4\n * @assert (5 ) == 5' ) === [ [ '4', '==', '4', '[0]' ], [ '5', '==', '5', '' ]]
 * @assert ( ' * @assert ( 4) == 4\n * @assert (5 )[0] == 5' ) === [ [ '4', '==', '4', '' ], [ '5', '==', '5', '[0]' ]]
 * @assert ( ' * @assert ( 4)[0] == 4\n * @assert (5 )[0] == 5' ) === [ [ '4', '==', '4', '[0]' ], [ '5', '==', '5', '[0]' ]]
 * @assert ( ' * @assert (\'seven\')[0] == \'seven\'' ) == [ [ '\'seven\'', '==', '\'seven\'', '[0]' ]]
 *
 * looks like the types are being messed with here but it is ok
 */
skelgen.assertsFrom = function ( comment ) {
  var optionalBit = '[\\[\\]\\.\\w]+'; // match dot, letters, numbers and square brackets
  var regex = new RegExp( '^\\s+\\*\\s+@' + 'assert\\s+\\((.+)\\)(' + optionalBit + ')?\\s+(={2,3})\\s+(.+?)$', 'gm' );
  var match;
  var asserts = [ ];
  while ( match = regex.exec( comment )) {
    var optionalKey = ( match[2] || '' ).trim( ); // optional key to find in result
    asserts.push( [ ( '' + match[1] ).trim( ), match[3], ( '' + match[4] ).trim( ), optionalKey] );
  }
  return asserts;
};

/**
 * @assert ( ' * @fixture ./foo.js\n * @fixture ../foo/bar.js ' ) === [ './foo.js', '../foo/bar.js' ]
 */
skelgen.fixturesFrom = function ( comment ) {
  var regex = new RegExp( '^\\s+\\*\\s+@fixture\\s+(.+)$', 'gm' );
  var match;
  var fixtures = [ ];
  while ( match = regex.exec( comment )) {
    fixtures.push( match[1].trim( ));
  }
  return fixtures;
};

skelgen.goodInputTests = function ( method, params ) {
  var comment = skelgen.commentBefore( method, args.file );
  var asserts = skelgen.assertsFrom( comment );
  var i;
  var test = '';
  var tested = false;
  if ( asserts && asserts.length ) {
    test += '    \'handles good input\': function ( ) {\n';
    var declareExpected = true;
    for ( i = 0; i < asserts.length; i ++ ) {
      var expected = asserts[i][2];
      if (( JSON.stringify( expected ).length > 20 ) && ( expected !== 'undefined' )) {
        test += '      ';
        test += declareExpected ? 'var ' : '';
        test += 'expected = ' + expected + ';\n';
        expected = 'expected';
        declareExpected = false;
      }
      test += '      assert.deepEqual( ' + method + '( ' + asserts[i][0] + ' )' + asserts[i][3] + ', ' + expected + ' ); // goodInputTests\n';
    }
    test += '    }';
    tested = true;
  }
  var fixtures = skelgen.fixturesFrom( comment );
  if ( fixtures && fixtures.length && ! args.output ) {
    console.error( 'Fixtures only work with the --output option...' );
  }
  if ( fixtures && fixtures.length && args.output ) {
    test += tested ? ',\n' : '';
    for ( i = 0; i < fixtures.length; i ++ ) {
      var absoluteOutputFile = path.resolve( args.output );
      var absoluteFixture = path.resolve( path.dirname( args.file ), fixtures[ i ] );
      var relativeFixture = path.relative( path.dirname( absoluteOutputFile ), absoluteFixture );
      test += ( i ? ',\n' : '' ) +
        '    \'handles fixture ' + path.basename( relativeFixture ) + '\': function ( done ) {\n' +
        '      var file = __dirname + \'/' + relativeFixture + '\';\n' +
        '      var fixture = require( file );\n' +
        '      var result = ' + method + '( ';
      for ( var j = 0; j < params.length; j ++ ) {
        test += j ? ', ' : '';
        test += 'fixture.' + params[j];
      }
      test += ' );\n' +
        '      if ( fixture.result instanceof Object ) {\n' +
        '        Object.keys( fixture.result ).forEach( function ( key ) {\n' +
        '          assert.deepEqual( result[key], fixture.result[key], key + \' differed; \' + JSON.stringify( result[key] ) + \' != \' + JSON.stringify( fixture.result[key] ));\n' +
        '        } );\n' +
        '      }\n' +
        '      assert.deepEqual( result, fixture.result );\n' +
        '      done( );\n' +
        '    }';
    }
  }
  if ( ! (( asserts && asserts.length ) || ( fixtures && fixtures.length && args.output ))) {
    console.warn( 'warning: no happy path coverage for', method );
  }
  return test;
};

/**
 * @fixture ../test/fixture/_dummyAsyncMethod.js
 * @fixture ../test/fixture/_dummyAsyncMethod2.js
 */
skelgen._dummyAsyncMethod = function ( param, cb ) {
  if ( ! ( param instanceof Object )) param = { };
  return cb( null, param.foo );
};

skelgen.goodInputTestsAsync = function ( method, params, fileToTest ) {
  var test = '';
  var tested = false;
  var comment = skelgen.commentBefore( method, fileToTest );
  var asserts = skelgen.assertsFrom( comment );
  var i;
  if ( asserts && asserts.length ) {
    test += '    \'handles good input\': {\n';
    for ( i = 0; i < asserts.length; i ++ ) {
      test += i ? ',\n' : '';
      var expected = asserts[i][2];
      test += '      test' + i + ': function ( done ) {\n' +
        '        ' + method + '( ' + ( asserts[i][0] || 'undefined' ) + ', function ( err, result ) {\n' +
        '          assert.equal( err, null, \'expect no error; got \' + err );\n';
      if (( JSON.stringify( expected ).length > 20 ) && ( expected !== 'undefined' )) {
        test += '          var expected = ' + expected + ';\n';
        expected = 'expected';
      }
      test += '          assert.deepEqual( result' + asserts[i][3] + ', ' + expected + ' ); // goodInputTestsAsync\n' +
        '          done( );\n' +
        '        } );\n' +
        '      }';
    }
    test += '\n    }';
  }
  var fixtures = skelgen.fixturesFrom( comment );
  if ( fixtures && fixtures.length && ! args.output ) {
    console.error( 'Fixtures only work with the --output option...' );
  }
  if ( fixtures && fixtures.length && args.output ) {
    test += tested ? ',\n' : '';
    for ( i = 0; i < fixtures.length; i ++ ) {
      var absoluteOutputFile = path.resolve( args.output );
      var absoluteFixture = path.resolve( path.dirname( fileToTest ), fixtures[ i ] );
      var relativeFixture = path.relative( path.dirname( absoluteOutputFile ), absoluteFixture );
      test += i ? ',\n' : '' +
        // '    // fileToTest = ' + fileToTest + '\n' +
        // '    // fixture = ' + fixtures[ i ] + '\n' +
        // '    // args.output = ' + args.output + '\n' +
        // '    // absoluteOutputFile = ' + absoluteOutputFile + '\n' +
        // '    // absoluteFixture = ' + absoluteFixture + '\n' +
        // '    // relativeFixture = ' + relativeFixture + '\n' +
        // '    // args.include = ' + args.include + '\n' +
        '    \'handles fixture ' + relativeFixture + '\': function ( ) {\n' +
        '        var file = __dirname + \'/' + relativeFixture + '\';\n' +
        // '        console.log( file );\n' +
        '        var fixture = require( file );\n' +
        // '        console.log( \'fixture is\', fixture );\n' +
        '        ' + method + '( ';
      for ( var i = 0; i < params.length; i ++ ) {
        test += 'fixture.' + params[i] + ', ';
      }
      test += 'function ( err, result ) {\n' +
        '        var file = __dirname + \'/' + relativeFixture + '\';\n' +
        // '        console.log( file );\n' +
        '        var fixture = require( file );\n' +
        // '        console.log( \'' + method + ' returns\', err, result );\n' +
        '        assert.deepEqual( err, fixture.callback.err );\n' +
        // '        // relies on fixture having callback called "callback" - fix this!\n' +
        '        assert.deepEqual( result, fixture.callback.result );\n' +
        '      } );\n' +
        '    }';
    }
  }
  if ( ! (( asserts && asserts.length ) || ( fixtures && fixtures.length ))) {
    console.warn( 'warning: no happy path for', method );
  }
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
  // params.pop( ); // why was I popping the last one? No callback here...
  test = '  \'' + skelgen.sanitise( method ) + '\': {\n';
  var goodInputTests = skelgen.goodInputTests( method, params, file );
  test += goodInputTests;
  test += goodInputTests ? ',\n' : '';
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
  args = require( 'optimist' ).argv;
  args.file = args.file || args._[0];
  var requestedMethod = args.method;
  if ( ! ( args.file && args.output )) {
    console.error( 'usage:\n\tnode', process.argv[1], '[file] [optional method] --mochaRunner ./test/mochaRunner.js --output [outputfile]' );
    return null;
  }
  args.file = path.resolve( args.file );
  var relativeFile = args.output ? './' + path.relative( path.dirname( args.output ), args.file ) : args.file;
  var name = skelgen.baseName( args.file );
  var Obj = require( args.file );
  var content = '';
  console.warn( 'args:', args );
  if ( args.good ) this.badInputs = [ ]; // don't test bad inputs
  if ( args.hx ) {
    args.mochaRunner = args.mochaRunner || './test/mochaRunner.js';
    /* args.include = args.include || '';
    var exec = require( 'child_process' ).exec;
    [ 'config', 'Token' ].forEach( function ( module ) {
      var cmd = 'find ' + process.cwd( ) + ' -name ' + module + '.js | head -1';
      exec( cmd, function ( err, stdout, stderr ) {
        console.warn( 'found', cmd, '?', err, stdout, stderr );
        args.include += '/' + '* ' + stdout + ' *' + '/\n';
      } );
    } );
    console.warn( 'args.include = ', args.include ); */
  }
  if ( ! args.hx ) {
    content += '/**\n';
    if ( args.comment ) {
      content += ' * ' + ( '' + args.comment ).split( '\\n' ).join( '\n * ' ) + '\n *\n';
    }
    content += ' * generated by ' + process.argv + '\n' +
      ' * https://github.com/pauly/vows-skelgen\n' +
      ' * ' + new Date( ) + '\n */\n\n';
  }
  if ( ! args.mochaRunner ) {
    content += 'var Mocha = require( \'mocha\' );\n' +
      'var mocha = new Mocha( { ui: \'exports\', reporter: \'list\' } );\n';
  }
  content += 'var assert = require( \'assert\' );\n' +
    'var file = \'' + relativeFile + '\';\n' +
    'var ' + name + ' = require( file );\n\n';
  content += 'module.exports = {\n';
  var gotFunctions = false;
  for ( var method in Obj ) {
    if ( Obj.hasOwnProperty( method )) {
      if ( Obj[ method ] instanceof Function ) {
        if ( requestedMethod && ( requestedMethod !== method )) continue;
        content += gotFunctions ? ',\n' : '';
        content += skelgen.writeTests( name + '.' + method, Obj[ method ], args.file, args.output );
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
        content += skelgen.writeTests( 'new ' + name + '( ).' + method, obj[ method ], args.file, args.output );
        gotFunctions = true;
      }
    }
  }
  if ( ! gotFunctions ) {
    content += skelgen.writeTests( name, Obj, args.file, args.output );
  }
  content += '\n' +
    '};\n';
  if ( args.output ) {
    if ( args.mochaRunner ) {
      var absoluteOutputFile = path.resolve( args.output );
      var absoluteMochaRunner = path.resolve( args.mochaRunner );
      var relativeMochaRunner = path.relative( path.dirname( absoluteOutputFile ), absoluteMochaRunner );
      content += '\nrequire( \'' + relativeMochaRunner + '\' );\n';
    }
    else {
      content += 'mocha.addFile( __filename );\n' +
        'mocha.run( function ( failures ) {\n' +
        '  process.exit( failures ? 1 : 0 );\n' +
        '} );\n';
    }
    fs.writeFileSync( args.output, content );
  }
  else {
    console.log( content );
  }
};

