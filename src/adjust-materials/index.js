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
            if (mat.pbrMetallicRoughness === undefined) {
                mat.pbrMetallicRoughness = {};
            }

            const isDefaultMetallicRoughness = mat.pbrMetallicRoughness.metallicFactor === 0 && mat.pbrMetallicRoughness.roughnessFactor === undefined;
            if (isDefaultMetallicRoughness) {
                const isTransparent = mat.pbrMetallicRoughness.baseColorFactor && mat.pbrMetallicRoughness.baseColorFactor[3] !== 1;
                if (isTransparent) {
                    mat.pbrMetallicRoughness.metallicFactor = 0;
                    mat.pbrMetallicRoughness.roughnessFactor = 0;
                    if (mat.pbrMetallicRoughness.extensions === undefined) {
                        mat.pbrMetallicRoughness.extensions = {};
                    }
                    if (mat.pbrMetallicRoughness.extensions.WG_dielectric_specular === undefined) {
                        mat.pbrMetallicRoughness.extensions.WG_dielectric_specular = {};
                    }
                    mat.pbrMetallicRoughness.extensions.WG_dielectric_specular.factor = 0.3;
                } else {
                    mat.pbrMetallicRoughness.metallicFactor = 0.4;
                    mat.pbrMetallicRoughness.roughnessFactor = 0.2;
                }
            }
            mat.doubleSided = true;
        }
    }

    fs.mkdirSync(path.dirname(outputGltfFilePath), { recursive: true })
    await writeJson(gltf, outputGltfFilePath);
}

module.exports = {
    adjustMaterials
};
