const {Parser} = require("./Parser");

async function convertXml(inputXml, output) {
    const parser = new Parser(inputXml);
    await parser.parse();
    for(let el of parser.iterateNodeTree()) {
        console.log(el.tagName);
    }
}

exports.convertXml = convertXml;
