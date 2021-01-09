'use strict'

/**
 * Vows skeleton test generator
 * https://github.com/pauly/vows-skelgen
 *
 * @author PC <paulypopex@gmail.com>
 */

const fs = require('fs')
const path = require('path')
let args = {}

const skelgen = module.exports = {}

skelgen.badInputs = [66, null, [], { }]

/**
 * @returns string
 * @assert ('foo') === 'foo'
 * @assert (66) === '66'
 * @assert ('foo \'bar\'') === 'foo bar'
 */
skelgen.sanitise = function (string) {
  return ('' + string).replace(/'/g, '')
}

/**
 * @assert ('foo') === 'foo'
 * @assert (66) === '66'
 * @assert ('new foo()') === 'foo'
 * @assert ('new foo()') === 'foo'
 */
skelgen.uninstantiate = function (string) {
  return ('' + string)
    .replace(/(new |\(\s*\))/g, '')
    .replace(/\./g, '(.prototype)?.')
}

/**
 * @assert ('foo/bar.js') === 'bar'
 * @assert ('foo/bar') === 'bar'
 * @assert ('foo.js') === 'foo'
 * @assert ('foo') === 'foo'
 */
skelgen.baseName = function (file) {
  file = '' + file
  const base = file.substring(file.lastIndexOf('/') + 1)
  if (base.lastIndexOf('.') === -1) {
    return base
  }
  return base.substring(0, base.lastIndexOf('.'))
}

skelgen.writeTests = function (method, obj, file) {
  if (!obj || typeof obj !== 'function') {
    return null
  }
  let methodParams = []
  const match = /\((.+)\)/.exec(obj.toString())
  const _map = function (a) {
    return a.trim()
  }
  if (match && match.length > 0) {
    methodParams = match.pop()
      .split(',')
      .map(_map)
  }
  const last = methodParams[methodParams.length - 1]
  if (last === 'callback' || last === 'cb' || last === 'next') {
    methodParams.pop()
    return skelgen.asyncTests(method, methodParams, file)
  }
  return skelgen.syncTests(method, methodParams, file)
}

/**
 * @assert (66) === '66'
 * @assert ('foo') === '\'foo\''
 */
skelgen.stringify = function (data) {
  if (data === undefined) return 'undefined'
  if (data instanceof Function) return 'function () { }'
  data = JSON.stringify(data)
    .replace(/"/g, '\'')
    .replace(/'new Date\(\)'/, 'new Date()')
    .replace(/'function\s*\(\s*\)\s*{\s*}'/, 'function () { }')
  return data
}

/**
 * @assert ([], 'foo') === ['foo']
 * @assert ([1], 'foo') === ['foo']
 * @assert (['bar'], 'foo') === ['foo']
 * @assert ([1, 2, 3], 'foo') === ['foo', 'foo', 'foo']
 */
skelgen.map = function (methodParams, data) {
  if (!(methodParams instanceof Array)) return [data]
  const params = methodParams.map(function () {
    return data
  })
  if (params.length) return params
  return [data]
}

skelgen.asyncTests = function (method, methodParams, file) {
  if (!(methodParams instanceof Array)) {
    methodParams = []
  }
  const label = skelgen.sanitise(method)
  let test = '  describe(\'' + label + '\', function () {\n'
  test += skelgen.goodInputTestsAsync(method, methodParams, file)
  if (skelgen.badInputs.length) {
    test += '    describe(\'malformed input\', function () {\n'
    for (let i = 0; i < skelgen.badInputs.length; i++) {
      const data = skelgen.stringify(skelgen.badInputs[i])
      const params = skelgen.map(methodParams, data)
      test += '      it(\'handles ' + skelgen.sanitise(data) + '\', function (done) {\n' +
        '        ' + method + '(' + params.join(', ') + ', function () {\n' +
        '          expect(true).to.be.true()\n' +
        '          done()\n' +
        '        })\n' +
        '      })\n'
    }
    test += '    })\n'
  }
  test += '  })\n'
  return test
}

/**
 * @assert ('foo', 'bar') === null
 */
skelgen.commentBefore = function (method, file) {
  if (typeof file !== 'string') return null
  if (!fs.existsSync(file)) return null
  const data = fs.readFileSync(file, 'utf8')
  const commentRegex = '^((\\/\\*\\*)[\\s\\S]+?\\*\\/)\\s+'
  method = skelgen.uninstantiate(method)
  const regex = new RegExp(commentRegex + '(var)?' + skelgen.sanitise(method) + '\\W', 'gm')
  const comments = regex.exec(data)
  if (comments && comments[1]) {
    return comments[1].substr(comments[1].lastIndexOf(comments[2]))
  }
  return null
}

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
  const optionalBit = '[\\[\\]\\.\\w]+' // match dot, letters, numbers and square brackets
  const regex = new RegExp('^\\s+\\*\\s+@' + 'assert\\s+\\((.+)\\)(' + optionalBit + ')?\\s+(={2,3})\\s+(.+?)$', 'gm')
  let match = regex.exec(comment)
  const asserts = []
  while (match !== null) {
    const optionalKey = (match[2] || '').trim() // optional key to find in result
    asserts.push([('' + match[1]).trim(), match[3], ('' + match[4]).trim(), optionalKey])
    match = regex.exec(comment)
  }
  return asserts
}

/**
 * @assert (' * @fixture ./foo.js\n * @fixture ../foo/bar.js ') === ['./foo.js', '../foo/bar.js']
 */
skelgen.fixturesFrom = function (comment) {
  const regex = /^\s+\*\s+@fixture\s+(.+)$/gm
  let match = regex.exec(comment)
  const fixtures = []
  while (match !== null) {
    fixtures.push(match[1].trim())
    match = regex.exec(comment)
  }
  return fixtures
}

skelgen.goodInputTests = function (method, params) {
  const comment = skelgen.commentBefore(method, args.file)
  const asserts = skelgen.assertsFrom(comment)
  let i
  let test = ''
  if (asserts && asserts.length) {
    test += '    it(\'handles good input\', function () {\n'
    let declareExpected = true
    const longAsserts = asserts.filter(assert => assert[2] !== 'undefined' && assert[2].length > 20)
    for (i = 0; i < asserts.length; i++) {
      let expected = asserts[i][2]
      if ((JSON.stringify(expected).length > 20) && (expected !== 'undefined')) {
        test += '      '
        if (longAsserts.length === 1) {
          test += 'const '
        } else if (declareExpected) {
          test += '/* ' + asserts.length + ' asserts, ' + longAsserts.length + ' long asserts */ let '
        }
        test += 'expected = ' + expected + '\n'
        expected = 'expected'
        declareExpected = false
      }
      test += '      expect(' + method + '(' + asserts[i][0] + ')' + asserts[i][3] + ').to.deep.equal(' + expected + ') // goodInputTests\n'
    }
    test += '    })\n'
  } else {
    test += '    // it(\'does something\', function () {\n'
    let paramsForTest = params
    if (params && params.join) paramsForTest = params.join(', ')
    test += '    //   expect(' + method + '(' + paramsForTest + ')).to.be.ok()\n'
    test += '    // })\n'
  }
  const fixtures = skelgen.fixturesFrom(comment)
  if (fixtures && fixtures.length && !args.output) {
    console.error('Fixtures only work with the --output option...')
  }
  if (fixtures && fixtures.length && args.output) {
    for (i = 0; i < fixtures.length; i++) {
      const absoluteOutputFile = path.resolve(args.output)
      const absoluteFixture = path.resolve(path.dirname(args.file), fixtures[i])
      const relativeFixture = path.relative(path.dirname(absoluteOutputFile), absoluteFixture)
      test += '    it(\'handles fixture ' + path.basename(relativeFixture) + '\', function (done) {\n' +
        '      const file = __dirname + \'/' + relativeFixture + '\'\n' +
        '      const fixture = require(file)\n' +
        '      const result = ' + method + '('
      for (let j = 0; j < params.length; j++) {
        test += j ? ', ' : ''
        test += 'fixture.' + params[j]
      }
      test += ')\n' +
        '      if (fixture.result instanceof Object) {\n' +
        '        Object.keys(fixture.result).forEach(function (key) {\n' +
        '          expect(result[key]).to.deep.equal(fixture.result[key])\n' +
        '        })\n' +
        '      }\n' +
        '      expect(result).to.deep.equal(fixture.result)\n' +
        '      done()\n' +
        '    })\n'
    }
  }
  return test
}

skelgen._dummyAsyncMethod = function (param, cb) {
  if (!(param instanceof Object)) param = { }
  return cb(null, param.foo)
}

skelgen.goodInputTestsAsync = function (method, params, fileToTest) {
  let test = ''
  const comment = skelgen.commentBefore(method, fileToTest)
  const asserts = skelgen.assertsFrom(comment)
  if (asserts && asserts.length) {
    test += '    describe(\'good input\', function () {\n'
    for (let assertIndex = 0; assertIndex < asserts.length; assertIndex++) {
      let expected = asserts[assertIndex][2]
      test += '      it(\'test' + assertIndex + '\', function (done) {\n' +
        '        ' + method + '(' + (asserts[assertIndex][0] || 'undefined') + ', function (err, result) {\n' +
        '          expect(err, \'expect no error; got \' + err).to.be.null()\n'
      if ((JSON.stringify(expected).length > 20) && (expected !== 'undefined')) {
        test += '          const expected = ' + expected + '\n'
        expected = 'expected'
      }
      test += '          expect(result' + asserts[assertIndex][3] + ').to.deep.equal(' + expected + ') // goodInputTestsAsync\n' +
        '          done()\n' +
        '        })\n' +
        '      })\n'
    }
    test += '    })\n'
  }
  const fixtures = skelgen.fixturesFrom(comment)
  if (fixtures && fixtures.length && !args.output) {
    console.error('Fixtures only work with the --output option...')
  }
  if (fixtures && fixtures.length && args.output) {
    for (let fixtureIndex = 0; fixtureIndex < fixtures.length; fixtureIndex++) {
      const absoluteOutputFile = path.resolve(args.output)
      const absoluteFixture = path.resolve(path.dirname(fileToTest), fixtures[fixtureIndex])
      const relativeFixture = path.relative(path.dirname(absoluteOutputFile), absoluteFixture)
      test +=
        '    \'handles fixture ' + relativeFixture + '\': function () {\n' +
        // '      // fileToTest = ' + fileToTest + '\n' +
        // '      // fixture = ' + fixtures[fixtureIndex] + '\n' +
        // '      // args.output = ' + args.output + '\n' +
        // '      // absoluteOutputFile = ' + absoluteOutputFile + '\n' +
        // '      // absoluteFixture = ' + absoluteFixture + '\n' +
        // '      // relativeFixture = ' + relativeFixture + '\n' +
        // '      // args.include = ' + args.include + '\n' +
        '        const file = __dirname + \'/' + relativeFixture + '\'\n' +
        // '        console.log(file)\n' +
        '        const fixture = require(file)\n' +
        // '        console.log(\'fixture is\', fixture)\n' +
        '        ' + method + '('
      params.forEach(function (param) {
        test += 'fixture.' + param + ', '
      })
      test += 'function (err, result) {\n' +
        '        const file = __dirname + \'/' + relativeFixture + '\'\n' +
        // '        console.log(file)\n' +
        '        const fixture = require(file)\n' +
        // '        console.log(\'' + method + ' returns\', err, result)\n' +
        '        expect(err).to.deep.equal(fixture.callback.err)\n' +
        // '        // relies on fixture having callback called "callback" - fix this!\n' +
        '        expect(result).to.deep.equal(fixture.callback.result)\n' +
        '      })\n' +
        '    }'
    }
  }
  return test
}

skelgen.syncTests = function (method, methodParams, file) {
  if (typeof method !== 'string') {
    return null
  }
  let test
  if (!(methodParams instanceof Array)) {
    methodParams = []
  }
  let params = methodParams
  test = '  describe(\'' + skelgen.sanitise(method) + '\', function () {\n'
  test += skelgen.goodInputTests(method, params, file)
  if (skelgen.badInputs.length) {
    test += '    it(\'handles malformed input\', function () {\n'
    test += '      expect(function () {\n'
    skelgen.badInputs.forEach(function (badInput) {
      const data = skelgen.stringify(badInput)
      params = skelgen.map(methodParams, data)
      test += '        ' + method + '(' + params.join(', ') + ')\n'
    })
    test += '      }).not.to.throw()\n' +
      '    })\n'
  }
  test += '  })\n'
  return test
}

skelgen.generate = function (params) {
  args = params instanceof Object ? params : {}
  if (!args.file && args._) args.file = args._[0]
  const requestedMethod = args.method
  if (!args.file) {
    console.error('usage:\n\tnode', process.argv[1], '[file] [optional method] --output [outputfile]')
    return null
  }
  args.file = path.resolve(args.file)
  const relativeFile = args.output ? './' + path.relative(path.dirname(args.output), args.file) : args.file
  const name = skelgen.baseName(args.file)
  const Obj = require(args.file)
  let content = '\'use ' + 'strict\'\n'
  if (args.good) this.badInputs = [] // don't test bad inputs
  if (!args.hx) {
    content += '/**\n'
    if (args.comment) {
      content += ' * ' + ('' + args.comment).split('\\n').join('\n * ') + '\n *\n'
    }
    content += ' * generated by ' + process.argv + '\n' +
      ' * https://github.com/pauly/vows-skelgen\n' +
      ' * ' + new Date() + '\n */\n\n'
  }
  content += 'const expect = require(\'chai\').use(require(\'dirty-chai\')).expect\n' +
    'const file = \'' + relativeFile + '\'\n' +
    'const ' + name + ' = require(file)\n\n'
  const fileLabel = relativeFile.split('/').pop()
  content += 'describe(\'' + fileLabel + '\', function () {\n'
  let gotFunctions = false
  for (const method in Obj) {
    if (Obj[method] instanceof Function) {
      if (requestedMethod && (requestedMethod !== method)) continue
      content += skelgen.writeTests(name + '.' + method, Obj[method], args.file, args.output)
      gotFunctions = true
    }
  }
  if (typeof Obj === 'function') {
    const obj = new Obj()
    for (const key in obj) {
      if (obj[key] instanceof Function) {
        if (requestedMethod && (requestedMethod !== key)) continue
        content += skelgen.writeTests('new ' + name + '().' + key, obj[key], args.file, args.output)
        gotFunctions = true
      }
    }
  }
  if (!gotFunctions) {
    content += skelgen.writeTests(name, Obj, args.file, args.output) || ''
  }
  content += '})\n'
  if (!args.output) {
    console.log(content)
    return
  }
  fs.writeFileSync(args.output, content)
}
