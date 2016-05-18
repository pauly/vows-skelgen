'use strict';
/* eslint-disable valid-jsdoc */
/**
 * Vows skeleton test generator
 * https://github.com/pauly/vows-skelgen
 *
 * @author PC <paulypopex@gmail.com>
 */

var fs = require('fs');
var path = require('path');
var args = {};

var skelgen = module.exports = {};

skelgen.badInputs = [66, null, [], { }];

/**
 * @returns string
 * @assert ('foo') === 'foo'
 * @assert (66) === '66'
 * @assert ('foo \'bar\'') === 'foo bar'
 */
skelgen.sanitise = function (string) {
  return ('' + string).replace(/'/g, '');
};

/**
 * @assert ('foo') === 'foo'
 * @assert (66) === '66'
 * @assert ('new foo()') === 'foo'
 * @assert ('new foo()') === 'foo'
 */
skelgen.uninstantiate = function (string) {
  return ('' + string)
    .replace(/(new |\(\s*\))/g, '')
    .replace(/\./g, '(\.prototype)?.');
};

/**
 * @assert ('foo/bar.js') === 'bar'
 * @assert ('foo/bar') === 'bar'
 * @assert ('foo.js') === 'foo'
 * @assert ('foo') === 'foo'
 */
skelgen.baseName = function (file) {
  file = '' + file;
  var base = file.substring(file.lastIndexOf('/') + 1);
  if (base.lastIndexOf('.') === -1) {
    return base;
  }
  return base.substring(0, base.lastIndexOf('.'));
};

skelgen.writeTests = function (method, obj, file) {
  if (!obj || typeof obj !== 'function') {
    return null;
  }
  var methodParams = [];
  var match = /\((.+)\)/.exec(obj.toString());
  var _map = function (a) {
    return a.trim();
  };
  if (match && match.length > 0) {
    methodParams = match.pop()
    .split(',')
    .map(_map);
  }
  var last = methodParams[methodParams.length - 1];
  if (last === 'callback' || last === 'cb' || last === 'next') {
    methodParams.pop();
    return skelgen.asyncTests(method, methodParams, file);
  }
  return skelgen.syncTests(method, methodParams, file);
};

/**
 * @assert (66) === '66'
 * @assert ('foo') === '\'foo\''
 */
skelgen.stringify = function (data) {
  if (data === undefined) return 'undefined';
  if (data instanceof Function) return 'function () { }';
  data = JSON.stringify(data)
    .replace(/"/g, '\'')
    .replace(/'new Date\(\)'/, 'new Date()')
    .replace(/'function\s*\(\s*\)\s*{\s*}'/, 'function () { }');
  return data;
};

/**
 * @assert ([], 'foo') === ['foo']
 * @assert ([1], 'foo') === ['foo']
 * @assert (['bar'], 'foo') === ['foo']
 * @assert ([1, 2, 3], 'foo') === ['foo', 'foo', 'foo']
 */
skelgen.map = function (methodParams, data) {
  if (!(methodParams instanceof Array)) return [data];
  var params = methodParams.map(function () {
    return data;
  });
  if (params.length) return params;
  return [data];
};

skelgen.asyncTests = function (method, methodParams, file) {
  if (!(methodParams instanceof Array)) {
    methodParams = [];
  }
  var label = skelgen.sanitise(method);
  var test = '  describe(\'' + label + '\', function() {\n';
  test += skelgen.goodInputTestsAsync(method, methodParams, file);
  if (skelgen.badInputs.length) {
    test += '    describe(\'malformed input\', function() {\n';
    for (var i = 0; i < skelgen.badInputs.length; i++) {
      var data = skelgen.stringify(skelgen.badInputs[i]);
      var params = skelgen.map(methodParams, data);
      test += '      it(\'handles ' + skelgen.sanitise(data) + '\', function (done) {\n' +
        '        ' + method + '(' + params.join(', ') + ', function () {\n' +
        '          expect(true).to.be.true();\n' +
        '          done();\n' +
        '        });\n' +
        '      });\n';
    }
    test += '\n    });\n';
  }
  test += '  });\n';
  return test;
};

/**
 * @assert ('foo', 'bar') === null
 */
skelgen.commentBefore = function (method, file) {
  if (typeof file !== 'string') return null;
  if (!fs.existsSync(file)) return null;
  var data = fs.readFileSync(file, 'utf8');
  var commentRegex = '^((\\/\\*\\*)[\\s\\S]+?\\*\\/)\\s+';
  method = skelgen.uninstantiate(method);
  var regex = new RegExp(commentRegex + '(var)?' + skelgen.sanitise(method) + '\\W', 'gm');
  var comments = regex.exec(data);
  if (comments && comments[1]) {
    return comments[1].substr(comments[1].lastIndexOf(comments[2]));
  }
  return null;
};

/**
 * @assert (' * @assert (1) == 1') === [['1', '==', '1', '']]
 * @assert (' * @assert (2) === 2') === [['2', '===', '2', '']]
 * @assert (' * @assert (3) == 3') === [['3', '==', '3', '']]
 * @assert (' * @assert (4) == 4\n * @assert (5) == 5') === [['4', '==', '4', ''], ['5', '==', '5', '']]
 * @assert (' * @assert (\'seven\') == \'seven\'') == [['\'seven\'', '==', '\'seven\'', '']]
 * @assert (' * @assert (1).foo == 1') === [['1', '==', '1', '.foo']]
 * @assert (' * @assert (2).foo === 2') === [['2', '===', '2', '.foo']]
 * @assert (' * @assert (3).foo == 3') === [['3', '==', '3', '.foo']]
 * @assert (' * @assert (4).foo == 4\n * @assert (5) == 5') === [['4', '==', '4', '.foo'], ['5', '==', '5', '']]
 * @assert (' * @assert (4) == 4\n * @assert (5).foo == 5') === [['4', '==', '4', ''], ['5', '==', '5', '.foo']]
 * @assert (' * @assert (4).foo == 4\n * @assert (5).foo == 5') === [['4', '==', '4', '.foo'], ['5', '==', '5', '.foo']]
 * @assert (' * @assert (\'seven\').foo == \'seven\'') == [['\'seven\'', '==', '\'seven\'', '.foo']]
 * @assert (' * @assert (1)[0] == 1') === [['1', '==', '1', '[0]']]
 * @assert (' * @assert (2)[0] === 2') === [['2', '===', '2', '[0]']]
 * @assert (' * @assert (3)[0] == 3') === [['3', '==', '3', '[0]']]
 * @assert (' * @assert (4)[0] == 4\n * @assert (5) == 5') === [['4', '==', '4', '[0]'], ['5', '==', '5', '']]
 * @assert (' * @assert (4) == 4\n * @assert (5)[0] == 5') === [['4', '==', '4', ''], ['5', '==', '5', '[0]']]
 * @assert (' * @assert (4)[0] == 4\n * @assert (5)[0] == 5') === [['4', '==', '4', '[0]'], ['5', '==', '5', '[0]']]
 * @assert (' * @assert (\'seven\')[0] == \'seven\'') == [['\'seven\'', '==', '\'seven\'', '[0]']]
 *
 * looks like the types are being messed with here but it is ok
 */
skelgen.assertsFrom = function (comment) {
  var optionalBit = '[\\[\\]\\.\\w]+'; // match dot, letters, numbers and square brackets
  var regex = new RegExp('^\\s+\\*\\s+@' + 'assert\\s+\\((.+)\\)(' + optionalBit + ')?\\s+(={2,3})\\s+(.+?)$', 'gm');
  var match;
  var asserts = [];
  while (match = regex.exec(comment)) {
    var optionalKey = (match[2] || '').trim(); // optional key to find in result
    asserts.push([('' + match[1]).trim(), match[3], ('' + match[4]).trim(), optionalKey]);
  }
  return asserts;
};

/**
 * @assert (' * @fixture ./foo.js\n * @fixture ../foo/bar.js ') === ['./foo.js', '../foo/bar.js']
 */
skelgen.fixturesFrom = function (comment) {
  var regex = new RegExp('^\\s+\\*\\s+@fixture\\s+(.+)$', 'gm');
  var match;
  var fixtures = [];
  while (match = regex.exec(comment)) {
    fixtures.push(match[1].trim());
  }
  return fixtures;
};

skelgen.goodInputTests = function(method, params) {
  var comment = skelgen.commentBefore(method, args.file);
  var asserts = skelgen.assertsFrom(comment);
  var i;
  var test = '';
  if (asserts && asserts.length) {
    test += '    it(\'handles good input\', function() {\n';
    var declareExpected = true;
    for (i = 0; i < asserts.length; i++) {
      var expected = asserts[i][2];
      if ((JSON.stringify(expected).length > 20) && (expected !== 'undefined')) {
        test += '      ';
        test += declareExpected ? 'var ' : '';
        test += 'expected = ' + expected + ';\n';
        expected = 'expected';
        declareExpected = false;
      }
      test += '      expect(' + method + '(' + asserts[i][0] + ')' + asserts[i][3] + ').to.deep.equal(' + expected + '); // goodInputTests\n';
    }
    test += '    });\n';
  } else {
    test += '    // it(\'does something\', function() {\n';
    var paramsForTest = params;
    if (params && params.join) paramsForTest = params.join(', ');
    test += '    //   expect(' + method + '('+ paramsForTest + ')).to.be.ok();\n';
    test += '    // });\n';
  }
  var fixtures = skelgen.fixturesFrom(comment);
  if (fixtures && fixtures.length && !args.output) {
    console.error('Fixtures only work with the --output option...');
  }
  if (fixtures && fixtures.length && args.output) {
    for (i = 0; i < fixtures.length; i++) {
      var absoluteOutputFile = path.resolve(args.output);
      var absoluteFixture = path.resolve(path.dirname(args.file), fixtures[i]);
      var relativeFixture = path.relative(path.dirname(absoluteOutputFile), absoluteFixture);
      test += '    it(\'handles fixture ' + path.basename(relativeFixture) + '\', function(done) {\n' +
        '      var file = __dirname + \'/' + relativeFixture + '\';\n' +
        '      var fixture = require(file);\n' +
        '      var result = ' + method + '(';
      for (var j = 0; j < params.length; j++) {
        test += j ? ', ' : '';
        test += 'fixture.' + params[j];
      }
      test += ');\n' +
        '      if (fixture.result instanceof Object) {\n' +
        '        Object.keys(fixture.result).forEach(function (key) {\n' +
        '          expect(result[key]).to.deep.equal(fixture.result[key]);\n' +
        '        });\n' +
        '      }\n' +
        '      expect(result).to.deep.equal(fixture.result);\n' +
        '      done();\n' +
        '    });\n';
    }
  }
  return test;
};

skelgen._dummyAsyncMethod = function (param, cb) {
  if (!(param instanceof Object)) param = { };
  return cb(null, param.foo);
};

skelgen.goodInputTestsAsync = function (method, params, fileToTest) {
  var test = '';
  var comment = skelgen.commentBefore(method, fileToTest);
  var asserts = skelgen.assertsFrom(comment);
  if (asserts && asserts.length) {
    test += '    describe(\'good input\', function() {\n';
    for (var assertIndex = 0; assertIndex < asserts.length; assertIndex++) {
      var expected = asserts[assertIndex][2];
      test += '      it(\'test' + assertIndex + '\', function(done) {\n' +
        '        ' + method + '(' + (asserts[assertIndex][0] || 'undefined') + ', function (err, result) {\n' +
        '          assert.equal(err, null, \'expect no error; got \' + err);\n';
      if ((JSON.stringify(expected).length > 20) && (expected !== 'undefined')) {
        test += '          var expected = ' + expected + ';\n';
        expected = 'expected';
      }
      test += '          expect(result' + asserts[assertIndex][3] + ').to.deep.equal(' + expected + '); // goodInputTestsAsync\n' +
        '          done();\n' +
        '        });\n' +
        '      });\n';
    }
    test += '    });\n';
  }
  var fixtures = skelgen.fixturesFrom(comment);
  if (fixtures && fixtures.length && !args.output) {
    console.error('Fixtures only work with the --output option...');
  }
  if (fixtures && fixtures.length && args.output) {
    for (var fixtureIndex = 0; fixtureIndex < fixtures.length; fixtureIndex++) {
      var absoluteOutputFile = path.resolve(args.output);
      var absoluteFixture = path.resolve(path.dirname(fileToTest), fixtures[fixtureIndex]);
      var relativeFixture = path.relative(path.dirname(absoluteOutputFile), absoluteFixture);
      test += 
        '    \'handles fixture ' + relativeFixture + '\': function () {\n' +
        // '      // fileToTest = ' + fileToTest + '\n' +
        // '      // fixture = ' + fixtures[fixtureIndex] + '\n' +
        // '      // args.output = ' + args.output + '\n' +
        // '      // absoluteOutputFile = ' + absoluteOutputFile + '\n' +
        // '      // absoluteFixture = ' + absoluteFixture + '\n' +
        // '      // relativeFixture = ' + relativeFixture + '\n' +
        // '      // args.include = ' + args.include + '\n' +
        '        var file = __dirname + \'/' + relativeFixture + '\';\n' +
        // '        console.log(file);\n' +
        '        var fixture = require(file);\n' +
        // '        console.log(\'fixture is\', fixture);\n' +
        '        ' + method + '(';
      params.forEach(function(param) {
        test += 'fixture.' + param + ', ';
      });
      test += 'function (err, result) {\n' +
        '        var file = __dirname + \'/' + relativeFixture + '\';\n' +
        // '        console.log(file);\n' +
        '        var fixture = require(file);\n' +
        // '        console.log(\'' + method + ' returns\', err, result);\n' +
        '        expect(err).to.deep.equal(fixture.callback.err);\n' +
        // '        // relies on fixture having callback called "callback" - fix this!\n' +
        '        expect(result).to.deep.equal(fixture.callback.result);\n' +
        '      });\n' +
        '    }';
    }
  }
  return test;
};

skelgen.syncTests = function (method, methodParams, file) {
  if (typeof method !== 'string') {
    return null;
  }
  var test;
  if (!(methodParams instanceof Array)) {
    methodParams = [];
  }
  var params = methodParams;
  test = '  describe(\'' + skelgen.sanitise(method) + '\', function() {\n';
  test += skelgen.goodInputTests(method, params, file);
  if (skelgen.badInputs.length) {
    test += '    it(\'handles malformed input\', function() {\n';
    test += '      expect(function () {\n';
    skelgen.badInputs.forEach(function(badInput) {
      var data = skelgen.stringify(badInput);
      params = skelgen.map(methodParams, data);
      test += '        ' + method + '(' + params.join(', ') + ');\n';
    });
    test += '      }).not.to.throw();\n' +
      '    });\n';
  }
  test += '  });\n';
  return test;
};

skelgen.generate = function (params) {
  args = params instanceof Object ? params : {};
  if (!args.file && args._) args.file = args._[0];
  var requestedMethod = args.method;
  if (!args.file) {
    console.error('usage:\n\tnode', process.argv[1], '[file] [optional method] --output [outputfile]');
    return null;
  }
  args.file = path.resolve(args.file);
  var relativeFile = args.output ? './' + path.relative(path.dirname(args.output), args.file) : args.file;
  var name = skelgen.baseName(args.file);
  var Obj = require(args.file);
  var content = '\'use ' + 'strict\';\n';
  if (args.good) this.badInputs = []; // don't test bad inputs
  if (!args.hx) {
    content += '/**\n';
    if (args.comment) {
      content += ' * ' + ('' + args.comment).split('\\n').join('\n * ') + '\n *\n';
    }
    content += ' * generated by ' + process.argv + '\n' +
      ' * https://github.com/pauly/vows-skelgen\n' +
      ' * ' + new Date() + '\n */\n\n';
  }
  content += 'var expect = require(\'chai\').use(require(\'dirty-chai\')).expect;\n' +
    'var file = \'' + relativeFile + '\';\n' +
    'var ' + name + ' = require(file);\n\n';
  var fileLabel = relativeFile.split('/').pop();
  content += 'describe(\'' + fileLabel + '\', function() {\n';
  var gotFunctions = false;
  for (var method in Obj) {
    if (Obj.hasOwnProperty(method)) {
      if (Obj[method] instanceof Function) {
        if (requestedMethod && (requestedMethod !== method)) continue;
        content += skelgen.writeTests(name + '.' + method, Obj[method], args.file, args.output);
        gotFunctions = true;
      }
    }
  }
  if (typeof Obj === 'function') {
    var obj = new Obj();
    for (var key in obj) {
      if (obj[key] instanceof Function) {
        if (requestedMethod && (requestedMethod !== key)) continue;
        content += skelgen.writeTests('new ' + name + '().' + key, obj[key], args.file, args.output);
        gotFunctions = true;
      }
    }
  }
  if (!gotFunctions) {
    content += skelgen.writeTests(name, Obj, args.file, args.output) || '';
  }
  content += '\n});\n';
  if (!args.output) {
    console.log(content);
    return;
  }
  fs.writeFileSync(args.output, content);
};
