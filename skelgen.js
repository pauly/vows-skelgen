#!/usr/bin/env node

const skelgen = require('./lib/skelgen')
const args = require('minimist')(process.argv.slice(2))
skelgen.generate(args)
process.exit(0) // eslint-disable-line no-process-exit
