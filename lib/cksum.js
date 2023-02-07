#!/usr/local/bin/node
const crc = require('crc');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var bname = "Cksum";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "cksum.process():"
    var ref = null;
    var status = 'nok'

    try {
        ref = results['blocks'][bname];
        startpos = ref['pos'];
        await fh.seek( startpos );
    }catch(e){
        errlog( pname+" "+bname+"block starting position unknown");
        return status;
    }

    format = results['format'];
    
    if (format == 2) {
        var mystr = await parts.get_string(fh, hsize);

        if ( mystr != bname ) {
            errlog(pname+" incorrect header '"+mystr+"' vs '"+bname+"'");
	    return status;
	}
    }
    
    results[bname] = {};
    var xref = results[bname];
    var csum = xref['checksum'] = await parts.get_uint(fh, 2); // need to get this first because ourdigest() rewinds!
    var digest = xref['checksum_ours'] = await ourdigest(fh, logger, errlog, debug);

    var verdict;
    if (digest == csum) {
        xref['match'] = true;
        verdict = "MATCHES!"
    }else{
        xref['match'] = false;
        verdict = "DOES NOT MATCH!";
    }

    if (debug) {
        logger(`${sep} checksum from file ${csum} (0x${parts.tohex(csum)})`);
        logger(`${sep} checksum calculated ${digest} (0x${parts.tohex(digest)}) ${verdict}`);
    }
    status = 'ok'
    return status
    
});

var ourdigest = (async function(fh, logger, errlog, debug) {
    var digest = 0;
    // rewind
    await fh.seek(0);
    var size = await fh.size();
    
    var buffer = await fh.read(size-2);
    var digest = crc.crc16ccitt(buffer); // .toString(16);
    
    return digest;
});

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var Cksum = function()
{
    this.process = process;
}

module.exports = Cksum;
