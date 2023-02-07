#!/usr/local/bin/node
const assert = require('assert');
const path = require('path'),
      BF = require('binary-file');
const Parts = require('../lib/parts');
var parts = new Parts;

describe('Parts', function() {
    var filepath1 = path.join(__dirname,'../data/demo_ab.sor');
    var filepath2 = path.join(__dirname,'../data/sample1310_lowDR.sor');
    
    it('get file handle', async function() {
	var fh = new BF( filepath2,'r',true); // little-endian
	await fh.open();
	
	assert.notEqual(fh,null);
	await fh.close();
	// console.log('* file closed (get file handle)');
    });
    
    it('Check get string', async function() {
	var fh = new BF( filepath2,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);
	
	var mystr = await parts.get_string(fh);
	assert.equal(mystr, 'Map');
	fh.close();
	// console.log('* file closed (get string)');
    });

    it('Check get uint and rewind', async function() {
	var fh = new BF( filepath1,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);

	var val = await parts.get_uint(fh,2);
	assert.equal(val, 100);
	val = await parts.get_uint(fh,4);
	assert.equal(val, 148);
	
	assert.equal( (await fh.tell()), 6 );

        // test rewind
	var pos = await fh.seek(0);
	
	var val = await parts.get_uint(fh,2);
	assert.equal(val, 100);
	val = await parts.get_uint(fh,4);
	assert.equal(val, 148);
	
	assert.equal( (await fh.tell()), 6 );
	
	await fh.close();
    });

    it('Check get hex', async function() {
	var fh = new BF( filepath1,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);
	
	var val = await parts.get_hex(fh,8);
	
	assert.equal(val, "64 00 94 00 00 00 0A 00 ");
	await fh.close();
    });

    it('Check get signed', async function() {
	var fh = new BF( filepath2,'r',true); // little-endian
	await fh.open();
	assert.notEqual(fh,null);

	await fh.seek(461);
	var val = await parts.get_signed(fh,2);
	assert.equal(val, 343);

	var val = await parts.get_signed(fh,2);
	assert.equal(val, 22820);
	
	var val = await parts.get_signed(fh,4);
	assert.equal(val, -38395);

	await fh.close();
    });    
});
