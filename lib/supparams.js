#!/usr/local/bin/node
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var bname = "SupParams";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "supparam.process():"
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

    // version 1 and 2 are the same
    status = await process_supparam(fh, results, logger, errlog, debug);

    // read the rest of the block (just in case)
    /*
    var endpos = results['blocks'][bname]['pos'] + results['blocks'][bname]['size']
    await fh.read( endpos - (await fh.tell()) )
    status = 'ok';
    */
    
    return status;
});

// ================================================================
var process_supparam = async function(fh, results, logger, errlog, debug) {
    // process SupParams fields
    var bname = "SupParams";
    var xref  = results[bname];
    
    var fields = [
        "supplier", // ............. 0
        "OTDR", // ................. 1
        "OTDR S/N", // ............. 2
        "module", // ............... 3
        "module S/N", // ........... 4
        "software", // ............. 5
        "other", // ................ 6
    ];
    
    var count = 0
    for(let i in fields ) {
	let field = fields[i];
        let xstr = await parts.get_string(fh);
        if (debug) {
            logger(`${sep} ${count}. ${field}: ${xstr}`);
        }
        xref[field] = xstr;
        count += 1
    }
    var status = 'ok'
    
    return status;
};

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var SupParams = function()
{
    this.process = process;
}

module.exports = SupParams;
