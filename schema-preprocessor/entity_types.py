import ifcopenshell.util.type
from ifcopenshell import util
from utils import write_json


def serialize_entity_type_map(schema, out_path):
    data = entity_type_map(schema)
    write_json(data, out_path)


def entity_type_map(schema):
    root = schema.declaration_by_name("IfcElement")
    idx = {}

    def _traverse(element):
        name = element.name()
        idx[name] = util.type.get_applicable_types(name, schema.name())
        for subtype in element.subtypes():
            _traverse(subtype)

    _traverse(root)
    return idx


def serialize_entity_ancestors(schema, out_path):
    data = inheritance_map(schema)
    write_json(data, out_path)


# Get ancestors till two levels down from IfcElement 
# e.g. (IfcWallStandardCase => IfcWall ; IfcElement->IfcBuildingElement->IfcWall)
# https://standards.buildingsmart.org/IFC/DEV/IFC4_2/FINAL/HTML/schema/ifcproductextension/lexical/ifcelement.htm
def inheritance_map(schema):
    ifcElement = schema.declaration_by_name("IfcElement")
    
    idx = {}
    def _traverse(el, ancestors=[]):
        name = el.name()
        ancestors = [name] + ancestors
        idx[name] = ancestors
        for subtype in el.subtypes():            
            _traverse(subtype, ancestors)
    
    # BuildingElement, CivilElement 
    for first_level in ifcElement.subtypes(): 
        # IfcWall, IfcDoor ...
        for second_level in first_level.subtypes():
            _traverse(second_level)

    return idx