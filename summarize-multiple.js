//
// Summarizes subdirectories' runs
//
// Run from the outputDir directory that contains multiple runs.
//

//
// Imports
//
import fs from "fs";
import path from "path";
import { median, stdev } from "stats-lite";

let dirs = fs.readdirSync(".");

let audits = [];

if (typeof process.argv[2] !== "undefined") {
    // single audit
    audits.push(process.argv[2]);
} else {
    // find which audits are available

    // find a file with a list of audits
    let files = fs.readdirSync(dirs[0]);

    for (let file in files) {
        if (files[file].indexOf(".jpg") !== -1 ||
            files[file].indexOf("-trace.json") !== -1 ||
            files[file].indexOf("-artifacts.json") !== -1) {
            continue;
        }

        let json = fs.readFileSync(path.join(dirs[0], files[file]));
        let obj = JSON.parse(json);

        // use all audits from this file
        audits = Object.keys(obj.audits);

        console.log(`Found audits: ${audits.join(",")}`);

        // don't need to look any more
        break;
    }
}

let values = {};

// find all directories
dirs.forEach(function(dir) {
    let files = fs.readdirSync(dir);

    for (let file in files) {
        if (files[file].indexOf(".jpg") !== -1 ||
            files[file].indexOf("-trace.json") !== -1 ||
            files[file].indexOf("-artifacts.json") !== -1) {
            continue;
        }

        // read the JSON file and parse
        let json = fs.readFileSync(path.join(dir, files[file]));
        let obj = JSON.parse(json);

        // append any data we find
        audits.forEach(function(auditName) {
            values[auditName] = values[auditName] || {};
            values[auditName][dir] = values[auditName][dir] || [];

            if (!obj.audits[auditName].numericValue) {
                // no value
                return;
            }

            // push to this dir's results
            values[auditName][dir].push(obj.audits[auditName].numericValue.toFixed(0));
        });
    }
});

// summarize all runs
audits.forEach(function(auditName) {
    let vals = values[auditName];

    if (!vals[Object.keys(vals)[0]].length) {
        return;
    }

    console.log();
    console.log(auditName);

    let maxLen = 0;
    dirs.forEach(function(dir) {
        maxLen = dir.length > maxLen ? dir.length : maxLen;
    });

    dirs.forEach(function(dir) {
        console.log(`${dir.padStart(maxLen)}: ` +
            `${median(vals[dir]).toFixed(0)} ` +
            `+/- ${parseFloat(stdev(vals[dir])).toFixed(0)}`);
    });

    if (dirs.length === 2) {
        let dir1 = Object.keys(vals)[0];
        let dir2 = Object.keys(vals)[1];

        let diffN = median(vals[dir1]) - median(vals[dir2]);
        let diffPct = (diffN / median(vals[dir1])) * 100;

        if (isNaN(diffPct)) {
            diffPct = 0;
        }

        console.log(`${"diff".padStart(maxLen)}: ${(diffN).toFixed(0)} (${diffPct.toFixed(1)}%)`);
    }
});
