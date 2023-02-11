#!/usr/local/bin/node
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var bname = "KeyEvents";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "keyevents.process():"
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

    status = await process_keyevents(fh, format, results, logger, errlog, debug);

    // read the rest of the block (just in case)
    /*
    var endpos = results['blocks'][bname]['pos'] + results['blocks'][bname]['size'];
    await fh.read( endpos - (await fh.tell()) );
    status = 'ok';
    */
    return status;
});

// ================================================================
var process_keyevents = (async function(fh, format, results, logger, errlog, debug) {
    // process version 1 or 2 format
    var bname = "KeyEvents";
    var xref  = results[bname];
    
    // number of events
    var nev = await parts.get_uint(fh, 2);
    if ( debug ) {
	logger(`${sep} ${nev} events`);
    }
    xref['num events'] = nev;
    
    var factor = 1e-4 * parts.sol / parseFloat(results['FxdParams']['index']);
    
    var pat = "(.)(.)9999LS";

    for(let j=0; j<nev; j++) {
        var x2ref = xref[`event ${1+j}`] = {};
        
        var xid  = await parts.get_uint(fh, 2);            // 00-01: event number
        var dist = await parts.get_uint(fh, 4) * factor;   // 02-05: time-of-travel; need to convert to distance
        
        var slope  = await parts.get_signed(fh, 2) * 0.001; // 06-07: slope
        var splice = await parts.get_signed(fh, 2) * 0.001; // 08-09: splice loss
        var refl   = await parts.get_signed(fh, 4) * 0.001; // 10-13: reflection loss
        
        var xtype = await fh.readString(8);                 // 14-21: event type
	
	var mresults = xtype.match(pat);
	if ( mresults != null ) {
	    var subtype = mresults[1];
	    var manual  = mresults[2];

            if (manual == 'A') {
                xtype += " {manual}";
	    }else{
                xtype += " {auto}";
            }
            if (subtype == '1') {
                xtype += " reflection";
	    }else if (subtype == '0') {
                xtype += " loss/drop/gain";
	    }else if (subtype == '2') {
                xtype += " multiple";
	    }else{
                xtype += " unknown '"+subtype+"'";
	    }
	}else{
            xtype += " [unknown type "+xtype+"]";
	}
	
        if (format == 2) {
            var end_prev   = await parts.get_uint(fh, 4) * factor; // 22-25: end of previous event
            var start_curr = await parts.get_uint(fh, 4) * factor; // 26-29: start of current event
            var end_curr   = await parts.get_uint(fh, 4) * factor; // 30-33: end of current event
            var start_next = await parts.get_uint(fh, 4) * factor; // 34-37: start of next event
            var pkpos      = await parts.get_uint(fh, 4) * factor; // 38-41: peak point of event
	}

        var comments = await parts.get_string(fh);
        
        x2ref['type'] = xtype;
        x2ref['distance'] = dist.toFixed(3);
        x2ref['slope'] = slope.toFixed(3);
        x2ref['splice loss'] = splice.toFixed(3);
        x2ref['refl loss'] = refl.toFixed(3);
        x2ref['comments'] = comments;

        if (format == 2) {
            x2ref['end of prev'] = end_prev.toFixed(3);
            x2ref['start of curr'] = start_curr.toFixed(3);
            x2ref['end of curr'] = end_curr.toFixed(3);
            x2ref['start of next'] = start_next.toFixed(3);
            x2ref['peak'] = pkpos.toFixed(3);
	}

        if (debug) {
            logger(`${sep} Event ${xid}: type ${xtype}`);
            logger(`${sep}${sep} distance: ${dist.toFixed(3)} km`);
            logger(`${sep}${sep} slope: ${slope.toFixed(3)} dB/km`);
            logger(`${sep}${sep} splice loss: ${splice.toFixed(3)} dB`);
            logger(`${sep}${sep} refl loss: ${refl.toFixed(3)} dB`);
	    
	    // version 2
            if (format == 2) {
                logger(`${sep}${sep} end of previous event: ${end_prev.toFixed(3)} km`);
                logger(`${sep}${sep} start of current event: ${start_curr.toFixed(3)} km`);
                logger(`${sep}${sep} end of current event: ${end_curr.toFixed(3)} km`);
                logger(`${sep}${sep} start of next event: ${start_next.toFixed(3)} km`);
                logger(`${sep}${sep} peak point of event: ${pkpos.toFixed(3)} km`);
	    }

	    // common
            logger(`${sep}${sep} comments: ${comments}`);
	}
    }
    // ...................................................
    var total      = await parts.get_signed(fh, 4) * 0.001;  // 00-03: total loss
    var loss_start = await parts.get_signed(fh, 4) * factor; // 04-07: loss start position
    var loss_finish= await parts.get_uint(fh, 4) * factor;   // 08-11: loss finish position
    var orl        = await parts.get_uint(fh, 2) * 0.001;    // 12-13: optical return loss (ORL)
    var orl_start  = await parts.get_signed(fh, 4) * factor; // 14-17: ORL start position
    var orl_finish = await parts.get_uint(fh, 4) * factor;   // 18-21: ORL finish position
    
    if (debug) {
        logger(`${sep} Summary:`);
        logger(`${sep}${sep} total loss: ${total.toFixed(3)} dB`);
        logger(`${sep}${sep} ORL: ${orl.toFixed(3)} dB`);
        logger(`${sep}${sep} loss start: ${loss_start} km`);
        logger(`${sep}${sep} loss end: ${loss_finish} km`);
        logger(`${sep}${sep} ORL start: ${orl_start} km`);
        logger(`${sep}${sep} ORL finish: ${orl_finish} km`);
    }

    var x3ref = xref["Summary"] = {};
    x3ref["total loss"] = parseFloat( total.toFixed(3) );
    x3ref["ORL"]        = parseFloat( orl.toFixed(3) );
    x3ref["loss start"] = parseFloat( loss_start.toFixed(6) );
    x3ref["loss end"]   = parseFloat( loss_finish.toFixed(6) );
    x3ref["ORL start"]  = parseFloat( orl_start.toFixed(6) );
    x3ref["ORL finish"] = parseFloat( orl_finish.toFixed(6) );
    
    // ................
    status = 'ok';
    return status;
});

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var KeyEvents = function()
{
    this.process = process;
}

module.exports = KeyEvents;
