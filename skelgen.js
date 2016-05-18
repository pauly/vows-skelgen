#!/usr/bin/env node
'use strict';
var skelgen = require('./lib/skelgen');
var args = require('minimist')(process.argv.slice(2));
skelgen.generate(args);
process.exit(0); // eslint-disable-line no-process-exit
