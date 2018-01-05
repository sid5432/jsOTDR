#!/usr/local/bin/node
require('asyncawait');
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var bname = "GenParams";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "genparam.process():"
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
            return status
	}
    }
    
    results[bname] = {};
    var xref = results[bname];
    
    if (format == 1) {
        status = await process1(fh, results, logger, errlog, debug);
    }else{
        status = await process2(fh, results, logger, errlog, debug);
    }
    
    return 'ok';
});

// ================================================================
var build_condition = async function (bcstr) {
    // decode build condition
    if (bcstr == 'BC') {
        bcstr += " (as-built)";
    }else if (bcstr == 'CC') {
        bcstr+= " (as-current)";
    }else if (bcstr == 'RC') {
        bcstr+= " (as-repaired)";
    }else if (bcstr == 'OT') {
        bcstr+= " (other)";
    }else{
        bcstr+= " (unknown)";
    }
    return bcstr;
};

// ================================================================
var fiber_type = async function (val) {
    /*
     * decode fiber type 
     * REF: http://www.ciscopress.com/articles/article.asp?p=170740&seqNum=7
     */
    var fstr;
    if (val == 651) { // ITU-T G.651
        fstr = "G.651 (50um core multimode)";
    }else if (val == 652) { // standard nondispersion-shifted 
        fstr = "G.652 (standard SMF)";
	// G.652.C low Water Peak Nondispersion-Shifted Fiber            
    }else if (val == 653) {
        fstr = "G.653 (dispersion-shifted fiber)";
    }else if (val == 654) {
        fstr = "G.654 (1550nm loss-minimzed fiber)";
    }else if (val == 655) {
        fstr = "G.655 (nonzero dispersion-shifted fiber)";
    }else{
        fstr = `${val} (unknown)`;
    }
    return fstr;
};

// ================================================================
var process1 = (async function(fh, results, logger, errlog, debug) {
    // process version 1 format
    var bname = "GenParams";
    var xref  = results[bname];
    
    var lang = await fh.readString(2);
    xref['language'] = lang;
    if (debug) {
        logger(`${sep}  language: '${lang}', next pos ${await fh.tell()}`)
    }

    var fields = [
        "cable ID",    // ........... 0
        "fiber ID",    // ........... 1
        "wavelength",  // ............2: fixed 2 bytes value
        
        "location A",  // ........... 3
        "location B",  // ........... 4
        "cable code/fiber type", //.. 5
        "build condition", // ....... 6: fixed 2 bytes char/string
        "user offset", // ........... 7: fixed 4 bytes (Andrew Jones)
        "operator",    // ........... 8
        "comments",    // ........... 9
    ];
    
    var count = 0
    // fields.forEach( async function(field) { // !!! not async
    for( var i in fields ) {
	var field = fields[i];
	
        if (field == 'build condition') {
            xstr = await build_condition( await fh.read(2) );
        }else if (field == 'wavelength') {
            val = await parts.get_uint(fh, 2);
            xstr = `${val} nm`;
        }else if (field == "user offset") {
            val = await parts.get_signed(fh, 4)
            xstr = parseInt(val, 10).toString();
        }else{
            xstr = await parts.get_string(fh);
        }
        if (debug ) {
            logger(`${sep} ${count}. ${field}: ${xstr}`);
        }
        xref[field] = xstr;
        count += 1
    }
    
    status = 'ok';
    return status;
});

// ================================================================
var process2 = (async function(fh, results, logger, errlog, debug) {
    // process version 2 format
    var bname = "GenParams";
    var xref  = results[bname];
    
    var lang = await fh.readString(2);
    xref['language'] = lang;
    if (debug) {
        logger(`${sep}  language: '${lang}', next pos ${await fh.tell()}`);
    }    
    var fields = [
        "cable ID",    // ........... 0
        "fiber ID",    // ........... 1
        
        "fiber type",  // ........... 2: fixed 2 bytes value
        "wavelength",  // ............3: fixed 2 bytes value
        
        "location A", // ............ 4
        "location B", // ............ 5
        "cable code/fiber type", // ............ 6
        "build condition", // ....... 7: fixed 2 bytes char/string
        "user offset", // ........... 8: fixed 4 bytes int (Andrew Jones)
        "user offset distance", // .. 9: fixed 4 bytes int (Andrew Jones)
        "operator",    // ........... 10
        "comments",    // ........... 11
    ];

    var count = 0;
    for(let i in fields ) {
	let field = fields[i];
        if ( field == 'build condition' ) {
            xstr = await build_condition( await fh.read(2) );
        }else if (field == 'fiber type') {
            val = await parts.get_uint(fh, 2);
            xstr = await fiber_type( val );
        }else if (field == 'wavelength') {
            val = await parts.get_uint(fh, 2);
            xstr = `${val} nm`;
        }else if (field == "user offset" || field == "user offset distance") {
            val = await parts.get_signed(fh, 4);
            xstr = parseInt(val, 10).toString();
	}else{
            xstr = await parts.get_string(fh);
        }
        if (debug) {
            logger(`${sep} ${count}. ${field}: ${xstr}`);
        }
        xref[field] = xstr;
        count += 1
    }
    status = 'ok';
    
    return status;
});

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var GenParams = function()
{
	this.process = process;
	
}

module.exports = GenParams;
