#!/usr/bin/env node
//
// Imports
//
import { readFileSync } from "fs";
import json5 from "json5";

import Auditor from "./src/auditor.js";

// for debugging
process.on("unhandledRejection", r => console.error(r));

// command-line arguments
if (process.argv.length <= 2) {
    console.error("Usage: third-party-lighthouse-audit [config.json]");
    process.exit(1);
}

const configFile = process.argv[2];

// load the config file
const fileContents = readFileSync(configFile, "utf-8");
const configJson = json5.parse(fileContents);

// call Auditor
(async() => {
    try {
        var p = new Auditor(configJson);
        await p.run();
    } catch (e) {
        console.error(e);

        process.exit(1);
    }

    process.exit(0);
})();
