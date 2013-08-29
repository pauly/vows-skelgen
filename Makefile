SHELL = /bin/bash
DIR = $(shell echo "`pwd`")
test:
	./skelgen.js lib/skelgen.js --output test/skelgen.js && node test/skelgen.js

install:
	echo $(DIR)/skelgen.js > /usr/local/bin/skelgen && chmod +x /usr/local/bin/skelgen

.PHONY: test
