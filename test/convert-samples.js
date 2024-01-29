const path = require('path');
const cp = require('child_process');

const CONVERTER_CLI_PATH = path.resolve(__dirname, '..', 'src', 'cli.js');
const SAMPLES_DIR_PATH = path.resolve(__dirname, '..', 'samples');
const OUTPUT_DIR_PATH = path.resolve(__dirname, '..', 'tmp');

const getConvertXmlArgs = (ifcOpenShellXml, outputPath) => [
    'convert-xml',
    '--input-xml', ifcOpenShellXml,
    '--output', outputPath
];

const getRenameGltfNodesArgs = (inputGltf, objectsJson, outputGltf) => [
    'rename-gltf-nodes',
    '--input-gltf', inputGltf,
    '--input-objects', objectsJson,
    '--output-gltf', outputGltf
];

const getDoubleSidedMaterialsArgs = (inputGltf, outputGltf) => [
    'make-gltf-materials-double-sided',
    '--input-gltf', inputGltf,
    '--output-gltf', outputGltf
];


const runFullXmlGlbPipeline = (xmlFilePath, glbFilePath, outputDirPath) => {
    const glbGltfOutputFilePath = path.join(outputDirPath, 'model.glb.gltf');
    const doubleSidedFilePath = glbGltfOutputFilePath + '.double-sided.gltf';
    const gltfFilePath = path.join(outputDirPath, 'model.gltf');
    const objectsPath = path.join(outputDirPath, 'objects.json');

    console.log(cp.spawnSync(CONVERTER_CLI_PATH, getConvertXmlArgs(xmlFilePath, outputDirPath), { encoding: 'utf-8' }));
    console.log(cp.spawnSync('npm', ['run', 'glb-gltf', '--', glbFilePath, glbGltfOutputFilePath], { shell: true, encoding: 'utf-8' }));
    console.log(cp.spawnSync(CONVERTER_CLI_PATH, getDoubleSidedMaterialsArgs(glbGltfOutputFilePath, doubleSidedFilePath), { encoding: 'utf-8' }));
    console.log(cp.spawnSync(CONVERTER_CLI_PATH, getRenameGltfNodesArgs(doubleSidedFilePath, objectsPath, gltfFilePath), {encoding: 'utf-8'}));
};


runFullXmlGlbPipeline(
    path.join(SAMPLES_DIR_PATH, 'erp-sample-big', '10116_Р_АР_published_new_2x3_view2_величины.xml'),
    path.join(SAMPLES_DIR_PATH, 'erp-sample-big', '10116_Р_АР_published_new_2x3_view2_величины.glb'),
    path.join(OUTPUT_DIR_PATH, 'erp-sample-big'),
);
