# js-skelgen

Node skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## installation

    git clone https://github.com/pauly/js-skelgen.git
    cd js-skelgen
    npm install -g mocha
    npm install

## usage

save your tests to a file

    skelgen.js lib/skelgen.js --output test/skelgen.js && mocha $_ # writes relative paths into the file
    skelgen.js lib/skelgen.js > test/skelgen.js && mocha $_ # writes absolute paths into the file
    mocha test/skelgen.js
 
or to test just one method

    skelgen.js lib/skelgen.js --method generate --output test/generate.js && mocha $_

## tests

skelgen tests itself:

    node skelgen.js lib/skelgen.js --output test/skelgen.js && mocha $_

## todo

 * package it up
 * have an option to create the file from the tests instead

## history

Previously known as https://github.com/pauly/vows-skelgen
