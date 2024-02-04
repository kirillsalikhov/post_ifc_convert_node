const {
    combineModifiers,
    attrs   ,
    type,
    categoryId,
    revitFamilyAttrs,
    internal,
    nodeChildren,
    dataChildren,
    typeTitle,
    singleAttr,
    nameTitle,
    dataChildrenPset,
    dataChildrenArr,
    filterDataForIV,
    customTitle
} = require("../accessors");

const ivSerializersConfig = {
    node: [combineModifiers([
        attrs,
        type,
        categoryId,
        revitFamilyAttrs,
        internal,
        nodeChildren,
        dataChildren,
        filterDataForIV
    ]), typeTitle],

    "IfcPropertySingleValue": [singleAttr("NominalValue"), nameTitle],
    "IfcQuantityLength": [singleAttr("LengthValue"), nameTitle],
    "IfcQuantityVolume": [singleAttr("VolumeValue"), nameTitle],
    "IfcQuantityArea": [singleAttr("AreaValue"), nameTitle],

    "IfcPropertySet": [combineModifiers([
        dataChildrenPset,
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

module.exports = ivSerializersConfig;
