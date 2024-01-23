const _attrs = (el, res) => {
    Object.assign(res, el.attributes);
}

const _nodeChildren = (el, res) => {
    const childrenIds = el.nodeChildren
        .map(el => el._id);

    if (childrenIds.length) {
        res["children"] = childrenIds;
    }
}

const _dataChildren = (el, res) => {
    for (let child of el.dataChildren) {
        let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
        res[childEl.groupingName] = childEl.toJson();
    }
}

const _dataChildrenArr = (groupingName) => {
    return (el, res) => {
        for (let child of el.dataChildren) {
            let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
            res[groupingName] ||= [];
            res[groupingName].push(childEl.toJson());
        }
    }
}

const _type = (el, res) => {
    res["ifcType"] = el.ifcType;
}

const _internal = (el, res) => {
    res["_id"] = el._id;
    res["GlobalId"] = el.id;
    res["parent_id"] = el.parent._id;
}

const typeTitle = (el) => el.ifcType;
const nameTitle = (el) => el.attributes["Name"];

const combineModifiers = (schema) => {
    return (el) => {
        let res = {};
        for (const modifier of schema) {
            modifier(el, res);
        }
        return res;
    }
}

const singleAttr = (attrName) => {
    return (el) => { return el.attributes[attrName] }
}

// key: [toJson, groupingName]
// var _serializers to store funcs, and not create them for each Element
const _serializers = {
    node: [combineModifiers([
        _attrs,
        _internal,
        _type,
        _nodeChildren,
        _dataChildren
    ]), typeTitle],

    "IfcPropertySingleValue": [singleAttr("NominalValue"), nameTitle],
    "IfcQuantityLength": [singleAttr("LengthValue"), nameTitle],
    "IfcQuantityVolume": [singleAttr("VolumeValue"), nameTitle],
    "IfcQuantityArea": [singleAttr("AreaValue"), nameTitle],

    "IfcPropertySet": [combineModifiers([
        _dataChildren
    ]), nameTitle],
    "IfcElementQuantity": [combineModifiers([
        _dataChildren
    ]), nameTitle],

    "IfcMaterialLayerSetUsage":[combineModifiers([
        _attrs,
        _dataChildrenArr("MaterialLayers")
    ]), typeTitle],

    common: [combineModifiers([
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
