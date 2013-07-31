# vows-skelgen

Vows skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## installation

    git clone https://github.com/pauly/vows-skelgen.git
    cd vows-skelgen
    npm install

## usage

to give your module a punishment beating without saving the skeleton test

    skelgen.js lib/skelgen.js | node

or to test just one method

    skelgen.js lib/skelgen.js generate | node

to save your tests to a file

    skelgen.js lib/skelgen.js --output test/skelgen.js # writes relative paths into the file
    skelgen.js lib/skelgen.js > test/skelgen.js # writes absolute paths into the file

you can also use the --method param as above

    skelgen.js lib/skelgen.js --method generate > test/generate.js

## tests

skelgen tests itself:

    node skelgen.js lib/skelgen.js | node

## todo

 * package it up
 * have an option to create the file from the tests instead
