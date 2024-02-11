const {
    combineModifiers,
    internal,
    nodeChildren,
    typeTitle,
} = require("../accessors");

const id = (el, res) => res["id"] = el.attributes.id;

const node = [
    combineModifiers([
        id,
        internal,
        nodeChildren,
    ]), typeTitle]


const minSerializerConfig = {
    node,
    common: node
}

module.exports = minSerializerConfig;
