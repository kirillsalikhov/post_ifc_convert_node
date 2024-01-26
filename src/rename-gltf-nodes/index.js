const fs = require('fs');
const StreamPromises = require("stream/promises");
const {JsonStreamStringify} = require("json-stream-stringify");

//note: this is a different base64 than the one used in data uri's
const guidChars = "0123456789" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "abcdefghijklmnopqrstuvwxyz" +
    "_$";

//uint24 would be enough but there is no such thing
const words = new Uint32Array(5);
const gltfNameToIfcId = (gltfName) => {
    //todo: explicitly assert node-name pattern?

    // name pattern: product-b55ee828-24bc-45a5-b012-c4b3130dbdab-body
    // bytes in section:     4        2    2    2    6
    // string offset:        8        17   22   27   32    38
    // firstByte + words:    bb000000-1111-1122-2222-333333444444
    //                       b - firstByte, 0..4 -> words[0..4]

    // the rest is just converting 32-digit base16 number weirdly spread across the string to 22-digit base64 number.
    // (both may include leading zeroes)
    // first we convert it to 1 uint8 + 5 uint24 stored in a number variable and uint32[5]
    // then just convert them to base64
    // uint8 is converted the same as uint24, except if it was uint24 there would be two additional leading zeroes. We don't encode them.
    // (But we do encode other leading zeroes if there are any, so no special handling for that)
    const firstByte = parseInt(gltfName.slice(8, 10), 16);
    words[0] = parseInt(gltfName.slice(10, 16), 16);
    words[1] = parseInt(gltfName.slice(17, 21) + gltfName.slice(22, 24), 16);
    words[2] = parseInt(gltfName.slice(24, 26) + gltfName.slice(27, 31), 16);
    words[3] = parseInt(gltfName.slice(32, 38), 16);
    words[4] = parseInt(gltfName.slice(38, 44), 16);
    //todo: .slice and general-case parseInt probably slows it down. Might get better perf if parsed manually.

    let result = "";
    result += guidChars[firstByte >> 6];
    result += guidChars[firstByte & 63];
    for (let i = 0; i < 5; i++) {
        const w = words[i];
        result += guidChars[w >> 18];
        result += guidChars[(w >> 12) & 63];
        result += guidChars[(w >> 6) & 63];
        result += guidChars[w & 63];
    }

    return result;
};

const writeJson = async (json, outputFileName) => {
    await StreamPromises.pipeline(
        new JsonStreamStringify(json),
        fs.createWriteStream(outputFileName)
    );
}

async function renameGltfNodes(inputGltfFileName, objectsJsonFileName, outputGltfName) {
    //todo: read stream (only need id and _id fields, not everything else)
    let fallbackId = -1;
    const renameMap = new Map(
        JSON.parse(fs.readFileSync(objectsJsonFileName, 'utf-8'))
        .map((obj) => {
            fallbackId = Math.max(obj._id, fallbackId);
            return [obj.id, obj._id.toString()];
        })
    );

    fallbackId++;

    //todo: read-write stream (don't care about most of the file, only need to replace names in nodes)
    const gltf = JSON.parse(fs.readFileSync(inputGltfFileName, 'utf-8'));

    for (const node of gltf.nodes ?? []) {
        const id = gltfNameToIfcId(node.name);
        if (!renameMap.has(id)) {
            console.warn(`no such id ${id} in ${objectsJsonFileName} (gltf node name: ${node.name})`);
            node.name = (fallbackId++).toString();
        } else {
            node.name = renameMap.get(id);
        }
    }

    await writeJson(outputGltfName);
}

module.exports = {renameGltfNodes};
