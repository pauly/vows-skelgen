# vows-skelgen

Vows skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## installation

    git clone https://github.com/pauly/vows-skelgen.git
    cd vows-skelgen
    npm install

## usage

    skelgen.js lib/skelgen.js > test/skelgen.js

## tests

skelgen tests itself:

    node skelgen.js lib/skelgen.js | node

## todo

 * package it up
 * parse original file for comments with @assert in them?
 * have an option to create the file from the tests instead
