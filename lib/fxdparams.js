#!/usr/local/bin/node
require('asyncawait');
require('path');
const Parts = require('./parts'),
      parts = new Parts;

var sep = "    :";

var unit_map = {
    "mt": " (meters)",
    "km": " (kilometers)",
    "mi": " (miles)",
    "kf": " (kilo-ft)"
};

var tracetype = {
    'ST': "[standard trace]",
    'RT': "[reverse trace]",
    'DT': "[difference trace]",
    'RF': "[reference]",
};

var process = (async function(fh, results, logger, errlog, debug=false)
{
    var bname = "FxdParams";
    var hsize = bname.length + 1; // include trailing '\0'
    var pname = "fxdparams.process():"
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

    if ( format == 1 ) {
        plist = [// name, start-pos, length (bytes), type, multiplier, precision, units
            // type: display type: 'v' (value) or 'h' (hexidecimal) or 's' (string)
            ["date/time",0,4,'v','','',''], // ............... 0-3 seconds in Unix time
            ["unit",4,2,'s','','',''], // .................... 4-5 distance units, 2 char (km,mt,ft,kf,mi)
            ["wavelength",6,2,'v',0.1,1,'nm'], // ............ 6-7 wavelength (nm)
            
            // from Andrew Jones
            ["acquisition offset",8,4,'i','','',''], // .............. 8-11 acquisition offset; units?
            ["number of pulse width entries",12,2,'v','','',''], // .. 12-13 number of pulse width entries
            
            ["pulse width",14,2,'v','',0,'ns'],  // .......... 14-15 pulse width (ns)
            ["sample spacing", 16,4,'v',1e-8,'','usec'], // .. 16-19 sample spacing (in usec)
            ["num data points", 20,4,'v','','',''], // ....... 20-23 number of data points
            ["index", 24,4,'v',1e-5,6,''], // ................ 24-27 index of refraction
            ["BC", 28,2,'v',-0.1,2,'dB'], // ................. 28-29 backscattering coeff
            ["num averages", 30,4,'v','','',''], // .......... 30-33 number of averages
            ["range", 34,4,'v',2e-5,6,'km'], // .............. 34-37 range (km)
            
            // from Andrew Jones
            ["front panel offset",38,4,'i','','',''], // ................ 38-41
            ["noise floor level",42,2,'v','','',''], // ................. 42-43 unsigned
            ["noise floor scaling factor",44,2,'i','','',''], // ........ 44-45
            ["power offset first point",46,2,'v','','',''], // .......... 46-47 unsigned
            
            ["loss thr", 48,2,'v',0.001,3,'dB'], // .......... 48-49 loss threshold
            ["refl thr", 50,2,'v',-0.001,3,'dB'], // ......... 50-51 reflection threshold
            ["EOT thr",52,2,'v',0.001,3,'dB'], // ............ 52-53 end-of-transmission threshold
        ];
    }else{
        plist = [// name, start-pos, length (bytes), type, multiplier, precision, units
            // type: display type: 'v' (value) or 'h' (hexidecimal) or 's' (string)
            ["date/time",0,4,'v','','',''], // ............... 0-3 seconds in Unix time
            ["unit",4,2,'s','','',''], // .................... 4-5 distance units, 2 char (km,mt,ft,kf,mi)
            ["wavelength",6,2,'v',0.1,1,'nm'], // ............ 6-7 wavelength (nm)
            
            // from Andrew Jones
            ["acquisition offset",8,4,'i','','',''], // .............. 8-11 acquisition offset; units?
            ["acquisition offset distance",12,4,'i','','',''], // .... 12-15 acquisition offset distance; units?
            ["number of pulse width entries",16,2,'v','','',''], // .. 16-17 number of pulse width entries
            
            ["pulse width",18,2,'v','',0,'ns'],  // .......... 18-19 pulse width (ns)
            ["sample spacing", 20,4,'v',1e-8,'','usec'], // .. 20-23 sample spacing (usec)
            ["num data points", 24,4,'v','','',''], // ....... 24-27 number of data points
            ["index", 28,4,'v',1e-5,6,''], // ................ 28-31 index of refraction
            ["BC", 32,2,'v',-0.1,2,'dB'], // ................. 32-33 backscattering coeff
            
            ["num averages", 34,4,'v','','',''], // .......... 34-37 number of averages
            
            // from Dmitry Vaygant:
            ["averaging time", 38,2,'v',0.1,0,'sec'], // ..... 38-39 averaging time in seconds
            
            ["range", 40,4,'v',2e-5,6,'km'], // .............. 40-43 range (km); note x2
            
            // from Andrew Jones
            ["acquisition range distance",44,4,'i','','',''], // ........ 44-47
            ["front panel offset",48,4,'i','','',''], // ................ 48-51
            ["noise floor level",52,2,'v','','',''], // ................. 52-53 unsigned
            ["noise floor scaling factor",54,2,'i','','',''], // ........ 54-55
            ["power offset first point",56,2,'v','','',''], // .......... 56-57 unsigned
            
            ["loss thr", 58,2,'v',0.001,3,'dB'], // .......... 58-59 loss threshold
            ["refl thr", 60,2,'v',-0.001,3,'dB'], // ......... 60-61 reflection threshold
            ["EOT thr",62,2,'v',0.001,3,'dB'], // ............ 62-63 end-of-transmission threshold
            ["trace type",64,2,'s','','',''], // ............. 64-65 trace type (ST,RT,DT, or RF)
            
            // from Andrew Jones
            ["X1",66,4,'i','','',''], // ............. 66-69
            ["Y1",70,4,'i','','',''], // ............. 70-73
            ["X2",74,4,'i','','',''], // ............. 74-77
            ["Y2",78,4,'i','','',''], // ............. 78-81
        ];	
    }

    status = await process_fields(fh, plist, results, logger, errlog, debug);
    /*
    // read the rest of the block (just in case)
    var endpos = results['blocks'][bname]['pos'] + results['blocks'][bname]['size'];
    await fh.read( endpos - (await fh.tell()) );
    status = 'ok'
    */
    
    return status;
});

// ================================================================
var process_fields = async function(fh, plist, results, logger, errlog, debug) {
    var bname = "FxdParams";
    var xref  = results[bname];
    
    /* functions to use
     * 'h': get_hexstring
     * 'v': get_uint
     * 's': get_string
     * 'i': get_signed
     */

    var count = 0;
    for(let i in plist) {
	let field = plist[i];
	
        let name  = field[0];
        let fsize = field[2];
        let ftype = field[3];
        let scale = field[4];
        let dgt   = field[5];
        let unit  = field[6];
        let xstr  = "";

	let val;
	
        if (ftype == 'i') {
            val = await parts.get_signed(fh, fsize);
            xstr = val;
	}else if (ftype == 'v') {
            val = await parts.get_uint(fh, fsize)
            if (scale != '') {
                val *= scale;
	    }
            if (dgt != '' ) {
                xstr = val.toFixed(dgt);
	    }else{
                xstr = val
	    }
	}else if (ftype == 'h') {
            xstr = await parts.get_hex(fh, fsize);
        }else if (ftype == 's') {
            xstr = await fh.readString( fsize );
	}else{
            val = await fh.read(fsize);
            xstr = val.toString();
	}
	
        // .................................
        if (name == 'date/time') {
	    // xstr = str(datetime.datetime.fromtimestamp(val))+(" (%d sec)" % val)
            // xstr = datetime.datetime.fromtimestamp(val).strftime("%a %b %d %H:%M:%S %Y") + \
            // (" (%d sec)" % val);
	    var d = new Date(0);
	    d.setUTCSeconds(val);
	    
	    xstr = d+` (${val} sec)`;
	    // console.log("............... got "+xstr);
	}else if (name == 'unit') {
            xstr += unit_map[ xstr ]
        }else if (name == 'trace type') {
            try {
                xstr += tracetype[ xstr ];
	    }catch(e) {
                continue;
	    }
	}
	
	// don't bother even trying if there are multiple pulse width entries; too lazy
        // to restructure code to handle this case
        if (name == 'number of pulse width entries' && val > 1) {
            errlog(`WARNING!!!: Cannot handle multiple pulse width entries (${val}); aborting`);
            process.exit();
	}

	// .................................
        if (debug) {
            logger(`${sep} ${count}. ${name}: ${xstr} ${unit}`);
        }
	if ( unit=="" ) {
            xref[name] = xstr;
	}else{
	    xref[name] = xstr+" "+unit;
	}
        count += 1
    }

    // corrrections/adjustment:
    var ior = parseFloat(xref['index']);
    var ss = xref['sample spacing'].split(' ')[0];
    var dx  = parseFloat( ss ) * parts.sol / ior;
    xref['range'] = dx * parseInt(xref['num data points']);
    xref['resolution'] = dx * 1000.0 // in meters

    if (debug) {
        logger("");
        logger(`${sep} [adjusted for refractive index]`)
        logger(`${sep} resolution = ${xref['resolution'].toFixed(14)} m`);
        logger(`${sep} range      = ${xref['range'].toFixed(13)} km`);
    }
    status = 'ok';
    
    return status;
};

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var FxdParams = function()
{
    this.process = process;
}

module.exports = FxdParams;
