const {
    combineModifiers,
    internal,
    nodeChildren,
    typeTitle
    } = require("../accessors");

const node = [
    combineModifiers([
        internal,
        nodeChildren,
    ]), typeTitle]


const minSerializerConfig = {
    node,
    common: node
}

module.exports = minSerializerConfig;
