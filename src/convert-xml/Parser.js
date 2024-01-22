const fs = require("fs");
const sax = require("sax");
const StreamPromises = require("stream/promises");

class Parser {
    constructor(inputPath) {
        this.inputPath = inputPath;
    }

    async parse() {
        this.idx = {};
        this.root = {};
        this.current = this.root;

        const saxStream = sax.createStream();
        saxStream.on("opentag", (node) => {
            this.newCurrentElement(node)
        });
        saxStream.on("text", (text) => {
            this.setCurrentText(text)
        });
        saxStream.on("closetag", () => {
            this.popCurrent()
        });
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

    newCurrentElement(node) {
        const {name, attributes} = node;
        const element = {name, attributes};
        element.parent = this.current;


        if (attributes.ID) {
            this.idx[attributes.ID] = element;
        }

        this.current.children ||= [];
        this.current.children.push(element);
        this.current = element;
    }

    setCurrentText(text) {
        if (text && text.trim()) {
            this.current.text = text;
        }
    }

    popCurrent() {
        this.current = this.current.parent;
    }

    * iterateNodeTree() {

        function *traverse(children) {
            for(let element of children) {
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
            .children.find((x) => x.name === "DECOMPOSITION"); // decomposition
    }

}

exports.Parser = Parser;
