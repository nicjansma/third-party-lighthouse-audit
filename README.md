# Third Party Lighthouse Audit

v1.2.0

[https://nicj.net](http://nicj.net)

Licensed under the MIT license

## Introduction

Runs [Lighthouse](https://developers.google.com/web/tools/lighthouse) audits against a website multiple times, after injecting (or blocking) specific third-party components, giving the median scores.

This can be useful to understand the effect a third-party component has on Lighthouse scores in a non-lab (i.e. live) environment.

## Usage

Run via node:

```sh
node index.js [config.json5]
```

You can also install globally:

```sh
npm install --global third-party-lighthouse-audit

third-party-lighthouse-audit [config.json5]
```

After running, a summary of the audits and their median values will be emitted to the console.

For example, when running against a live website and removing a popular widget you may see:

```sh
with-widget
performance: median: 87, stddev: 11.960
> 74, 69, 79, 63, 90, 80, 48, 90, 88, 91, 73, 88, 87, 90, 91, 83, 88, 90, 71, 79, 88, 85, 89, 90, 81, 71, 87, 78, 77, 78, 70, 62, 73, 91, 88, 91, 89, 89, 90, 64, 56, 87, 90, 87, 87, 48, 81, 87, 68, 87, 90, 82, 89, 64, 87, 83, 78, 91, 89, 86, 85, 82, 86, 87, 91, 70, 88, 37, 91, 91, 86, 87, 92, 87, 91, 87, 91, 91, 84, 88, 90, 89, 87, 91, 39, 88, 58, 59, 57, 90, 91, 74, 86, 77, 88, 74, 82, 84, 91, 90

without-widget
performance: median: 87, stddev: 12.273
> 77, 63, 83, 88, 88, 73, 89, 91, 89, 63, 81, 84, 76, 89, 61, 50, 90, 86, 90, 84, 92, 84, 63, 84, 86, 83, 78, 85, 91, 87, 59, 88, 89, 52, 91, 77, 90, 92, 80, 90, 90, 87, 92, 84, 81, 90, 81, 53, 90, 57, 83, 91, 92, 73, 53, 53, 90, 91, 90, 85, 90, 88, 70, 92, 92, 93, 91, 87, 69, 89, 77, 88, 89, 93, 66, 89, 91, 88, 93, 94, 62, 87, 88, 78, 93, 65, 72, 64, 73, 91, 75, 91, 92, 88, 89, 68, 67, 60, 44, 77 
```

With the above 100 iterations for each bucket we can see the median Lighthouse Performance score did not change.

## Configuration

Test passes are defined in [JSON5](https://json5.org/) configuration files.

See `config.example.json5` for examples of usage.

```json5
{
    url: "https://example.com/",
    outputDir: "results",
    iterations: 2,
    lighthouse: {
        ...
    },
    runs: [
        ...
    ]
}
```

Top-level configuration options:

* `url` is the target URL
* `extraHeaders` to send along with the Page request
* `browserLaunch` for Chrome launch parameters
* `outputDir` (optional) is the output directory.  Subdirectories will be created for each "run", with the Lighthouse artifacts, trace and screenshots.
* `iterations` is how many times to run each.  Iterations will be interleaving (run 1, then run 2, then run 1, then run 2...)
* `lighthouse` are options passed directly to the [Lighthouse API](https://github.com/GoogleChrome/lighthouse)
* `runs` is a list of runs, i.e. buckets to compare.  
  * `name` is the name of the run, and will be the `outputDir` subfolder
  * `script` is a script to add, using one of the options below
    * `contentFile` will be a `<script>[source]</script>` tag injection
    * `url` will be a `<script src="[url]"></script>` tag injection
  * `block` is a list of string matches for URLs to block

## Version History

* v1.2.0 - 2024-09-11
  * Added `browserLaunch` config option
* v1.1.0 - 2024-09-10
  * Added `extraHeaders` config option
  * Upgraded to latest Lighthouse and other NPM packages
* v1.0.0 - 2021-01-08
  * Released
