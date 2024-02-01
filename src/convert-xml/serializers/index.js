const {
    combineModifiers,
    attrs,
    internal,
    type,
    nodeChildren,
    dataChildren,
    dataChildrenArr,
    dataChildrenPset,
    typeTitle,
    nameTitle,
    customTitle,
    singleAttr,
    singleAttrWithDef,
    categoryId,
    revitFamilyAttrs
} = require("./accessors");

// key: [toJson, groupingName]
// var _serializers to store funcs, and not create them for each Element
const _serializers = {
    node: [combineModifiers([
        attrs,
        type,
        categoryId,
        revitFamilyAttrs,
        internal,
        nodeChildren,
        dataChildren
    ]), typeTitle],

    "IfcPropertySingleValue": [singleAttr("NominalValue"), nameTitle],
    "IfcQuantityLength": [singleAttrWithDef("LengthValue"), nameTitle],
    "IfcQuantityVolume": [singleAttrWithDef("VolumeValue"), nameTitle],
    "IfcQuantityArea": [singleAttrWithDef("AreaValue"), nameTitle],

    "IfcPropertySet": [combineModifiers([
        dataChildrenPset
    ]), nameTitle],
    "IfcElementQuantity": [combineModifiers([
        dataChildren
    ]), nameTitle],

    "IfcMaterialLayerSetUsage":[combineModifiers([
        attrs,
        type,
        dataChildrenArr("MaterialLayers")
    ]), customTitle("MaterialUsage")],

    "IfcMaterialLayerSet": [combineModifiers([
        attrs,
        type,
        dataChildrenArr("MaterialLayers")
    ]), customTitle("MaterialUsage")],

    "IfcMaterialList": [combineModifiers([
        attrs,
        type,
        dataChildrenArr("Materials")
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
