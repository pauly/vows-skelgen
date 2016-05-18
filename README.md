# js-skelgen

Skeleton test generator. 
Looks in your file for public methods, and writes skeleton tests for them.

## installation

    git clone https://github.com/pauly/js-skelgen.git
    cd js-skelgen
    npm install

## usage

save your tests to a file

    skelgen.js lib/skelgen.js --output test/skelgen.js && mocha test/generate.js # writes relative paths into the file

or test just one method

    skelgen.js lib/skelgen.js --method generate --output test/generate.js && mocha test/generate.js

## Tests

skelgen tests itself:

    npm test

## JSDoc style tests DEPRACATED

I thought this was a great idea, no-one agreed...

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

## todo

 * package it up
 * have an option to create the file from the tests instead?
