#!/usr/local/bin/node
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var process = (async function(fh, results, tracedata, logger, errlog, debug=false)
{
    var bname = "DataPts";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "datapts.process():"
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

    // extra parameters
    xref['_datapts_params'] = { 'xscaling': 1, 'offset': 'STV' };
    // method used by STV: minimum reading shifted to zero
    // method used by AFL/Noyes Trace.Net: maximum reading shifted to zero (approx)

    status = await process_data(fh, results, tracedata, logger, errlog, debug);
    
    return status;
});

// ================================================================
var process_data = (async function(fh, results, tracedata, logger, errlog, debug) {
    
    var bname = "DataPts";
    var xref  = results[bname];

    try {
        // we assume SupParams block already processed
        model = results['SupParams']['OTDR'];
    }catch(e) {
        model = "";
    }
    
    // special case:
    // old Noyes/AFL OFL250 model is off by factor of 10
    if (model == 'OFL250') {
        xref['_datapts_params']['xscaling'] = 0.1;
    }
    if (debug) {
        logger(`${sep} [initial 12 byte header follows]`);
    }

    var N = await parts.get_uint(fh, 4);
    // confirm N equal to FxdParams num data points
    if ( N != results['FxdParams']['num data points'] ) {
        errlog("!!! WARNING !!! block says number of data points "+
               `is ${N} instead of ${results['FxdParams']['num data points']}`);
    }
    
    xref['num data points'] = N;
    if (debug) {
        logger(`${sep} num data points = ${N}`);
    }
    
    var val = await parts.get_signed(fh, 2);
    xref['num traces'] = val;
    if (debug) {
        logger(`${sep} number of traces = ${val}`);
    }

    if ( val > 1 ) {
        errlog(`WARNING!!!: Cannot handle multiple traces (${val}); aborting`);
        process.exit(1);
    }

    val = await parts.get_uint(fh, 4);
    xref['num data points 2'] = val;
    if (debug) {
        logger(`${sep} num data points again = ${val}`);
    }

    val = await parts.get_uint(fh, 2);
    var scaling_factor = val / 1000.0;
    xref['scaling factor'] = scaling_factor;
    if (debug) {
        logger(`${sep} scaling factor = ${parseFloat(scaling_factor)}`);
    }

    // .....................................
    // adjusted resolution
    var dx = results['FxdParams']['resolution'];
    var dlist = [];
    for(var i=0; i<N; i++) {
        val = await parts.get_uint(fh, 2);
        dlist.push(val)
    }
    
    var ymax = Math.max.apply( Math, dlist );
    var ymin = Math.min.apply( Math, dlist );
    var fsx = 0.001* scaling_factor;
    var disp_min = (ymin * fsx).toFixed(3);
    var disp_max = (ymax * fsx).toFixed(3);
    xref['max before offset'] = parseFloat(disp_max);
    xref['min before offset'] = parseFloat(disp_min);
    
    if (debug) {
        logger(`${sep} before applying offset: max ${disp_max} dB, min ${disp_min} dB`);
    }    

    // .........................................
    // save to file
    var offset = xref['_datapts_params']['offset'];
    var xscaling = xref['_datapts_params']['xscaling'];
    
    // convert/scale to dB
    if (offset == 'STV') {
        nlist = dlist.map( function(x) { return (ymax - x )*fsx; } );
    }else if (offset == 'AFL') {
        nlist = dlist.map( function(x) { return (ymin - x )*fsx; } );
    }else{ // invert
        nlist = dlist.map( function(x) { return (-x*fsx); } );
    }

    for(let i=0; i<N; i++) {
        // more work but (maybe) less rounding issues
        let x = dx*i*xscaling / 1000.0 // output in km
        tracedata.push( `${parseFloat(x).toFixed(6)}\t${parseFloat(nlist[i]).toFixed(6)}` );
    }
    
    // .........................................
    status = 'ok';
    
    return status;
});


/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var DataPts = function()
{
    this.process = process;
}

module.exports = DataPts;
