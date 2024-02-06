const fs = require('fs');
const path = require('path');
const StreamPromises = require("stream/promises");
const {JsonStreamStringify} = require("json-stream-stringify");

//note: this is a different base64 than the one used in data uri's
const guidChars = "0123456789" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "abcdefghijklmnopqrstuvwxyz" +
    "_$";

const uint24s = new Uint32Array(6);
const gltfNameToIfcId = (gltfName) => {
    //todo: explicitly assert node-name pattern?

    // name pattern: product-b55ee828-24bc-45a5-b012-c4b3130dbdab-body
    // bytes in section:     4        2    2    2    6
    // string offset:        8 10     17  22 24 27   32    38
    //                       v v      v    v v  v    v     v
    // uint24s:              00111111-2222-2233-3333-444444555555
    //                       0..5 -> uint24s[0..5]

    // the rest is just converting 32-digit base16 number weirdly spread across the string to 22-digit base64 number.
    // (both may include leading zeroes)
    // first we convert it to 1 uint8 + 5 uint24 stored in uint32[6]
    uint24s[0] = parseInt(gltfName.slice(8, 10), 16);// (4 leading hex-zeroes) + 2 hex digits
    uint24s[1] = parseInt(gltfName.slice(10, 16), 16);// 6 hex digits
    uint24s[2] = parseInt(gltfName.slice(17, 21) + gltfName.slice(22, 24), 16);// 4 + 2 hex digits
    uint24s[3] = parseInt(gltfName.slice(24, 26) + gltfName.slice(27, 31), 16);// 2 + 4 hex digits
    uint24s[4] = parseInt(gltfName.slice(32, 38), 16);// 6 hex digits
    uint24s[5] = parseInt(gltfName.slice(38, 44), 16);// 6 hex digits
    //todo: .slice and general-case parseInt probably slows it down. Might get better perf if parsed manually.

    // then convert them to base64 one by one.
    // uint8 number in binary:  xxxxxxxx_xxxxxxxx_xxxx0000_00111111 x - are zeroes (we ignore them), 000..., 111... etc. - bits of corresponding digit in base64
    //                                                ^^^^ - these 4 are also zeroes. So the first guid char can only be 0, 1, 2 or 3
    // uint24 number in binary: xxxxxxxx_00000011_11112222_22333333
    let result = "";
    result += guidChars[uint24s[0] >> 6];
    result += guidChars[uint24s[0] & 63];
    for (let i = 1; i < 6; i++) {
        const w = uint24s[i];
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

    fs.mkdirSync(path.dirname(outputGltfName), { recursive: true })
    await writeJson(gltf, outputGltfName);
}

module.exports = {renameGltfNodes};
