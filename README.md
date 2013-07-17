# vows-skelgen

Vows skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## usage

    node skelgen.js [input file] > [test file]

## tests

skelgen tests itself:

    node skelgen.js lib/skelgen.js | node

## todo

 * parse original file for comments with @assert in them?
