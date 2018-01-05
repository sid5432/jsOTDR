#!/usr/local/bin/node
require('asyncawait');

var divider = "--------------------------------------------------------------------------------";

// speed of light
const sol = 299792.458/1.0e6; // = 0.299792458 km/usec

var get_string = (async function(fh)
{
    var mystr = "";
    var byte = await fh.read(1);
    while( byte != '' ) {
        var tt = String(byte).charCodeAt(0);
	if ( tt == 0 ) {
	    break;
	}
	mystr += byte;
	byte = await fh.read(1);
    }
    
    return mystr;
});

var get_uint = (async function(fh,nbytes=2)
{
    if ( nbytes == 2 ) {
	val = await fh.readUInt16();
    }else if( nbytes == 4 ) {
	val = await fh.readUInt32();
    }else{
	val = null;
	console.log(`parts.get_uint(): Invalid number of bytes ${nbytes}`);
    }
    
    return val;
});

var get_signed = (async function(fh,nbytes=2) {

    if ( nbytes == 2 ) {
	val = await fh.readInt16();
    }else if( nbytes == 4 ) {
	val = await fh.readInt32();
    }else{
	val = null;
	console.log(`parts.get_signed(): Invalid number of bytes ${nbytes}`);
    }
    
    return val;
});

var get_hex = (async function(fh, nbytes=1) {
    var hstr = "";
    for(var i=0; i<nbytes; i++) {
	var b = (await fh.readUInt8()).toString(16);
	b = ("00000" + b).substr(-2).toUpperCase()+" ";
	hstr += b;
    }
    return hstr;
});

var tohex = function(val) {
    return val.toString(16).toUpperCase();
}

var slurp = (async function(fh, bname, results, logger, errlog, debug=false) {
    
    try {
        var ref = results['blocks'][bname];
        var startpos = ref['pos'];
        await fh.seek( startpos );
    }catch(e){
        errlog(pname+" "+bname+"block starting position unknown");
        return 'nok';
    }
    var nn = ref['size'];
    
    var tt = await fh.read(nn);
    
    return 'ok';
});

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var Parts = function()
{
    this.get_string = get_string;
    this.get_uint   = get_uint;
    this.get_signed = get_signed;
    this.get_hex    = get_hex;
    this.tohex      = tohex;
    this.divider    = divider;
    this.sol        = sol;
    this.slurp      = slurp;
}

module.exports = Parts;
