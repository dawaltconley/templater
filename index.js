import { promises as fsp } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import slugify from 'slugify';
import csv from 'csvtojson';
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
        },
        format: {
            nargs: 1,
            choices: [ 'txt', 'rtf', 'odt', 'html' ],
            default: 'txt',
        }
    })
    .argv;

const csvParser = csv({ flatKeys: true });

const [ template, data ] = await Promise.all([
    fsp.readFile(argv.template),
    csvParser.fromFile(argv.data),
    argv.output && fsp.mkdir(argv.output, { recursive: true })
]);

await Promise.all(
    data.map(item => {
        let msg = nunjucks.renderString(template.toString(), item);
        let outPath = path.join(argv.output, slugify(Object.values(item)[0]));
        if (argv.output) {
            if (argv.format === 'txt') {
                return fsp.writeFile(`${outPath}.txt`, msg);
            } else {
                return new Promise((resolve, reject) => {
                    const cmd = `pandoc -f markdown -o ${outPath.replace(/ /g, '\\ ')}.${argv.format}`;
                    const convert = exec(cmd, (e, stdout, stderr) => e ? reject(stderr) : resolve(stdout));
                    convert.stdin.write(msg);
                    convert.stdin.end();
                });
            }
        } else {
            return process.stdout.write(msg);
        }
    })
);
