module.exports = ({ xml, glb, doubleSided, output}) => {
    const commandLines = [];
    commandLines.push(`src/cli.js convert-xml --input-xml ${xml} --output ${output}`);

    const intermediateFiles = [];
    let currentGltfName = `model.glb.gltf`;
    intermediateFiles.push(currentGltfName);
    commandLines.push(`npx @gltf-transform/cli copy --vertex-layout separate ${glb} ${output}/${currentGltfName}`);
    if (doubleSided) {
        const nextGltfName = currentGltfName + '.adjusted-materials.gltf';
        commandLines.push(`src/cli.js adjust-materials --input-gltf ${output}/${currentGltfName} --output-gltf ${output}/${nextGltfName}`);
        currentGltfName = nextGltfName;
        intermediateFiles.push(currentGltfName);
    }
    commandLines.push(`src/cli.js rename-gltf-nodes --input-gltf ${output}/${currentGltfName} --input-objects ${output}/objects.json --output-gltf ${output}/model.gltf`);

    // cleanup
    const intermediate = `${output}/intermediate`;
    commandLines.push(`mkdir -p ${intermediate}`);
    for (const file of intermediateFiles) {
        commandLines.push(`mv ${output}/${file} ${intermediate}/${file}`);
    }
    return commandLines.join(' && ');
};
