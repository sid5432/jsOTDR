#!/usr/local/bin/node
require('asyncawait');
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var status = 'nok';
    
    var tt = await parts.get_string(fh);
    
    if ( tt == 'Map' ) {
	results['format'] = 2;
        if (debug) {
	    logger("MAIN: bellcore 2.x version");
        }
    }else{
	results['format'] = 1;
        if (debug) {
	    logger("MAIN: bellcore 1.x version");
        }
	// rewind to start of file
	var pos = await fh.seek(0);
    }
    results['version'] = ((await parts.get_uint(fh, 2)) * 0.01).toFixed(2);

    // get number of bytes in map block
    results['mapblock'] = {};
    results['mapblock']['nbytes'] = await parts.get_uint(fh,4)
    
    if (debug) {
        logger(`MAIN: Version ${results['version']}, block size ${results['mapblock']['nbytes']} bytes; next position 0x${parts.tohex(await fh.tell())}`);
    }
    
    // get number of block; not including the Map block
    results['mapblock']['nblocks'] = await parts.get_uint(fh, 2) - 1
    
    if (debug) {
        logger(`MAIN: ${results['mapblock']['nblocks']} blocks to follow; next position 0x${parts.tohex(await fh.tell())}`);
        logger(parts.divider);
    }

    // get block information
    if (debug) {
        logger("MAIN: BLOCKS:");
    }
    
    results['blocks'] = {};
    var startpos = results['mapblock']['nbytes'];

    for(var i=0; i <results['mapblock']['nblocks']; i++ ) {
        var bname = await parts.get_string(fh)
        var bver  = ((await parts.get_uint(fh,2)) * 0.01).toFixed(2);
        var bsize = await parts.get_uint(fh,4);
        
        var ref = { 'name': bname, 'version': bver, 'size': bsize, 'pos': startpos, 'order': i };
        results['blocks'][bname] = ref;
        
        if (debug) {
            logger(`MAIN: ${bname} block: version ${bver},`);
            logger(`block size ${bsize} bytes,`);
            logger(`start at pos 0x${parts.tohex(startpos)}`);
        }
        // start position of next block
        startpos += bsize
    }

    if (debug) {
        logger(parts.divider+"\n");
        logger(`MAIN: next position 0x${parts.tohex(await fh.tell())}`);
        logger(parts.divider+"\n\n");
    }
    status = 'ok'
    
    return status;
});

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var MapBlock = function()
{
	this.process = process;
	
}

module.exports = MapBlock;
