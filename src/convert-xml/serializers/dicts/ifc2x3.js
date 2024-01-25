// from ifc2x3
// starting from IfcRoot
// -> IfcObjectDefinition
// -> IfcObject
// -> IfcProduct
// -> IfcElement
// -> IfcBuildingElement
// https://standards.buildingsmart.org/IFC/RELEASE/IFC2x3/TC1/HTML/inheritance_index.htm

exports.hierarchyIfc2x3 = [
    'IfcBeam',
    ['IfcBuildingElementComponent',[
        'IfcBuildingElementPart',
        ['IfcReinforcingElement', [
            'IfcReinforcingBar',
            'IfcReinforcingMesh',
            'IfcTendon',
            'IfcTendonAnchor',
        ]]
    ]],
    'IfcBuildingElementProxy',
    'IfcColumn',
    'IfcCovering',
    'IfcCurtainWall',
    'IfcDoor',
    'IfcFooting',
    'IfcMember',
    'IfcPile',
    'IfcPlate',
    'IfcRailing',
    'IfcRamp',
    'IfcRampFlight',
    'IfcRoof',
    'IfcSlab',
    'IfcStair',
    'IfcStairFlight',
    ['IfcWall', ['IfcWallStandardCase']],
    'IfcWindow'
];
