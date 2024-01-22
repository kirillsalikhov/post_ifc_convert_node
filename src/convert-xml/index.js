const fs = require('fs');
const path = require('path');
const StreamPromises = require("stream/promises");

const { JsonStreamStringify } = require('json-stream-stringify');

const {Parser} = require("./Parser");

async function convertXml(inputXml, output) {
    const parser = new Parser(inputXml);
    await parser.parse();

    const result = [];
    for(let el of parser.iterateNodeTree()) {
        result.push(el.tagName);
    }

    await StreamPromises.pipeline(
        new JsonStreamStringify(result),
        fs.createWriteStream(path.join(output, 'objects.json'))
    );
}

exports.convertXml = convertXml;
