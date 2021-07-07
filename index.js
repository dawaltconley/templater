import fs from 'fs';
import csv from 'csvtojson';
// import mustache from 'mustache';
import nunjucks from 'nunjucks';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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

const parser = csv({ flatKeys: true });

const [ template, data ] = await Promise.all([
    fs.promises.readFile(argv.template),
    parser.fromFile(argv.data)
]);

for (const item of data) {
    console.dir(item, {depth: null});
    let str = nunjucks.renderString(template.toString(), item);
    console.log(str);
}
