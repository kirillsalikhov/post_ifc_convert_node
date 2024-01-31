import os
import sys
import json
from pprint import pprint as pp

sys.path.append(os.path.join(os.path.dirname(__file__), "ifcopenshell"))

import ifcopenshell
import ifcopenshell.util.pset
import ifcopenshell.util.unit
import ifcopenshell.util.element
from ifcopenshell import util


# TODO cache somewhere
def unit_types(schema):
    # ??? may be add IfcConversionBasedUnit or other units ?
    si_unit = schema.declaration_by_name("IfcSIUnit")
    #UnitType: LenghtUnit, AreaUnit...
    unit_type = si_unit.attribute_by_index(1).type_of_attribute().declared_type()
    return unit_type.enumeration_items()


# util.unit.get_measure_unit_type just replaces some words in type name and produce UnitName
# and can produce LogicalUnit for example
# then we check that UnitName is inside possible unit_types
def get_unit_type(type_declaration):
    if (type_declaration is None):
        return None

    measure_unit_type = util.unit.get_measure_unit_type(type_declaration.name())
    if (measure_unit_type in unit_types(type_declaration.schema())):
        return measure_unit_type
    else:
        return None


def _is_type(declaration, name):
    return type(declaration).__name__ == name


def serialize_entity_defs(schema, out_path):
    data = {}
    for entity in schema.entities():
        data[entity.name()] = entity_attr_defs(entity)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def entity_attr_defs(entity):
    entity_d = {}

    for a in entity.all_attributes():
        attr_name = a.name()
        attr_type = a.type_of_attribute()

        attr_d = {
            "type": str(attr_type),
            "unit": None
        }
        entity_d[attr_name] = attr_d

        if (_is_type(attr_type, "named_type")):
            declared_type = attr_type.declared_type()
            if (_is_type(declared_type, "type_declaration")):
                attr_d["unit"] = get_unit_type(declared_type)
    return entity_d


def serialize_psets(schema, out_path):
    data = {}

    psets = util.pset.PsetQto(schema.name()).get_applicable()

    for pset in psets:
        data[pset.Name] = pset_def(pset, schema)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def pset_def(pset, shema):
    def _unit_type(unit):
        if (unit is None):
            return None
        if (not unit.is_a("IfcNamedUnit")):
            return None
        return unit.UnitType

    def _type_str(type_name):
        # strip because there was ' IfcPowerMeasure' with leading space
        declaration = schema.declaration_by_name(type_name.strip())
        return str(declaration)

    def _serialize_prop(prop):
        return {
            "name": prop.Name,
            "type": _type_str(prop.PrimaryMeasureType),
            "unit": _unit_type(prop.PrimaryUnit)
        }

    pset_d = {}
    for prop in pset.HasPropertyTemplates:
        if (prop.TemplateType == "P_COMPLEX"):
            prop_d = {
                "name": prop.Name,
                "props": {}
            }
            for sub_prop in prop.HasPropertyTemplates:
                prop_d["props"][sub_prop.Name] = _serialize_prop(sub_prop)
        else:
            prop_d = _serialize_prop(prop)

        pset_d[prop.Name] = prop_d

    return pset_d

GEN_PATH = "../src/convert-xml/schema/gen"

schema_name = "IFC2X3"
schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name)
serialize_psets(schema, f"{GEN_PATH}/{schema_name}/psets.json")
serialize_entity_defs(schema, f"{GEN_PATH}/{schema_name}/entities.json")
