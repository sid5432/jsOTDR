#!/usr/local/bin/node
'use strict';
const async = require('asyncawait/async'),
      await = require('asyncawait/await');

const path = require('path'),
	BF = require('binary-file');

const Parts = require('./lib/parts'),
	parts = new Parts();

const Mapblock = require('./lib/mapblock'),
      mapblock = new Mapblock();

const Genparams = require('./lib/genparams'),
      genparams = new Genparams();

const Supparams = require('./lib/supparams'),
      supparams = new Supparams();

const Fxdparams = require('./lib/fxdparams'),
      fxdparams = new Fxdparams();

const Datapts = require('./lib/datapts'),
      datapts = new Datapts();

const Keyevents = require('./lib/keyevents'),
      keyevents = new Keyevents();

const Cksum = require('./lib/cksum'),
      cksum = new Cksum();

/*
 * =====================================================================
 * parser/reader
 * =====================================================================
 */
var parser = (async function(filepath, debug, logger, errlog) 
{
    var fh = new BF( filepath,'r',true); // little-endian
    await fh.open();

    var bsname = path.basename(filepath);
    
    // initialize
    var results = {};
    results['filename'] = bsname;
    var tracedata = [];
    var status = await mapblock.process(fh, results, logger, errlog, debug);
    if ( status != 'ok' ) {
        return status;
    }

    for(var bname in results['blocks'] ) {
	var ref = results['blocks'][bname];
        var bname = ref['name'];
        var bsize = ref['size'];
        var start = ref['pos'];
        
        if (debug) {
	    logger(`MAIN:  ${bname} block: ${bsize} bytes, start pos 0x${await parts.tohex(start)} (${start})`);
	}

        if (bname == 'GenParams') {
	    status = await genparams.process(fh, results, logger, errlog, debug);
        }else if (bname == 'SupParams') {
	    status = await supparams.process(fh, results, logger, errlog, debug);
        }else if (bname == 'FxdParams') {
	    status = await fxdparams.process(fh, results, logger, errlog, debug);
        }else if (bname == 'DataPts') {
	    status = await datapts.process(fh, results, tracedata, logger, errlog, debug);
        }else if (bname == 'KeyEvents') {
	    status = await keyevents.process(fh, results, logger, errlog, debug);
        }else if (bname == 'Cksum') {
	    status = await cksum.process(fh, results, logger, errlog, debug);
        }else{
	    await parts.slurp(fh, bname, results, logger, errlog, debug);
	    status = 'ok'
	}
	
        if (debug) {
	    logger("");
	}

	if ( status != 'ok' ) {
	    break;
	}
    }

    await fh.close();
    // console.log(results);
    // console.log('====from _parser_');
    return new Promise(function(resolve,reject) {
        if ( status == 'ok' ) {
	    resolve( [status, results, tracedata] );
        }else{
	    reject( new Error('parsing problem') );
        }
    });
});

// wrapper
var reader = async function(filepath, debug=false, logger=console.log, errlog=console.log ) {
    var stash;
    try {
	stash = await parser(filepath, debug, logger, errlog);
    }catch(err) {
	errlog(err);
    }
    return stash;
};

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var jsOTDR = function()
{
	this.reader = reader;
	
};

module.exports = jsOTDR;

exports.printMsg = function() {
    console.log("jsOTDR.js for parsing OTDR SOR files");
};

