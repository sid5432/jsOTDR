#!/usr/local/bin/node
const path = require('path'),
      fs   = require('fs');
const SOR = require( path.join(__dirname, '../jsOTDR.js') );
const winston = require('winston');

const Dumper = require('./dump'),
      dump = new Dumper;

/*
 * =====================================================================
 * logger
 * =====================================================================
 */
winston.loggers.add('system', {
    transports: [
	new winston.transports.Console({
	    level: 'info',
	    // format: winston.format.simple(),
	    colorize: true
	})
    ]
});

var prelogger = winston.loggers.get('system');
var infologger = function(msg) {
    return prelogger.log('info',msg);
};

var errorlogger = function(msg) {
    return prelogger.log('error',msg);
};

/*
 * ================================================================
 * test SOR reader
 * ================================================================
 */
var sor = new SOR;

if ( process.argv.length != 3 ) {
	console.log(`USAGE: ${path.basename(process.argv[1])} SORfile.sor`);
	console.log("OR");
	console.log(`USAGE: ${path.basename(process.argv[1])} (test1|test2)`);
	console.log("(to test sample file 1 or 2)");
	process.exit();
}

var filepath1 = path.join(__dirname,'../data/demo_ab.sor');
var filepath2 = path.join(__dirname,'../data/sample1310_lowDR.sor');

if ( process.argv[2] == 'test1' ) {
    filepath = filepath1;
}else if ( process.argv[2] == 'test2' ) {
    filepath = filepath2;
}else{
    infologger("* Received file path "+process.argv[2]);
    filepath = process.argv[2];
}

var bsname = path.basename(filepath,'.sor');

/* ---- by default logger() is console.log()
 *  sor.reader( filepath1, debug, logger );
 */
var debug = true;

var results = sor.reader( filepath, debug, infologger, errorlogger );

infologger("* waiting for results....");

results.then( function(data) {
    if ( data == null ) { // abort
        return;
    }    
    if ( debug ) {
        infologger('* final status '+data[0]);
        infologger('* write results to JSON file');
    }
    var filename = bsname+'-dump.json';
    dump.tofile( filename, JSON.stringify(data[1],null,8), debug, infologger, errorlogger );
    
    var tracename = bsname+'-trace.dat';
    var tracedata = data[2];
    try {
        fs.open(tracename, "w", null,
                function(err, fd) {
                    if (err) {
                        errorlogger("error writing to "+tracename);
                        return;
                    }
                    for(let i=0; i<tracedata.length; i++) {
                        fs.writeSync(fd,tracedata[i]+"\n");
                    }
                });
    }catch(e){
        errorlogger("* ERROR: write trace to data file "+e);
    }
    
}).catch(
    console.log.bind(console)
);
