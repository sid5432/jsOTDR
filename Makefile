REPORTER = spec

all: jshint test

clean:
	rm -f Makefile.bak *-trace.dat *~ */*~ *-dump.json

test:
	npm test

jshint:
	jshint lib test jsOTDR.js

tests: test

test1:
	./lib/test_drive.js test1

test2:
	./lib/test_drive.js test2

tap:
	@NODE_ENV=test /usr/local/bin/mocha -R tap > results.tap

unit:
	@NODE_ENV=test /usr/local/bin/mocha --recursive -R xunit > results.xml --timeout 3000

.PHONY: test tap unit jshint 
