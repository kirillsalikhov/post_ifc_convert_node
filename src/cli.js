#!/usr/bin/env node

const { program } = require('commander');
const {convertXml} = require("./convert-xml");
const {renameGltfNodes} = require("./rename-gltf-nodes");
const {adjustMaterials} = require("./adjust-materials");

program
    .description('post ifc transforms');


const { defaultSerializersConfigName, serializersConfigsMap } = require('./convert-xml/serializers/configs');
program
    .command('convert-xml')
    .option('-s, --serializer <serializer_name>', `serializer used to create objects.json, available serializers are ${Object.keys(serializersConfigsMap).map(x => JSON.stringify(x)).join(', ')}`, defaultSerializersConfigName)
    .requiredOption('-i, --input-xml <path_to_file>', 'path to xml file')
    .requiredOption('-o, --output <path_to_folder>', 'path to output folder')
    .action(async (options) => {
        const { inputXml, output, serializer} = options;
        await convertXml(inputXml, output, serializer);
    });

program
    .command('rename-gltf-nodes')
    .description('Associates nodes to objects.json via _id instead of id')
    .requiredOption('-io, --input-objects <path_to_file>', 'path to objects.json file')
    .requiredOption('-ig, --input-gltf <path_to_file>', 'path to gltf file')
    .requiredOption('-o, --output-gltf <path_to_file>', 'path to output gltf file')
    .action(async (options) => {
        const {inputObjects, inputGltf, outputGltf} = options;
        await renameGltfNodes(inputGltf, inputObjects, outputGltf);
    });

program
    .command('adjust-materials')
    .description('Makes materials in gltf double sided')
    .requiredOption('-i, --input-gltf <path_to_file>', 'path to gltf file')
    .requiredOption('-o, --output-gltf <path_to_file>', 'path to output folder')
    .action(async (options) => {
        const { inputGltf, outputGltf} = options;
        await adjustMaterials(inputGltf, outputGltf)
    });


(async () => {
    await program.parseAsync();
})();
