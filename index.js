const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const mustache = require('mustache');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const p = (...args) => path.join(__dirname, ...args);

const argv = yargs(hideBin(process.argv))
    .options({
        t: {
            alias: 'template',
            demandOption: true,
            nargs: 1,
            type: 'string'
        },
        d: {
            alias: 'data',
            demandOption: true,
            nargs: 1,
            type: 'string'
        },
        o: {
            alias: 'output',
            nargs: 1,
            type: 'string'
        }
    })
    .argv;
