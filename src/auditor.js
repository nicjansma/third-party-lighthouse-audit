//
// Imports
//
import { launch } from "puppeteer";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import lighthouse from "lighthouse";
import chalk from "chalk";
import { URL } from "url";
import { median, stdev } from "stats-lite";
import dataUriToBuffer from "data-uri-to-buffer";

//
// Functions
//
/**
 * Creates a new Auditor
 *
 * @param {object} config Configuration
 */
function Auditor(config) {
    this.config = config;
}

/**
 * Starts the Auditor run
 *
 * @param {object} config Configuration
 */
Auditor.prototype.run = async function() {
    console.log(chalk.green("Starting third-party-lighthouse auditor"));
    console.log();

    var globalConfig = this.config;

    var runResults = {};

    //
    // Setup output directories
    //
    const outputDir = join(globalConfig.outputDir || "results");
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
    }

    for (const run of globalConfig.runs) {
        run.outputDir = join(outputDir, run.name);

        if (!existsSync(run.outputDir)) {
            mkdirSync(run.outputDir);
        }

        runResults[run.name] = [];
    }

    // Validate config
    var runBlockList = globalConfig.block || [];
    var runScriptAdd = globalConfig.script || [];

    // Use Puppeteer to launch headful Chrome and don't use its default 800x600 viewport.
    const browser = await launch({
        headless: true,
        defaultViewport: null,
    });

    // Wait for Lighthouse to open url
    browser.on("targetchanged", async target => {
        const page = await target.page();

        if (page) {
            await page.setRequestInterception(true);

            page.on("request", (request) => {
                /* eslint-disable-next-line no-underscore-dangle */
                if (request.isInterceptResolutionHandled()) {
                    return;
                }

                for (var i = 0; i < runBlockList.length; i++) {
                    if (request.url().indexOf(runBlockList[i]) !== -1) {
                        console.log(">>", request.method(), request.url(), chalk.red(`SKIPPED (${runBlockList[i]})`));

                        request.abort();

                        return;
                    }
                }

                console.log(">>", request.method(), request.url(), chalk.green("ALLOWED"));

                request.continue();

                return;
            });

            if (runScriptAdd) {
                if (runScriptAdd.contentFile) {
                    // load from disk instead
                    runScriptAdd.content = readFileSync(runScriptAdd.contentFile, "utf8");
                    delete runScriptAdd.contentFile;
                }

                console.log(`>> Injecting script tag (${runScriptAdd.url ? runScriptAdd.url : "raw"})`);

                await page.addScriptTag(runScriptAdd);
            }
        }
    });

    console.log(chalk.underline(`Starting ${globalConfig.iterations} runs...`));

    for (var iteration = 1; iteration <= globalConfig.iterations; iteration++) {
        console.log(chalk.underline(`Run #${iteration}`));

        for (const run of globalConfig.runs) {
            console.log(chalk.blue(`> ${run.name}`));

            runBlockList = run.block || [];
            runScriptAdd = run.script;

            const lighthouseConfig = {
                ... {
                    port: (new URL(browser.wsEndpoint())).port,
                    output: "json",
                    extraHeaders: globalConfig.extraHeaders || []
                },
                ... globalConfig.lighthouse
            };

            const { lhr, artifacts } = await lighthouse(globalConfig.url, lighthouseConfig);

            console.log(`Writing results to ${run.outputDir}/...`);

            writeFileSync(
                join(run.outputDir, `${iteration}.json`),
                JSON.stringify(lhr, null, 2),
                "utf8");

            writeFileSync(
                join(run.outputDir, `${iteration}-artifacts.json`),
                JSON.stringify(artifacts, null, 2),
                "utf8");

            if (lhr && lhr.audits && lhr.audits["final-screenshot"]) {
                if (lhr.audits["final-screenshot"].errorMessage) {
                    console.log(chalk.yellow("Warning! " + lhr.audits["final-screenshot"].errorMessage));
                } else {
                    var screenShotBuff = dataUriToBuffer(lhr.audits["final-screenshot"].details.data);

                    writeFileSync(
                        join(run.outputDir, `${iteration}.jpg`),
                        screenShotBuff,
                        "utf8");
                }
            }

            if (artifacts &&
                artifacts.traces &&
                artifacts.traces.defaultPass &&
                artifacts.traces.defaultPass.traceEvents) {
                writeFileSync(
                    join(run.outputDir, `${iteration}-trace.json`),
                    JSON.stringify(artifacts.traces.defaultPass.traceEvents, null, 0),
                    "utf8");
            }

            runResults[run.name].push(lhr);
        }
    }

    console.log(chalk.bold("Run Scores:"));

    for (const [runName, runs] of Object.entries(runResults)) {

        console.log(chalk.blue(runName));

        let categories = {};

        runs.forEach(function(lhr) {
            for (const [catName, cat] of Object.entries(lhr.categories)) {
                categories[catName] = categories[catName] || [];
                categories[catName].push(Math.round(cat.score * 100));
            }
        });

        for (const [catName, values] of Object.entries(categories)) {
            console.log(`${catName}: median: ${median(values)}, ` +
                `stddev: ${parseFloat(stdev(values)).toFixed(3)}`);

            console.log(`> ${values.join(", ")}`);
        }
    }

    await browser.close();
};

//
// Exports
//
export default Auditor;
