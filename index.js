import { promises as fsp } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import slugify from 'slugify';
import csv from 'csvtojson';
import fm from 'front-matter';
import MarkdownIt from 'markdown-it';
import nunjucks from 'nunjucks';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import gender from './gender.js';
import { SES } from '@aws-sdk/client-ses';
import yaml from 'js-yaml';

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
            implies: 'output'
        },
        send: {
            type: 'boolean'
        },
        test: {
            type: 'string'
        }
    })
    .argv;

const Charset = 'UTF-8';
const ses = new SES({ region: 'us-east-1' });
const md = MarkdownIt({ html: true });
const csvParser = csv({ flatKeys: true });

const [ template, data ] = await Promise.all([
    fsp.readFile(argv.template),
    csvParser.fromFile(argv.data),
    argv.output && fsp.mkdir(argv.output, { recursive: true })
]);

const nEnv = nunjucks.configure()
    .addFilter('gender', gender)
    .addFilter('yamlList', str =>
        yaml.dump(str.split(/, */g), { flowLevel: 0 })
            .replace(/\n$/, ''));

let testEmailQueued = false;

await Promise.all(
    data.map(item => {
        if (argv.test && testEmailQueued)
            return null;
        let rendered = nEnv.renderString(template.toString(), item);
        let { attributes, body, frontmatter } = fm(rendered);
        body = body.replace(/(\n\s*){2,}/g, '\n\n');
        let whole = frontmatter + '\n\n' + body;
        let outPath = slugify(Object.values(item)[0]);
        if (argv.send) {
            let params = {
                ...attributes,
                Message: {
                    Subject: {
                        Data: attributes.Subject,
                        Charset,
                    },
                    Body: {
                        Html: {
                            Data: md.render(body),
                            Charset,
                        }
                    }
                }
            };
            if (argv.test) {
                delete params.Destination;
                params.Destination = {
                    ToAddresses: [ argv.test ]
                };
                ses.sendEmail(params);
                testEmailQueued = true;
            } else {
                return ses.sendEmail(params);
            }
        } else if (argv.output) {
            outPath = path.join(argv.output, outPath);
            if (argv.format === 'txt') {
                return fsp.writeFile(`${outPath}.txt`, whole);
            } else {
                return new Promise((resolve, reject) => {
                    const cmd = `pandoc -f markdown -o ${outPath.replace(/ /g, '\\ ')}.${argv.format}`;
                    const convert = exec(cmd, (e, stdout, stderr) => e ? reject(stderr) : resolve(stdout));
                    convert.stdin.write(whole);
                    convert.stdin.end();
                });
            }
        } else {
            return process.stdout.write(whole);
        }
    })
);
