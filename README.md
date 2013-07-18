# vows-skelgen

Vows skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## usage
    git clone https://github.com/pauly/vows-skelgen.git
    cd vows-skelgen
    npm install
    node skelgen.js lib/skelgen.js > test/skelgen.js

## tests

skelgen tests itself:

    node skelgen.js lib/skelgen.js | node

## todo

 * package it up
 * detect methods in an instantiated file
   * test files starting with a capital letter that return a function?
 * parse original file for comments with @assert in them?
 * have an option to create the file from the tests instead
