//
// Summarizes a Lighthouse runs' scores.
//
// Run from the final outputDir directory for a run.
//

//
// Imports
//
import fs from "fs";
import { median, stdev } from "stats-lite";

let audits = [];

if (typeof process.argv[2] !== "undefined") {
    // single audit
    audits.push(process.argv[2]);
} else {
    // find which audits are available

    // find a file with a list of audits
    let files = fs.readdirSync(".");

    for (let file in files) {
        if (files[file].indexOf(".jpg") !== -1 ||
            files[file].indexOf("-trace.json") !== -1 ||
            files[file].indexOf("-artifacts.json") !== -1) {
            continue;
        }

        let json = fs.readFileSync(files[file]);
        let obj = JSON.parse(json);

        // use all audits from this file
        audits = Object.keys(obj.audits);

        console.log(`Found audits: ${audits.join(",")}`);

        // don't need to look any more
        break;
    }
}

// read all files in this directory
let files = fs.readdirSync(".");
let values = {};

for (let file in files) {
    if (files[file].indexOf(".jpg") !== -1 ||
        files[file].indexOf("-trace.json") !== -1 ||
        files[file].indexOf("-artifacts.json") !== -1) {
        continue;
    }

    // read the JSON file and parse
    let json = fs.readFileSync(files[file]);
    let obj = JSON.parse(json);

    // append any data we find
    audits.forEach(function(auditName) {
        values[auditName] = values[auditName] || [];

        if (!obj.audits[auditName].numericValue) {
            // no value
            return;
        }

        values[auditName].push(obj.audits[auditName].numericValue.toFixed(0));
    });
}

// summarize all audits
audits.forEach(function(auditName) {
    let vals = values[auditName];

    if (!vals.length) {
        return;
    }

    console.log();
    console.log(auditName);

    console.log(`\tmedian:  ${median(vals).toFixed(0)} +/- ${parseFloat(stdev(vals)).toFixed(0)}`);
    console.log(`\tresults: ${vals.join(", ")}`);
});
