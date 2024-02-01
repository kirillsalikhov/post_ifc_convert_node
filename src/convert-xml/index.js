const fs = require('fs');
const path = require('path');
const StreamPromises = require("stream/promises");

const fsExtra = require('fs-extra');
const { JsonStreamStringify } = require('json-stream-stringify');

const {Parser} = require("./Parser");

async function convertXml(inputXml, output) {
    const parser = new Parser(inputXml);
    await parser.readXML();
    await parser.initSchema()

    // TODO revisit this, when change gltf structure (flat, rename name=>_id)
    // setting internal _id,
    // this should be done with gltf probably
    setInternalIds(parser);

    const json = serializeJson(parser)
    await writeObjectsJson(json, output);
}

const setInternalIds = (parser) => {
    let _id = 0;
    for(let el of parser.iterateNodeTree()) {
        el.setInternalId(_id);
        _id += 1;
    }
}

const serializeJson = (parser) => {
    const json = [];
    for(let el of parser.iterateNodeTree()) {
        json.push(el.toJson());
    }
    return json;
}

const writeObjectsJson = async (json, output) => {
    await fsExtra.ensureDir(output);
    await StreamPromises.pipeline(
        new JsonStreamStringify(json),
        fs.createWriteStream(path.join(output, 'objects.json'))
    );
}

exports.convertXml = convertXml;
