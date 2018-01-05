#!/usr/local/bin/node
const assert = require('assert'),
      path   = require('path'),
      fs     = require('fs');
const lodash = require('lodash');

const SOR = require( path.join(__dirname, '../jsOTDR.js') ),
      sor = new SOR;

describe('Parse File', function() {
    var filepath1 = path.join(__dirname,'../data/demo_ab.sor');
    var filepath2 = path.join(__dirname,'../data/sample1310_lowDR.sor');
    var filepath3 = path.join(__dirname,'../data/M200_Sample_005_S13.sor');

    it('compare parsed results 1', async function() {
	return compare(filepath1);
    });
    
    it('compare parsed results 2', async function() {
	return compare(filepath2);
    });

    it('compare parsed results 3', async function() {
	return compare(filepath3);
    });

});

var compare = (async function(sorfile) {
    
    var debug = false;
    var stash = await sor.reader( sorfile, debug );
    assert.notEqual( stash, null );
    var status  = stash[0];
    var results = stash[1];
    var trace   = stash[2];
    assert.equal( status, 'ok' );

    // load and compare JSON file
    var bsname = path.basename(sorfile,'.sor');

    var jsonfile = path.join(__dirname,"../data/"+bsname+"-dump.json" );
    var oldresults = JSON.parse( fs.readFileSync(jsonfile, "ASCII") );
    assert.notEqual( oldresults, null );
    
    assert.equal( results['format'], oldresults['format'] );
    assert.equal( results['version'], oldresults['version'] );
    var tt = lodash.isEqual( results, oldresults );
    if ( tt ) {
	assert( tt );
    }else{ // try to get more information
	assert.equal( results, oldresults );
    }

    // load and compare trace data
    var tracefile = path.join(__dirname,"../data/"+bsname+"-trace.dat" );
    fs.readFile(tracefile, "ASCII", function(err,data) {
	
	var t2 = data.split("\n");
	var nn = t2.length - 1;
	assert.equal( nn, trace.length );
	
	for(let i=0; i<nn; i++) {
	    assert.equal( trace[i], t2[i] );
	}
    });
    
});
