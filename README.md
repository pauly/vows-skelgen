# js-skelgen

Skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## installation

    git clone https://github.com/pauly/js-skelgen.git
    cd js-skelgen
    npm install
    sudo make install

you need sudo to write to /usr/local/bin - see the Makefile

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

## Tests

Write phpdoc style comment blocks (with /** to start) to generate tests, like

    /**
     * @assert ( 'foo' ) === 'bar'
     */

Also link to your fixtures in the same way (bit wacky maybe)

    /**
     * @assert ( 'foo' ) === 'bar'
     * @fixture ../test/fixture/foo.js
     */

The path of the fixture should be relative to the file it is referenced in.
Then when you create the output file (with --output) it will work out the path
of the fixture relative to the output file.
Fixtures only work if you use the --output option.

skelgen tests itself:

    skelgen lib/skelgen.js --mochaRunner ./mochaRunner.js --output test/skelgen.js && node $_

## todo

 * package it up
 * have an option to create the file from the tests instead
