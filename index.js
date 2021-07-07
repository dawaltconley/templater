import { promises as fsp } from 'fs';
import path from 'path';
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
        }
    })
    .argv;

const parser = csv({ flatKeys: true });

const [ template, data ] = await Promise.all([
    fsp.readFile(argv.template),
    parser.fromFile(argv.data),
    argv.output && fsp.mkdir(argv.output, { recursive: true })
]);

await Promise.all(
    data.map(item => {
        let msg = nunjucks.renderString(template.toString(), item);
        if (argv.output) {
            let outPath = path.join(argv.output, `${slugify(Object.values(item)[0])}.txt`);
            return fsp.writeFile(outPath, msg);
        } else {
            return process.stdout.write(msg);
        }
    })
);
