#!/usr/bin/env node

const { program } = require('commander');
const {convertXml} = require("./convert-xml");
const {renameGltfNodes} = require("./rename-gltf-nodes");

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

program.command('rename-gltf-nodes')
    .requiredOption('-io, --input-objects <path_to_file>', 'path to objects.json file')
    .requiredOption('-ig, --input-gltf <path_to_file>', 'path to gltf file')
    .requiredOption('-o, --output <path_to_folder>', 'path to output gltf file')
    .action(async (options) => {
        const {inputObjects, inputGltf, output} = options;
        await renameGltfNodes(inputGltf, inputObjects, output);
    });


(async () => {
    await program.parseAsync();
})();

