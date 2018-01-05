#!/usr/local/bin/node
const path = require('path'),
      fs   = require('fs');
const SOR = require( path.join(__dirname, '../jsOTDR.js') );

const Dumper = require('./dump'),
      dump = new Dumper;

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
	console.log("* Received file path "+process.argv[2]);
	filepath = process.argv[2];
}

var bsname = path.basename(filepath,'.sor');

/* ---- by default logger() is console.log()
 *  sor.reader( filepath1, debug, logger );
 */
var debug = true;

var results = sor.reader( filepath, debug );

console.log("* waiting for results....");

results.then( function(data) {
    if ( data == null ) { // abort
        return;
    }    
    if ( debug ) {
        console.log('* final status '+data[0]);
        console.log('* write results to JSON file');
    }
    var filename = bsname+'-dump.json';
    dump.tofile( filename, JSON.stringify(data[1],null,8), debug );
    
    var tracename = bsname+'-trace.dat';
    var tracedata = data[2];
    try {
        fs.open(tracename, "w", null,
                function(err, fd) {
                    if (err) {
                        console.log("error writing to "+tracename);
                        return;
                    }
                    for(let i=0; i<tracedata.length; i++) {
                        fs.writeSync(fd,tracedata[i]+"\n");
                    }
                });
    }catch(e){
        console.log("* ERROR: write trace to data file "+e);
    }
    
}).catch(
    console.log.bind(console)
);
