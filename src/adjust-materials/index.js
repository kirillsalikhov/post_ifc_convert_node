const fs = require("fs");
const StreamPromises = require("stream/promises");
const {JsonStreamStringify} = require("json-stream-stringify");
const path = require("path");

const writeJson = async (json, outputFileName) => {
    await StreamPromises.pipeline(
        new JsonStreamStringify(json),
        fs.createWriteStream(outputFileName)
    );
}

async function adjustMaterials(inputGltfFilePath, outputGltfFilePath) {
    //todo: read-write stream (don't care about most of the file, only need to add a key to materials)
    const gltf = JSON.parse(fs.readFileSync(inputGltfFilePath, 'utf-8'));

    if (gltf.materials) {
        for (const mat of gltf.materials) {
            mat.doubleSided = true;
        }
    }

    fs.mkdirSync(path.dirname(outputGltfFilePath), { recursive: true })
    await writeJson(gltf, outputGltfFilePath);
}

module.exports = {
    adjustMaterials
};
