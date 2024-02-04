
const getSerializer = (el, serializersConfig) => {
    if (el.isNode()) {
        return serializersConfig.node;
    }

    if (serializersConfig[el.ifcType]) {
        return serializersConfig[el.ifcType];
    }

    return serializersConfig.common;
}

exports.getSerializer = getSerializer;
