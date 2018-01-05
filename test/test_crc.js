#!/usr/local/bin/node
const assert = require('assert'),
	crc = require('crc');

describe('Cksum', function() {
	
	describe('CRC16-CCITT-false sanity check', function() {
		it('Check if equal to 2B91', function() {
			var tt = crc.crc16ccitt("123456789").toString(16);
			// console.log( tt );
			assert.equal(tt,'29b1');
		});
	});
});

	 
