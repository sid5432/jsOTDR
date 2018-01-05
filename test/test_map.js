#!/usr/local/bin/node
const assert = require('assert');
const path = require('path');

const SOR = require( path.join(__dirname, '../jsOTDR.js') ),
      sor = new SOR;

describe('MapBlock', function() {
    var filepath1 = path.join(__dirname,'../data/demo_ab.sor');
    // var filepath2 = path.join(__dirname,'../data/sample1310_lowDR.sor');

    it('check map block', async function() {
	var debug = false;
	var stash = await sor.reader( filepath1, debug );
	assert.notEqual( stash, null );
	var status  = stash[0];
	var results = stash[1];
	assert.equal( status, 'ok' );

	// map block
	var ref = results['blocks'];
	assert.equal( ref['Cksum']['pos'] ,25706 );
	assert.equal( ref['Cksum']['version'] , "1.00");
	
	assert.equal( ref['DataPts']['pos'] ,328 );
	assert.equal( ref['DataPts']['size'], 23564);
    });

});
