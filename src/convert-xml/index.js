const fs = require('fs');
const path = require('path');
const StreamPromises = require("stream/promises");

const { JsonStreamStringify } = require('json-stream-stringify');

const {Parser} = require("./Parser");

async function convertXml(inputXml, output) {
    const parser = new Parser(inputXml);
    await parser.parse();

    // TODO revisit this, when change gltf structure (flat, rename name=>_id)
    // setting internal _id,
    // this should be done with gltf probably
    let _id = 0;
    for(let el of parser.iterateNodeTree()) {
        el.setInternalId(_id);
        _id += 1;
    }

    const result = [];
    for(let el of parser.iterateNodeTree()) {
        result.push(el.toJson());
    }

    await StreamPromises.pipeline(
        new JsonStreamStringify(result),
        fs.createWriteStream(path.join(output, 'objects.json'))
    );
}

exports.convertXml = convertXml;
