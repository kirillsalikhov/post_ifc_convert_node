const _attrs = (el, res) => {
    for (const [key, value] of Object.entries(el.attributes)) {
        res[key] = value;
    }
    return res;
}

const _nodeChildren = (el, res) => {
    if (!el.children) {
        return res;
    }

    const childrenIds = el.children
        .filter(el => el.isNode())
        .map(el => el._id);

    if (childrenIds.length) {
        res["children"] = childrenIds;
    }
    return res;
}

const _dataChildren = (el, res) => {
    if (!el.children) {
        return res;
    }

    const children = el.children
        .filter(el => !el.isNode());

    for (let child of children) {
        let link = child.attributes["xlink:href"]
        if (link) {
            const childEl = el.parser.getByLink(link);
            res[childEl.groupingName] = childEl.toJson();
        } else {
            res[child.groupingName] = child.toJson();
        }
    }
    return res;
}

const _type = (el, res) => {
    res["ifcType"] = el.ifcType;
    return res;
}

const _internal = (el, res) => {
    res["_id"] = el._id;
    res["GlobalId"] = el.id;
    res["parent_id"] = el.parent._id;
    return res;
}

const typeTitle = (el) => el.ifcType;
const nameTitle = (el) => el.attributes["Name"];

const createSerializer = (schema) => {
    return (el) => {
        let res = {};
        for (const modifier of schema) {
            res = modifier(el, res);
        }
        return res;
    }
}

// this is need to cache closures
// and not create new for each element
// key: [toJson, groupingName]
const _serializers = {
    node: [createSerializer([
        _attrs,
        _internal,
        _type,
        _nodeChildren,
        _dataChildren
    ]), typeTitle],

    "IfcPropertySingleValue": [createSerializer([
        (el) => { return el.attributes["NominalValue"] }
    ]), nameTitle],

    "IfcPropertySet": [createSerializer([
        _dataChildren
    ]), nameTitle],

    common: [createSerializer([
        _attrs,
        _type,
        _dataChildren
    ]), typeTitle]
}


const getSerializer = (el) => {
    if (el.isNode()) {
        return _serializers.node;
    }

    if (_serializers[el.ifcType]) {
        return _serializers[el.ifcType];
    }

    return _serializers.common;
}

exports.getSerializer = getSerializer;
