import os
import sys
import json
from pprint import pprint as pp

sys.path.append(os.path.join(os.path.dirname(__file__), "ifcopenshell"))

import ifcopenshell
import ifcopenshell.util.pset
import ifcopenshell.util.element
from ifcopenshell import util

from utils import erp_short_type
from units import get_unit_type

# TODO move somehere
# debug func
uniq_pp_cache = {}
def uniq_pp(o_1, o_2):
    if o_1 not in uniq_pp_cache:
        uniq_pp_cache[o_1] = o_2
        print("---")        
        pp(o_1)
        pp(o_2)

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
            **erp_short_type(attr_type), # this is merge
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
        data[pset.Name.upper()] = pset_def(pset, schema)

    if (schema.name() == "IFC2X3"):
        for extra_pset in extra_ifc2x3_psets(schema):
            data[extra_pset.get_name()] = extra_pset.as_json()

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def _prop_type_str(type_name, schema):
    # strip because there was ' IfcPowerMeasure' with leading space
    declaration = schema.declaration_by_name(type_name.strip())
    return str(declaration)

def pset_def(pset, schema):
    def _unit_type(unit):
        if (unit is None):
            return None
        if (not unit.is_a("IfcNamedUnit")):
            return None
        return unit.UnitType

    # it's needed because there are mismatches in prop names in xml
    def _propKey(prop):
        return prop.Name.upper()

    def _serialize_prop(prop):       
        return {
             **erp_short_type(_prop_type_str(prop.PrimaryMeasureType,  schema)), # merge
            "unit": _unit_type(prop.PrimaryUnit)           
        }

    pset_d = {}
    for prop in pset.HasPropertyTemplates:
        if (prop.TemplateType == "P_COMPLEX"):
            prop_d = {
                "props": {}
            }
            for sub_prop in prop.HasPropertyTemplates:
                prop_d["props"][_propKey(sub_prop)] = _serialize_prop(sub_prop)
        else:
            prop_d = _serialize_prop(prop)

        pset_d[_propKey(prop)] = prop_d

    return pset_d


class ExtraPset():
    def __init__(self, name, schema):
        self.schema = schema
        self.name = name
        self.props_defs = {}

    def add_prop(self, name, prop_type_name):
        prop_type = self.schema.declaration_by_name(prop_type_name)
        
        self.props_defs[name.upper()] = {
            **erp_short_type(str(prop_type)),
            "unit": get_unit_type(prop_type)
        }
        return self

    def get_name(self):
        return self.name.upper()

    def as_json(self):
        return self.props_defs


def extra_ifc2x3_psets(schema):
    # https://standards.buildingsmart.org/documents/Implementation/IFC_Implementation_Agreements/CV-2x3-157.html
    Pset_ProvisionForVoid = ExtraPset("Pset_ProvisionForVoid", schema) \
        .add_prop("Width", "IfcLengthMeasure") \
        .add_prop("Height", "IfcLengthMeasure") \
        .add_prop("Diameter", "IfcLengthMeasure") \
        .add_prop("Depth", "IfcLengthMeasure") \
        .add_prop("Shape", "IfcLabel") \
        .add_prop("System", "IfcLabel") \

    return [Pset_ProvisionForVoid]

GEN_PATH = "../src/convert-xml/schema/gen"

schema_name = "IFC2X3"
schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name)
serialize_psets(schema, f"{GEN_PATH}/{schema_name}/psets.json")
serialize_entity_defs(schema, f"{GEN_PATH}/{schema_name}/entities.json")
