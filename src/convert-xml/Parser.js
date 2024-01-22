const fs = require("fs");
const sax = require("sax");
const StreamPromises = require("stream/promises");
const {Element} = require("./Element");

class Parser {
    constructor(inputPath) {
        this.inputPath = inputPath;
    }

    async parse() {
        this.idx = {};
        this.root = new Element("_ROOT", {}, null);
        this.current = this.root;

        const saxStream = sax.createStream();
        saxStream.on("opentag", (node) => { this.newCurrentElement(node)});
        saxStream.on("text", (text) => { this.current.setText(text); });
        saxStream.on("closetag", () => { this.popCurrent() });
        saxStream.on("error", (e) => {
            console.error("error!", e);
        })

        // StreamPromises waits for "finish" event not "end"
        saxStream.once('end', () => saxStream.emit('finish'))

        await StreamPromises.pipeline(
            fs.createReadStream(this.inputPath),
            saxStream);

        console.log("!");
        // console.dir(this.root, {depth: 4});
    }

    newCurrentElement({name, attributes}) {
        const element = new Element(name, attributes, this.current);

        if (element.id) {
           this.idx[element.id] = element;
        }

        this.current = element;
    }

    popCurrent() {
        this.current = this.current.parent;
    }

    * iterateNodeTree() {

        function *traverse(children) {
            for(let element of children) {
                if (!element.isNode()) {
                    continue;
                }
                yield element;
                if (element.children) {
                    yield* traverse(element.children);
                }
            }
        }

        yield * traverse(this.getDecompositionEl().children);
    }

    getDecompositionEl() {
        return this
            .root
            .children[0] // ifc
            .children.find((x) => x.tagName === "DECOMPOSITION"); // decomposition
    }

}

exports.Parser = Parser;
