#!/usr/bin/env node
'use strict';
var skelgen = require('./lib/skelgen');
skelgen.generate();
process.exit(0); // eslint-disable-line no-process-exit
