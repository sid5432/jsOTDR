#!/usr/local/bin/node
const assert = require('assert'),
	crc = require('crc');
const path = require('path'),
      BF = require('binary-file');

const SOR = require( path.join(__dirname, '../jsOTDR.js') ),
      sor = new SOR;

describe('Cksum', function() {
    var filepath1 = path.join(__dirname,'../data/demo_ab.sor');
    var filepath2 = path.join(__dirname,'../data/sample1310_lowDR.sor');
    
    it('CRC16-CCITT-false sanity check (should equal 2B91)', function() {
	var tt = crc.crc16ccitt("123456789").toString(16);
	// console.log( tt );
	assert.equal(tt,'29b1');
    });

    it('check file 1', async function() {
	var fh = new BF( filepath1,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);
	
	var size = await fh.size();
	assert.equal(size, 25708);
	
	var buffer = await fh.read(size-2);
	var digest = crc.crc16ccitt(buffer); // .toString(16);
	assert.equal(digest, 38827);
	
	await fh.close();

	// check against file
	var debug = false;
	var stash = await sor.reader( filepath1, debug );
	var results = stash[1];
	assert.equal( results['Cksum']['checksum_ours'], 38827 );
	assert.equal( results['Cksum']['checksum'], 38827 );
	
    });

    it('check file 2', async function() {
	var fh = new BF( filepath2,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);
	
	var size = await fh.size();
	assert.equal(size, 32133);
	
	var buffer = await fh.read(size-2);
	var digest = crc.crc16ccitt(buffer); // .toString(16);
	assert.equal(digest, 62998);
	
	await fh.close();

	// check against file
	var debug = false;
	var stash = await sor.reader( filepath2, debug );
	var results = stash[1];
	assert.equal( results['Cksum']['checksum_ours'], 62998 );
	assert.equal( results['Cksum']['checksum'], 59892 );
	
    });
    
});

	 
