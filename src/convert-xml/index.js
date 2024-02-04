const fs = require('fs');
const path = require('path');
const StreamPromises = require("stream/promises");

const fsExtra = require('fs-extra');
const { JsonStreamStringify } = require('json-stream-stringify');

const { defaultSerializersConfigName, serializersConfigsMap} = require('./serializers/configs');

const {Parser} = require("./Parser");

async function convertXml(inputXml, output, serializerName = defaultSerializersConfigName) {
    const serializersConfig = serializersConfigsMap[serializerName];
    if (serializersConfig === undefined) {
        throw new Error(`unknown serializer name "${serializerName}"`);
    }

    const parser = new Parser(inputXml, serializersConfig);
    await parser.readXML();
    await parser.initSchema()

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
