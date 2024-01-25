const {
    combineModifiers,
    attrs,
    internal,
    type,
    nodeChildren,
    dataChildren,
    typeTitle,
    nameTitle,
    dataChildrenArr,
    singleAttr,
    categoryId,
    revitFamilyAttrs
} = require("./accessors");

// key: [toJson, groupingName]
// var _serializers to store funcs, and not create them for each Element
const _serializers = {
    node: [combineModifiers([
        attrs,
        internal,
        type,
        categoryId,
        revitFamilyAttrs,
        nodeChildren,
        dataChildren
    ]), typeTitle],

    "IfcPropertySingleValue": [singleAttr("NominalValue"), nameTitle],
    "IfcQuantityLength": [singleAttr("LengthValue"), nameTitle],
    "IfcQuantityVolume": [singleAttr("VolumeValue"), nameTitle],
    "IfcQuantityArea": [singleAttr("AreaValue"), nameTitle],

    "IfcPropertySet": [combineModifiers([
        dataChildren
    ]), nameTitle],
    "IfcElementQuantity": [combineModifiers([
        dataChildren
    ]), nameTitle],

    "IfcMaterialLayerSetUsage":[combineModifiers([
        attrs,
        dataChildrenArr("MaterialLayers")
    ]), typeTitle],

    common: [combineModifiers([
        attrs,
        type,
        dataChildren
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
