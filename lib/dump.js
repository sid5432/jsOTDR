#!/usr/local/bin/node
const fs = require('fs'),
      path = require('path');

function tofile(filename, results, debug=false, logger=console.log, errlog=console.log) {
        
    try {
        fs.open(filename, "w", null,
                function(err, fd) {
                    fs.writeSync(fd,results);
                    fs.closeSync(fd);
                    if ( debug ) {
                        logger('* write file closed');
                    }
                });
    }catch(e){
	    errlog('* error writing to file');
    }
}

/* =====================================================================
 * export this as a module
 * =====================================================================
 */
var Dump = function()
{
	this.tofile = tofile;
	
};

module.exports = Dump;
