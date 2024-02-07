const {
    combineModifiers,
    attrsWithDef,
    type,
    categoryId,
    revitFamilyAttrs,
    internal,
    nodeChildren,
    dataChildren,
    typeTitle,
    singleAttr,
    propTrue,
    nameTitle,
    singleAttrWithDef,
    dataChildrenPsetWithDef,
    dataChildrenArr,
    customTitle
} = require("../accessors");

const erpSerializersConfig = {
    node: [combineModifiers([
        attrsWithDef,
        type,
        categoryId,
        revitFamilyAttrs,
        internal,
        nodeChildren,
        dataChildren
    ]), typeTitle],

    "IfcPropertySingleValue": [singleAttr("NominalValue"), nameTitle],
    "IfcPropertyEnumeratedValue": [propTrue, nameTitle],

    "IfcQuantityLength": [singleAttrWithDef("LengthValue"), nameTitle],
    "IfcQuantityVolume": [singleAttrWithDef("VolumeValue"), nameTitle],
    "IfcQuantityArea": [singleAttrWithDef("AreaValue"), nameTitle],

    "IfcPropertySet": [combineModifiers([
        dataChildrenPsetWithDef
    ]), nameTitle],
    "IfcElementQuantity": [combineModifiers([
        dataChildren
    ]), nameTitle],
    "IfcPhysicalComplexQuantity": [combineModifiers([
        dataChildren
    ]), nameTitle],

    "IfcMaterialLayerSetUsage":[combineModifiers([
        attrsWithDef,
        type,
        dataChildrenArr("MaterialLayers")
    ]), customTitle("MaterialUsage")],

    "IfcMaterialLayerSet": [combineModifiers([
        attrsWithDef,
        type,
        dataChildrenArr("MaterialLayers")
    ]), customTitle("MaterialUsage")],

    "IfcMaterialList": [combineModifiers([
        attrsWithDef,
        type,
        dataChildrenArr("Materials")
    ]), typeTitle],

    common: [combineModifiers([
        attrsWithDef,
        type,
        dataChildren
    ]), typeTitle]
}

module.exports = erpSerializersConfig;
