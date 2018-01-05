# jsOTDR: Simple OTDR SOR file parser for node.js

The SOR ("Standard OTDR Record") data format is used to store OTDR 
([optical time-domain
reflectometer](http://https://en.wikipedia.org/wiki/Optical_time-domain_reflectometer)
) fiber data.  The format is defined by the Telcordia [SR-4731, issue
2](http://telecom-info.telcordia.com/site-cgi/ido/docs.cgi?ID=SEARCH&DOCUMENT=SR-4731&)
standard.  While it is a standard, it is unfortunately not open, in
that the specifics of the data format are not openly available.  You
can buy the standards document from Telcordia for $750 US (as of this
writing), but this was beyond my budget. (And likely comes with
all sorts of licensing restrictions. I wouldn't know; I have never
seen the document!)


There are several freely available OTDR trace readers available for
download on the web, but most do not allow exporting the trace curve
into, say, a CSV file for further analysis, and only one that I've
found that runs natively on Linux (but without source code; although
some of these do work in the Wine emulator).  There have been requests
on various Internet forums asking for information on how to extract
the trace data, but I am not aware of anyone providing any answers
beyond pointing to the free readers and the Telcordia standard.


Fortunately the data format is not particularly hard to decipher.  The
table of contents on the Telcordia [SR-4731, issue
2](http://telecom-info.telcordia.com/site-cgi/ido/docs.cgi?ID=SEARCH&DOCUMENT=SR-4731&)
page provides several clues, as does the Wikipedia page on [optical
time-domain
reflectometer](http://https://en.wikipedia.org/wiki/Optical_time-domain_reflectometer).


Using a binary-file editor/viewer and comparing the outputs from
some free OTDR SOR file readers, I was able to piece together most of
the encoding in the SOR data format and written a simple program (in
Ruby) that parses the SOR file and dumps the trace data into a file.
(For a more detailed description, other than reading the source code,
see [my blog
post](http://morethanfootnotes.blogspot.com/2015/07/the-otdr-optical-time-domain.html?view=sidebar)).


Presented here for your entertainment are my findings, in the hope
that it will be useful to other people.  But be aware that the
information provided here is based on guess work from looking at a
limited number of sample files.  I can not guarantee that there are no
mistakes, or that I have uncovered all possible exceptions to the
rules that I have deduced from the sample files.  **use it at your own
risk! You have been warned!** 

The program was ported over from my original Perl and Python versions
([pubOTDR](https://github.com/sid5432/pubOTDR) and [pyOTDR](https://github.com/sid5432/pyOTDR)).
There are also versions for Ruby [rbOTDR](https://github.com/sid5432/rbOTDR) and
Clojure [cljotdr](https://github.com/sid5432/cljotdr) for those who are interested.


This program requires a few node modules (listed in the *package.json* file): run

    npm install

from the top level directory to install these modules.  Run 

    npm test

to run the tests. This requires the (mocha)[https://github.com/mochajs/mocha] package, but it is required only for unit testing;
it is not needed for running the *jsOTDR* module itself.


An example of how to use the module is shown in *jsOTDR/lib/test_drive.js* (there is another version
called *jsOTDR/lib/test_drive_with_winston.js* that uses [winston](https://npmjs.com/package/winston)
for logging, but it is optional). To parse an SOR file, run 


    ./lib/test_drive.js myfile.sor

where "myfile.sor" is the name (path) to your SOR file.  A OTDR trace file "myfile-trace.dat" and a JSON file "myfile-dump.json" will be produced.


(*Last Revised 2018-01-04*)


