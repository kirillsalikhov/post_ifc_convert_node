#!/usr/bin/env node

const { program } = require('commander');
const {convertXml} = require("./convert-xml");

program
    .description('post ifc transforms');

program
    .command('convert-xml')
    .requiredOption('-i, --input-xml <path_to_file>', 'path to xml file')
    .requiredOption('-o, --output <path_to_folder>', 'path to output folder')
    .action(async (options) => {
        const { inputXml, output} = options;
        await convertXml(inputXml, output);
    });

(async () => {
    await program.parseAsync();
})();

